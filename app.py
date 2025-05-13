from flask import Flask, render_template, request, jsonify, url_for
from flask_mysqldb import MySQL
import json
import os
from config import Config

app = Flask(__name__, static_folder='static', template_folder='templates')

app.config.from_object(Config)

# Initialize MySQL
mysql = MySQL(app)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/generate_questions', methods=['POST'])
def generate_questions():
    data = request.json
    syllabus = data.get('syllabus', '')
    difficulty = data.get('difficulty', 'medium')
    num_questions = data.get('num_questions', 5)
    question_style = data.get('question_style', 'mixed')

    # Connect to MySQL to retrieve any existing questions matching these criteria
    cur = mysql.connection.cursor()
    cur.execute("""
        SELECT question, marks, btl FROM questions 
        WHERE difficulty = %s 
        LIMIT %s
    """, (difficulty, num_questions))

    existing_questions = cur.fetchall()
    cur.close()

    # If we have enough existing questions, use them
    questions = []
    if existing_questions and len(existing_questions) >= num_questions:
        for i, q in enumerate(existing_questions[:num_questions]):
            # Since we're using DictCursor, access by key instead of index
            questions.append({
                'srNo': i + 1,
                'question': q['question'],
                'marks': q['marks'],
                'btl': q['btl']
            })
    else:
        # Simulate question generation
        questions = simulate_question_generation(syllabus, difficulty, num_questions, question_style)

        # Save the generated questions to the database
        save_questions_to_db(syllabus, questions, difficulty)

    return jsonify(questions)


@app.route('/api/save_question', methods=['POST'])
def save_question():
    data = request.json
    syllabus = data.get('syllabus', '')
    question = data.get('question', '')
    difficulty = data.get('difficulty', 'medium')
    marks = data.get('marks', 0)
    btl = data.get('btl', 1)

    try:
        cur = mysql.connection.cursor()
        cur.execute("""
            INSERT INTO questions (syllabus, question, difficulty, marks, btl)
            VALUES (%s, %s, %s, %s, %s)
        """, (syllabus, question, difficulty, marks, btl))
        mysql.connection.commit()
        cur.close()
        return jsonify({'success': True, 'message': 'Question saved successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/save_questions', methods=['POST'])
def save_questions():
    data = request.json
    syllabus = data.get('syllabus', '')
    questions = data.get('questions', [])

    if not questions:
        return jsonify({'success': False, 'message': 'No questions provided'}), 400

    try:
        cur = mysql.connection.cursor()
        inserted_count = 0

        for question_data in questions:
            question = question_data.get('question', '')
            difficulty = question_data.get('difficulty', 'medium')
            marks = question_data.get('marks', 0)
            btl = question_data.get('btl', 1)

            cur.execute("""
                INSERT INTO questions (syllabus, question, difficulty, marks, btl)
                VALUES (%s, %s, %s, %s, %s)
            """, (syllabus, question, difficulty, marks, btl))
            inserted_count += 1

        mysql.connection.commit()
        cur.close()
        return jsonify({
            'success': True,
            'message': f'{inserted_count} questions saved successfully'
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/get_questions', methods=['GET'])
def get_questions():
    difficulty = request.args.get('difficulty', 'medium')
    limit = request.args.get('limit', 20)

    cur = mysql.connection.cursor()
    cur.execute("""
        SELECT id, syllabus, question, difficulty, marks, btl
        FROM questions
        WHERE difficulty = %s
        ORDER BY id DESC
        LIMIT %s
    """, (difficulty, int(limit)))

    questions = cur.fetchall()  # With DictCursor, this will return dictionaries
    cur.close()

    return jsonify(questions)


def simulate_question_generation(syllabus, difficulty, num_questions, style):
    # This simulates the question generation
    questions = []

    # Simple topic extraction
    topics = [word.strip() for word in syllabus.replace('\n', ' ').replace('.', ' ').split(',')]
    topics = [t for t in topics if len(t) > 3][:10]

    if not topics:
        topics = ["Computer Science", "Programming", "Data Structures", "Algorithms"]

    # Difficulty mappings
    btl_mapping = {
        'easy': [1, 2],
        'medium': [3, 4],
        'hard': [5, 6]
    }

    marks_mapping = {
        'easy': [2, 5],
        'medium': [5, 10],
        'hard': [10, 15]
    }

    # Generate questions
    import random

    difficulty_phrases = {
        'easy': ["Explain", "Define", "Describe", "List", "Identify"],
        'medium': ["Compare", "Analyze", "Illustrate", "Examine", "Apply"],
        'hard': ["Evaluate", "Critique", "Design", "Develop", "Formulate"]
    }

    for i in range(num_questions):
        topic = topics[i % len(topics)]
        verb = random.choice(difficulty_phrases[difficulty])

        if style == 'conceptual' or (style == 'mixed' and random.choice([True, False])):
            template = random.choice([
                "{verb} the concept of {topic} with suitable examples.",
                "What are the key principles of {topic}?",
                "{verb} how {topic} works in a practical setting."
            ])
        else:
            template = random.choice([
                "How would you apply {topic} to solve a real-world problem?",
                "Design a system that utilizes {topic} to improve efficiency.",
                "Critically evaluate the limitations of {topic}."
            ])

        question = template.replace('{topic}', topic).replace('{verb}', verb)
        btl = random.choice(btl_mapping[difficulty])
        marks = random.choice(marks_mapping[difficulty])

        questions.append({
            'srNo': i + 1,
            'question': question,
            'marks': marks,
            'btl': btl
        })

    return questions


def save_questions_to_db(syllabus, questions, difficulty):
    try:
        cur = mysql.connection.cursor()
        for q in questions:
            cur.execute("""
                INSERT INTO questions (syllabus, question, difficulty, marks, btl)
                VALUES (%s, %s, %s, %s, %s)
            """, (syllabus, q['question'], difficulty, q['marks'], q['btl']))
        mysql.connection.commit()
        cur.close()
    except Exception as e:
        print(f"Error saving questions to DB: {e}")


if __name__ == '__main__':
    app.run(debug=True)