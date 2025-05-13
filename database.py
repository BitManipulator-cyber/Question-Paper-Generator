import mysql.connector

mydb = mysql.connector.connect(
    host='localhost',
    user='root',
    password='student',
    database='gui_python'
)

print("Connection successful!")

mycursor = mydb.cursor()

mycursor.execute("SELECT * FROM student")

myresult = mycursor.fetchall()

for x in myresult:
    print(x)