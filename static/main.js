document.addEventListener('DOMContentLoaded', function() {
    const classInput = document.getElementById('class-input');
    const maxTimeInput = document.getElementById('max-time-input');
    const courseNameInput = document.getElementById('course-name-input');
    const departmentInput = document.getElementById('department-input');
    const syllabusInput = document.getElementById('syllabus-input');
    const generateBtn = document.getElementById('generate-btn');
    const questionTable = document.getElementById('question-table');
    const questionBody = document.getElementById('question-body');
    const addRowBtn = document.getElementById('add-row-btn');
    const deleteRowBtn = document.getElementById('delete-row-btn');
    const saveBtn = document.getElementById('save-btn');
    const exportBtn = document.getElementById('export-btn');
    const saveToDbBtn = document.getElementById('save-to-db-btn');
    const loadingElement = document.getElementById('loading');
    const difficultySelect = document.getElementById('difficulty');
    const numQuestionsInput = document.getElementById('num-questions');
    const questionStyleSelect = document.getElementById('question-style');

    // Function to calculate total marks from the question table
    function calculateTotalMarks() {
    const rows = questionBody.getElementsByTagName('tr');
    let totalMarks = 0;
    
    for (let i = 0; i < rows.length; i++) {
        const marksCell = rows[i].cells[2];
        const marks = parseInt(marksCell.textContent) || 0;
        totalMarks += marks;
    }
    
    return totalMarks;
}
    
    let selectedRow = null;
    
    // Generate questions using an AI-based service
    generateBtn.addEventListener('click', async function() {
        const syllabus = syllabusInput.value.trim();
        if (!syllabus) {
            alert("Please enter syllabus details");
            return;
        }
        
        // Show loading indicator
        loadingElement.style.display = 'block';
        generateBtn.disabled = true;
        
        try {
            // In a real application, you would call an API here
            // For demonstration, we'll simulate an API call with a timeout
            await generateQuestionsFromAI(
                syllabus, 
                difficultySelect.value,
                parseInt(numQuestionsInput.value),
                questionStyleSelect.value
            );
        } catch (error) {
            console.error("Error generating questions:", error);
            alert("Failed to generate questions. Please try again.");
        } finally {
            // Hide loading indicator
            loadingElement.style.display = 'none';
            generateBtn.disabled = false;
        }
    });
    
    // Simulate AI-based question generation
    async function generateQuestionsFromAI(syllabus, difficulty, numQuestions, style) {
        try {
            const response = await fetch('/api/generate_questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    syllabus: syllabus,
                    difficulty: difficulty,
                    num_questions: numQuestions,
                    question_style: style
                })
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }

            const questions = await response.json();

            // Clear existing questions
            questionBody.innerHTML = '';

            // Show the table
            questionTable.style.display = 'table';

            // Add generated questions to the table
            questions.forEach(q => {
                addTableRow(q.srNo, q.question, q.marks, q.btl);
            });

        } catch (error) {
            console.error("Error fetching questions from API:", error);

            // Fallback to client-side generation if API fails
            fallbackClientSideGeneration(syllabus, difficulty, numQuestions, style);
        }
    }

    // Fallback client-side generation in case API call fails
    function fallbackClientSideGeneration(syllabus, difficulty, numQuestions, style) {
        // Clear existing questions
        questionBody.innerHTML = '';

        // Show the table
        questionTable.style.display = 'table';

        // Enhanced BTL mapping with proper cognitive levels
        const btlLevels = {
            'easy': [
                {level: 1, name: "Remember"},
                {level: 2, name: "Understand"}
            ],
            'medium': [
                {level: 3, name: "Apply"},
                {level: 4, name: "Analyze"}
            ],
            'hard': [
                {level: 5, name: "Evaluate"},
                {level: 6, name: "Create"}
            ]
        };

        const marksMapping = {
            'easy': [2, 3, 4, 5],
            'medium': [5, 6, 8, 10],
            'hard': [8, 10, 12, 15]
        };

        // Parse syllabus to extract potential topics
        const topics = extractTopics(syllabus);
        
        // Used to track which question templates have been used
        const usedTemplateIndexes = new Set();
        const usedTopics = new Set();
        
        for (let i = 0; i < numQuestions; i++) {
            // Select a topic that hasn't been used yet if possible
            let topic;
            const availableTopics = topics.filter(t => !usedTopics.has(t));
            if (availableTopics.length > 0) {
                topic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
                usedTopics.add(topic);
            } else {
                // Reset used topics if we've used them all
                usedTopics.clear();
                topic = topics[Math.floor(Math.random() * topics.length)];
                usedTopics.add(topic);
            }
            
            // Select BTL level based on difficulty
            const btlRange = btlLevels[difficulty];
            const btlInfo = btlRange[Math.floor(Math.random() * btlRange.length)];
            const btl = btlInfo.level;
            
            // Generate a question with specific BTL level
            const question = generateQuestionForBTL(
                topic, 
                style, 
                btl, 
                btlInfo.name, 
                usedTemplateIndexes
            );
            
            const marksRange = marksMapping[difficulty];
            const marks = marksRange[Math.floor(Math.random() * marksRange.length)];

            addTableRow(i+1, question, marks, btl);
        }
    }

    // Extract topics from syllabus (improved)
    function extractTopics(syllabus) {
        // Split by common delimiters in syllabi
        const chunks = syllabus.split(/[,.\n;:()]/);
        
        // Process each chunk to identify potential topics
        const topics = [];
        
        chunks.forEach(chunk => {
            const words = chunk.trim().split(/\s+/);
            
            // Consider phrases that are likely to be topics (2-4 words)
            if (words.length >= 2 && words.length <= 6 && chunk.trim().length > 8) {
                topics.push(chunk.trim());
            }
            
            // Also consider single significant words (likely technical terms)
            words.forEach(word => {
                if (word.length > 5 && /^[A-Z]/.test(word)) {
                    topics.push(word.trim());
                }
            });
        });
        
        // Filter and deduplicate topics
        const uniqueTopics = [...new Set(topics)].filter(t => t.length > 0);
        
        // Fallback if no good topics were found
        return uniqueTopics.length > 5 ? uniqueTopics : [
            "Computer Science", "Programming", "Data Structures", 
            "Algorithms", "Software Engineering", "Computer Networks",
            "Database Management", "Operating Systems", "Cloud Computing",
            "Artificial Intelligence", "Machine Learning"
        ];
    }

    // Generate a question for a specific BTL level with better diversity
    function generateQuestionForBTL(topic, style, btlLevel, btlName, usedTemplateIndexes) {
        // Comprehensive mapping of BTL levels to specific cognitive verbs
        const btlVerbs = {
            1: [ // Remember
                "What is", "Define", "List", "State", "Name", "Identify", 
                "Who", "When", "Where", "Which", "Recall", "Recognize",
                "Label", "Match", "What are", "Outline"
            ],
            2: [ // Understand
                "Explain", "Describe", "Discuss", "Interpret", "Summarize", 
                "Clarify", "Illustrate", "Compare", "Contrast", "Classify",
                "Categorize", "Paraphrase", "How would you", "What are the differences between",
                "What is the main idea of"
            ],
            3: [ // Apply
                "How would you use", "Apply", "Demonstrate", "Calculate", "Solve", 
                "Implement", "Show how", "How would you implement", "Modify",
                "How can", "Develop", "How will you", "What factors would you", 
                "Construct", "How would you demonstrate"
            ],
            4: [ // Analyze
                "Analyze", "Examine", "Distinguish", "Compare and contrast", "Differentiate",
                "What is the relationship between", "What evidence can you find",
                "What are the parts of", "Why does", "How does", 
                "What conclusions can you draw", "How would you classify",
                "Outline the differences between", "What inference can you make"
            ],
            5: [ // Evaluate
                "Evaluate", "Assess", "Critique", "Justify", "Judge",
                "To what extent", "What is your opinion on", "How effective is",
                "How would you determine", "What criteria would you use to assess",
                "Which option would be better", "Why do you think", "How would you prioritize",
                "What is the most important", "Do you agree that"
            ],
            6: [ // Create
                "Design", "Develop", "Create", "Propose", "Formulate",
                "How would you design", "What would happen if", "Can you devise",
                "How would you test", "Suggest", "How can we improve",
                "What changes would you make", "How would you integrate",
                "What solution would you suggest for", "How might"
            ]
        };

        // Extensive templates organized by Bloom's taxonomy level
        const templatesByBTL = {
            // Remember (Level 1)
            1: [
                "{verb} {topic}?",
                "{verb} the key components of {topic}?",
                "{verb} the fundamental principles of {topic}?",
                "{verb} the basic terms related to {topic}?",
                "{verb} the primary characteristics of {topic}?",
                "{verb} the historical development of {topic}?",
                "{verb} the major elements of {topic}?",
                "{verb} the classification system used for {topic}?",
                "{verb} the standard notation used in {topic}?",
                "{verb} the essential facts about {topic}?",
                "{verb} the terminology commonly used in {topic}?",
                "{verb} the different types of {topic}?",
                "{verb} the pioneers who contributed to {topic}?"
            ],
            
            // Understand (Level 2)
            2: [
                "{verb} {topic}?",
                "{verb} how {topic} works in a practical context?",
                "{verb} the significance of {topic} in the field?",
                "{verb} the relationship between {topic} and related concepts?",
                "{verb} the concept of {topic} with suitable examples?",
                "{verb} the purpose and benefits of {topic}?",
                "{verb} how {topic} evolved over time?",
                "{verb} why {topic} is important in modern applications?",
                "{verb} how {topic} differs from similar concepts?",
                "{verb} the underlying ideas behind {topic}?",
                "{verb} the main challenges associated with implementing {topic}?"
            ],
            
            // Apply (Level 3)
            3: [
                "{verb} {topic} to solve the following problem?",
                "{verb} the principles of {topic} in a real-world situation?",
                "{verb} {topic} to improve an existing system?",
                "{verb} {topic} to calculate the optimal solution?",
                "{verb} {topic} in a scenario where resources are limited?",
                "{verb} a solution based on {topic} for the given problem?",
                "{verb} {topic} to predict outcomes in the given case study?",
                "{verb} {topic} techniques to troubleshoot the following issue?"
            ],
            
            // Analyze (Level 4)
            4: [
                "{verb} {topic}?",
                "{verb} the components of {topic} and their interrelationships?",
                "{verb} the strengths and weaknesses of different {topic} approaches?",
                "{verb} a case study involving {topic}?",
                "{verb} how {topic} impacts system architecture?",
                "{verb} the factors that influence the effectiveness of {topic}?",
                "{verb} the trade-offs involved in choosing {topic} over alternatives?",
                "{verb} how different implementations of {topic} compare in terms of efficiency?",
                "{verb} the patterns in data related to {topic}?"
            ],
            
            // Evaluate (Level 5)
            5: [
                "{verb} {topic}?",
                "{verb} the effectiveness of {topic} in modern computing environments?",
                "{verb} different approaches to implementing {topic}?",
                "{verb} the long-term viability of {topic} in the industry?",
                "{verb} whether {topic} meets the requirements for a given application?",
                "{verb} the reliability of {topic} in mission-critical systems?",
                "{verb} the cost-benefit ratio of implementing {topic}?",
                "{verb} the impact of {topic} on user experience?"
            ],
            
            // Create (Level 6)
            6: [
                "{verb} {topic}?",
                "{verb} a new approach to {topic} that addresses current limitations?",
                "{verb} an innovative application of {topic} for a future scenario?",
                "{verb} a framework that integrates {topic} with emerging technologies?",
                "{verb} a solution that uses {topic} to solve an unsolved problem?",
                "{verb} a system architecture that optimizes {topic} implementation?",
                "{verb} a strategy to address known weaknesses in {topic}?",
                "{verb} a comprehensive solution that leverages {topic} in a novel way?"
            ]
        };
        // Style-specific modifiers
        const styleModifiers = {
            'conceptual': [
                "From a theoretical perspective, ",
                "Considering the conceptual framework, ",
                "In terms of fundamental principles, ",
                "From an academic standpoint, ",
                "Within the theoretical domain, "
            ],
            'application': [
                "In a practical context, ",
                "From an implementation perspective, ",
                "With a focus on real-world applications, ",
                "From an industry standpoint, ",
                "In terms of practical usage, "
            ],
            'critical': [
                "Through a critical lens, ",
                "Taking a reflective approach, ",
                "From an analytical perspective, ",
                "With critical evaluation in mind, ",
                "Adopting a critical stance, "
            ]
        };

        // Get verbs for the specific BTL level
        const verbs = btlVerbs[btlLevel];
        const verb = verbs[Math.floor(Math.random() * verbs.length)];

        // Get templates for the specific BTL level
        const templates = templatesByBTL[btlLevel];

        // Find an unused template if possible
        let templateIndex;
        const availableIndexes = Array.from({ length: templates.length }, (_, i) => i)
            .filter(i => !usedTemplateIndexes.has(i));
            
        if (availableIndexes.length > 0) {
            templateIndex = availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
        } else {
            // Reset used templates if we've used them all
            usedTemplateIndexes.clear();
            templateIndex = Math.floor(Math.random() * templates.length);
        }

        usedTemplateIndexes.add(templateIndex);
        const template = templates[templateIndex];

        // Generate question with proper format - removing style modifiers to keep questions general
        let question = template.replace('{topic}', topic).replace('{verb}', verb);

        // Ensure first character is uppercase
        if (question.charAt(0).toLowerCase() === question.charAt(0)) {
            question = question.charAt(0).toUpperCase() + question.slice(1);
        }

        return question;
    }

    // Add a new row to the table
    function addTableRow(srNo, question, marks, btl) {
        const tr = document.createElement('tr');

        const srNoCell = document.createElement('td');
        srNoCell.textContent = srNo;

        const questionCell = document.createElement('td');
        questionCell.className = 'edit-cell';
        questionCell.contentEditable = true;
        questionCell.textContent = question;

        const marksCell = document.createElement('td');
        marksCell.className = 'edit-cell';
        marksCell.contentEditable = true;
        marksCell.textContent = marks;

        const btlCell = document.createElement('td');
        btlCell.className = 'edit-cell';
        btlCell.contentEditable = true;
        btlCell.textContent = btl;

        tr.appendChild(srNoCell);
        tr.appendChild(questionCell);
        tr.appendChild(marksCell);
        tr.appendChild(btlCell);

        questionBody.appendChild(tr);
    }

    // Add a new empty row
    addRowBtn.addEventListener('click', function() {
        // Show the table if it's not already visible
        if (questionTable.style.display !== 'table') {
            questionTable.style.display = 'table';
        }

        const rowCount = questionBody.getElementsByTagName('tr').length;
        addTableRow(rowCount + 1, "", "", "");
    });

    // Delete selected row
    deleteRowBtn.addEventListener('click', function() {
        if (selectedRow) {
            questionBody.removeChild(selectedRow);
            renumberRows();
            selectedRow = null;

            // Hide table if no rows left
            if (questionBody.getElementsByTagName('tr').length === 0) {
                questionTable.style.display = 'none';
            }
        } else {
            alert("Please select a row to delete");
        }
    });

    // Handle row selection
    questionBody.addEventListener('click', function(e) {
        const tr = e.target.closest('tr');
        if (tr) {
            // Remove selected class from any previously selected row
            const selectedRows = document.querySelectorAll('tr.selected');
            selectedRows.forEach(row => row.classList.remove('selected'));

            // Add selected class to the clicked row
            tr.classList.add('selected');
            selectedRow = tr;
        }
    });

    // Renumber rows after deletion
    function renumberRows() {
        const rows = questionBody.getElementsByTagName('tr');
        for (let i = 0; i < rows.length; i++) {
            rows[i].cells[0].textContent = i + 1;
        }
    }

    // Save to Database functionality
    saveToDbBtn.addEventListener('click', async function() {
        // Check if there are questions to save
        if (questionBody.children.length === 0) {
            alert("Please generate or add questions first");
            return;
        }

        // Show loading indicator
        loadingElement.style.display = 'block';
        saveToDbBtn.disabled = true;

        try {
            const rows = questionBody.getElementsByTagName('tr');
            const syllabus = syllabusInput.value.trim();
            const difficulty = difficultySelect.value;

            // Prepare questions data
            const questions = [];
            for (let i = 0; i < rows.length; i++) {
                const cells = rows[i].getElementsByTagName('td');
                questions.push({
                    question: cells[1].textContent,
                    marks: parseInt(cells[2].textContent) || 0,
                    btl: parseInt(cells[3].textContent) || 1,
                    difficulty: difficulty
                });
            }

            // Send data to server
            const response = await fetch('/api/save_questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    syllabus: syllabus,
                    questions: questions
                })
            });

            const result = await response.json();

            if (result.success) {
                alert(result.message);
            } else {
                alert("Error: " + result.message);
            }

        } catch (error) {
            console.error("Error saving to database:", error);
            alert("Failed to save to database. Please try again.");
        } finally {
            // Hide loading indicator
            loadingElement.style.display = 'none';
            saveToDbBtn.disabled = false;
        }
    });
    
    // Save as PDF functionality - MODIFIED to match the I²IT format
    saveBtn.addEventListener('click', function() {
        // Check if there are questions to save
        if (questionBody.children.length === 0) {
            alert("Please generate or add questions first");
            return;
        }
        
        try {
            // Get the jsPDF instance
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Add white background
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, 210, 297, 'F');
            
            // Add logo if available
            try {
                doc.addImage('/static/logo.png', 'PNG', 5, 5, 30, 30);
            } catch (logoError) {
                console.warn("Logo image not found, continuing without logo:", logoError);
            }
            
            // Set header formatting based on the I²IT template
            doc.setDrawColor(0);  // Black lines
            doc.setLineWidth(0.5);
            
            // Draw horizontal lines for the header
            doc.line(5, 5, 205, 5);  // Top border
            doc.line(5, 35, 205, 35); // Below institution name
            doc.line(5, 45, 205, 45); // Below department
            doc.line(5, 55, 205, 55); // Below academic year
            
            // Add title text in the header
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0);  // Black text
            doc.setFontSize(16);
            doc.text("Hope Foundation's", 105, 15, { align: "center" });
            
            // Add I²IT name with superscript
            doc.setFontSize(14);
            const instituteName = "International Institute of Information Technology (I²IT), Pune";
            doc.text(instituteName, 105, 25, { align: "center" });
            
            // Add department and academic year
            // Add department and academic year
            doc.setFontSize(12);
            doc.text("DEPARTMENT OF " + departmentInput.value.toUpperCase(), 105, 40, { align: "center" });
            doc.text("Academic Year 2024-25 Semester II", 105, 50, { align: "center" });
            
            // Add class, date, and marks information with table-like formatting
            doc.line(5, 65, 205, 65);
            doc.line(5, 75, 205, 75);
            doc.line(105, 55, 105, 75); // Vertical line dividing the rows
            
            doc.setFontSize(10);
            doc.text("Class: " + classInput.value, 10, 60);
            doc.text("Max. Marks: " + calculateTotalMarks(), 110, 60);
            
            // Add date and time
            const today = new Date();
            const dateStr = today.toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            doc.text("Day & Date : " + dateStr, 10, 70);
            doc.text("Max. Time: " + maxTimeInput.value + " Hour" + (maxTimeInput.value != 1 ? "s" : ""), 110, 70);
            
            // Add course name
            doc.text("Course Name: " + courseNameInput.value, 10, 80);
                        
            // Add instructions section
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text("Instructions:", 10, 95);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            
            const instructions = [
                "1. Attempt all the questions",
                "2. Marks are indicated against each question.",
                "3. BTL (Bloom's Taxonomy Level) indicates the cognitive level of the question.",
                "4. Write clearly and organize your answers appropriately."
            ];
            
            let yPos = 100;
            instructions.forEach(instruction => {
                doc.text(instruction, 10, yPos);
                yPos += 5;
            });
            
            // Create array of questions for the table
            const tableData = [];
            const rows = questionBody.getElementsByTagName('tr');
            for (let i = 0; i < rows.length; i++) {
                const cells = rows[i].getElementsByTagName('td');
                tableData.push([
                    cells[0].textContent,
                    cells[1].textContent,
                    cells[2].textContent,
                    cells[3].textContent
                ]);
            }
            
            // Add table with improved styling
            doc.autoTable({
                head: [['Q.No', 'Question', 'Marks', 'BTL']],
                body: tableData,
                startY: 120,
                theme: 'grid',
                headStyles: {
                    fillColor: [255, 255, 255],
                    textColor: 0,
                    fontStyle: 'bold',
                    halign: 'center',
                    lineWidth: 0.3,
                    lineColor: [0, 0, 0]
                },
                columnStyles: {
                    0: { cellWidth: 15, halign: 'center' },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 20, halign: 'center' },
                    3: { cellWidth: 20, halign: 'center' }
                },
                styles: {
                    overflow: 'linebreak',
                    cellPadding: 4,
                    fontSize: 10,
                    textColor: [0, 0, 0],
                    lineWidth: 0.3,
                    lineColor: [0, 0, 0]
                },
                alternateRowStyles: {
                    fillColor: [255, 255, 255]
                },
                didDrawPage: function(data) {
                    // Add footer on each page
                    const pageCount = doc.internal.getNumberOfPages();
                    doc.setFontSize(8);
                    doc.setTextColor(0);
                    doc.text('Page ' + data.pageNumber + ' of ' + pageCount, data.settings.margin.left, doc.internal.pageSize.height - 10);
                    
                    // Add footer line
                    doc.setDrawColor(0);
                    doc.line(10, doc.internal.pageSize.height - 15, 200, doc.internal.pageSize.height - 15);
                }
            });
            
            // Save PDF with a descriptive filename
            const fileName = "Question_Paper_" + today.toISOString().split('T')[0] + ".pdf";
            doc.save(fileName);
            
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF. Please try again.");
        }
    });
    
    // Export to Excel functionality - Modified for formatting
    exportBtn.addEventListener('click', function() {
        // Check if there are questions to export
        if (questionBody.children.length === 0) {
            alert("Please generate or add questions first");
            return;
        }
        
        try {
            // Create worksheet data with header info
            // Inside the Excel export section, update the ws_data array:
        const ws_data = [
            ['Hope Foundation\'s'],
            ['International Institute of Information Technology (I²IT), Pune'],
            ['DEPARTMENT OF INFORMATION TECHNOLOGY'],
            ['Academic Year 2024-25 Semester II'],
            [''],
            ['Class: ' + classInput.value, 'Max. Marks: ' + calculateTotalMarks()],
            ['Day & Date: ' + new Date().toLocaleDateString('en-US', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'}), 'Max. Time: ' + maxTimeInput.value + ' Hour' + (maxTimeInput.value != 1 ? 's' : '')],
            ['Course Name: ' + courseNameInput.value],
            ['Department: ' + departmentInput.value],
            [''],
            ['Instructions:'],
            ['1. Attempt all the questions'],
            ['2. Marks are indicated against each question.'],
            ['3. BTL (Bloom\'s Taxonomy Level) indicates the cognitive level of the question.'],
            ['4. Write clearly and organize your answers appropriately.'],
            [''],
            ['Q.No', 'Question', 'Marks', 'BTL']
        ];
            
        // Add question data
        const rows = questionBody.getElementsByTagName('tr');
        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].getElementsByTagName('td');
            ws_data.push([
                cells[0].textContent,
                cells[1].textContent,
                cells[2].textContent,
                cells[3].textContent
            ]);
        }
            
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(ws_data);
            
        // Set column widths
        const wscols = [
            {wch: 5},  // Q.No width
            {wch: 70}, // Question width
            {wch: 7},  // Marks width
            {wch: 5}   // BTL width
        ];
        ws['!cols'] = wscols;
            
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, "Question Paper");
            
        // Generate Excel file
        const today = new Date();
        const fileName = "Question_Paper_" + today.toISOString().split('T')[0] + ".xlsx";
        XLSX.writeFile(wb, fileName);
            
        } catch (error) {
            console.error("Error exporting to Excel:", error);
            alert("Failed to export to Excel. Please try again.");
        }
    });
    
    // Add event listeners for total marks calculation
    questionBody.addEventListener('input', function(e) {
        if (e.target.cellIndex === 2) { // Marks column
            // Recalculate total marks whenever marks are changed
            const totalMarks = calculateTotalMarks();
            console.log("Total marks updated:", totalMarks);
        }
    });
    
    // Initialize the UI
    questionTable.style.display = 'none'; // Hide table initially
    
    // Function to detect existing questions in DB (simplified simulation)
    async function checkExistingQuestions() {
        try {
            // In a real application, you would call an API here
            const response = await fetch('/api/get_question_count', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.count > 0) {
                // Update the UI to show that questions exist
                const infoElement = document.createElement('div');
                infoElement.className = 'info-message';
                infoElement.textContent = `${data.count} questions already exist in the database. You can generate more or modify existing ones.`;
                document.querySelector('.container').insertBefore(infoElement, loadingElement);
                
                // Auto-fill the first field if syllabus exists
                if (data.syllabus) {
                    syllabusInput.value = data.syllabus;
                }
            }
        } catch (error) {
            console.warn("Could not check for existing questions:", error);
            // Fail silently - this is just a convenience feature
        }
    }
    
    // Call this function on page load
    checkExistingQuestions();
});