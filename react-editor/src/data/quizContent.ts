export const QUIZ_CONTENT = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>בחן את עצמך - המדריך המלא למובילי/ות ומנהלי/ות מרכזי יזמות</title>
    <style>
        body {
            font-family: Assistant, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
            background-size: 400% 400%;
            animation: gradient 15s ease infinite;
            min-height: 100vh;
        }

        @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            padding: 30px;
            border-radius: 20px;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            border: 1px solid rgba(255, 255, 255, 0.18);
        }

        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
            font-size: 2.5em;
            background: linear-gradient(45deg, #007bff, #00bcd4);
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
        }

        .quiz-container {
            display: none;
        }

        .quiz-container.active {
            display: block;
        }

        .question-container {
            background: white;
            padding: 20px;
            border-radius: 15px;
            margin-bottom: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            transition: transform 0.3s ease;
        }

        .question-container:hover {
            transform: translateY(-3px);
        }

        .question {
            font-size: 1.2em;
            color: #333;
            margin-bottom: 15px;
            font-weight: bold;
        }

        .options {
            display: grid;
            gap: 10px;
        }

        .option {
            padding: 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .option:hover {
            background: #f8f9fa;
            border-color: #007bff;
        }

        .option.selected {
            background: #007bff;
            color: white;
            border-color: #0056b3;
        }

        .option.correct {
            background: #28a745;
            color: white;
            border-color: #1e7e34;
        }

        .option.wrong {
            background: #dc3545;
            color: white;
            border-color: #bd2130;
        }

        .progress-bar {
            height: 10px;
            background: #e9ecef;
            border-radius: 5px;
            margin: 20px 0;
            overflow: hidden;
        }

        .progress {
            height: 100%;
            background: linear-gradient(45deg, #007bff, #00bcd4);
            width: 0;
            transition: width 0.3s ease;
        }

        .controls {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
        }

        button {
            padding: 12px 25px;
            border: none;
            border-radius: 25px;
            background: linear-gradient(45deg, #007bff, #00bcd4);
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 1em;
        }

        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }

        button:disabled {
            background: #e0e0e0;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        .results {
            text-align: center;
            display: none;
        }

        .score {
            font-size: 2em;
            margin: 20px 0;
            color: #007bff;
        }

        .feedback {
            margin: 20px 0;
            padding: 20px;
            border-radius: 10px;
            background: #f8f9fa;
        }

        .restart-btn {
            background: linear-gradient(45deg, #28a745, #20c997);
        }

        .dictionary-link {
            display: block;
            text-align: center;
            margin-top: 20px;
            color: #007bff;
            text-decoration: none;
        }

        .dictionary-link:hover {
            text-decoration: underline;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .fade-in {
            animation: fadeIn 0.5s ease forwards;
        }

        .answers-review {
            margin-top: 20px;
            max-height: 400px;
            overflow-y: auto;
            padding: 10px;
        }
        
        .review-item {
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            background: #f8f9fa;
            border-right: 4px solid;
        }
        
        .review-item.correct {
            border-color: #28a745;
            background: #f0fff4;
        }
        
        .review-item.incorrect {
            border-color: #dc3545;
            background: #fff5f5;
        }
        
        .review-item p {
            margin: 5px 0;
        }

        .progress-info {
            text-align: center;
            margin: 10px 0;
            color: #666;
            font-size: 1.1em;
        }

        .question-number {
            background: linear-gradient(45deg, #007bff, #00bcd4);
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            display: inline-block;
            margin-bottom: 10px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>בחן את עצמך - המדריך המלא למובילי/ות ומנהלי/ות מרכזי יזמות</h1>
        <div class="quiz-container active">
            <div class="progress-bar">
                <div class="progress"></div>
            </div>
            <div class="progress-info">
                שאלה <span id="current-question">1</span> מתוך <span id="total-questions">0</span>
            </div>
            <div id="question-container" class="question-container fade-in">
                <!-- Questions will be inserted here -->
            </div>
            <div class="controls">
                <button id="prev-btn" disabled>הקודם</button>
                <button id="next-btn">הבא</button>
            </div>
        </div>
        <div class="results">
            <div class="score">
                <span id="score">0</span>/10
            </div>
            <div class="feedback"></div>
            <button class="restart-btn" onclick="restartQuiz()">נסה שוב</button>
        </div>
        <a href="dictionary.html" class="dictionary-link">חזרה למדריך</a>
    </div>

    <script>
        const questions = [
            {
                question: "מהי תכנית NEXTREAM?",
                options: [
                    "תכנית המיועדת לחניכים בשנה א'",
                    "תכנית פיילוט המיועדת לבוגרי התכנית (שנה ד')",
                    "תכנית המיועדת למנטורים",
                    "תכנית המיועדת למנהלי מרכזים"
                ],
                correct: 1
            },
            {
                question: "מתי יש לעדכן את מערכת ה-Salesforce?",
                options: [
                    "פעם בחודש",
                    "בסוף כל יום או לכל המאוחר עד יום חמישי של אותו שבוע",
                    "בסוף כל פגישה",
                    "רק בסוף השנה"
                ],
                correct: 1
            },
            {
                question: "מיהו עמית עסקי?",
                options: [
                    "מנטור קבוע שמלווה את החניכים לאורך כל השנה",
                    "מנטור המגיע למפגש חד פעמי בנושא ספציפי",
                    "חניך שסיים את התכנית",
                    "מנהל מרכז היזמות"
                ],
                correct: 1
            }
        ];

        let currentQuestion = 0;
        let score = 0;
        let answers = new Array(questions.length).fill(null);
        let shuffledQuestions = [];

        // פונקציה לערבוב מערך
        function shuffleArray(array) {
            let currentIndex = array.length, randomIndex;
            const newArray = [...array]; // יצירת עותק של המערך המקורי

            while (currentIndex != 0) {
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex--;

                [newArray[currentIndex], newArray[randomIndex]] = [
                    newArray[randomIndex], newArray[currentIndex]];
            }

            return newArray;
        }

        function showQuestion() {
            const questionData = shuffledQuestions[currentQuestion];
            const container = document.getElementById('question-container');
            
            // עדכון מספרי השאלות
            document.getElementById('current-question').textContent = currentQuestion + 1;
            document.getElementById('total-questions').textContent = shuffledQuestions.length;
            
            container.innerHTML = \`
                <div class="question-number">שאלה \${currentQuestion + 1} מתוך \${shuffledQuestions.length}</div>
                <div class="question">\${questionData.question}</div>
                <div class="options">
                    \${questionData.options.map((option, index) => \`
                        <div class="option \${answers[currentQuestion] === index ? 'selected' : ''}" 
                             onclick="selectOption(\${index})">
                            \${option}
                        </div>
                    \`).join('')}
                </div>
            \`;

            updateProgress();
            updateButtons();
        }

        function selectOption(index) {
            answers[currentQuestion] = index;
            const options = document.querySelectorAll('.question-container .option');
            options.forEach(option => option.classList.remove('selected'));
            options[index].classList.add('selected');
            updateButtons();
        }

        function updateProgress() {
            const progress = document.querySelector('.progress');
            progress.style.width = \`\${((currentQuestion + 1) / shuffledQuestions.length) * 100}%\`;
        }

        function updateButtons() {
            document.getElementById('prev-btn').disabled = currentQuestion === 0;
            const nextBtn = document.getElementById('next-btn');
            nextBtn.textContent = currentQuestion === shuffledQuestions.length - 1 ? 'סיים' : 'הבא';
            nextBtn.disabled = answers[currentQuestion] === null;
        }

        function nextQuestion() {
            if (currentQuestion === shuffledQuestions.length - 1) {
                showResults();
            } else {
                currentQuestion++;
                showQuestion();
            }
        }

        function prevQuestion() {
            if (currentQuestion > 0) {
                currentQuestion--;
                showQuestion();
            }
        }

        function showResults() {
            score = answers.reduce((total, answer, index) => 
                total + (answer === shuffledQuestions[index].correct ? 1 : 0), 0);

            document.querySelector('.quiz-container').style.display = 'none';
            const results = document.querySelector('.results');
            results.style.display = 'block';
            
            document.getElementById('score').textContent = score;
            
            const feedback = document.querySelector('.feedback');
            let feedbackHTML = \`<h3>ענית נכון על \${score} מתוך \${shuffledQuestions.length} שאלות</h3>\`;
            
            // הוספת סקירה של כל השאלות והתשובות
            feedbackHTML += '<div class="answers-review">';
            shuffledQuestions.forEach((question, index) => {
                const userAnswer = answers[index];
                const isCorrect = userAnswer === question.correct;
                
                feedbackHTML += \`
                    <div class="review-item \${isCorrect ? 'correct' : 'incorrect'}">
                        <p><strong>שאלה \${index + 1}:</strong> \${question.question}</p>
                        <p>התשובה שלך: \${question.options[userAnswer]}</p>
                        \${!isCorrect ? \`<p>התשובה הנכונה: \${question.options[question.correct]}</p>\` : ''}
                    </div>
                \`;
            });
            feedbackHTML += '</div>';
            
            if (score === shuffledQuestions.length) {
                feedbackHTML = \`
                    <h3>כל הכבוד! 🎉</h3>
                    <p>ענית נכון על כל \${shuffledQuestions.length} השאלות!</p>
                    <p>אתה באמת שולט בחומר!</p>
                    \${feedbackHTML}
                \`;
            } else if (score >= shuffledQuestions.length * 0.8) {
                feedbackHTML = \`
                    <h3>כמעט מושלם! 🌟</h3>
                    <p>ענית נכון על \${score} מתוך \${shuffledQuestions.length} שאלות.</p>
                    <p>כדאי לחזור על הנושאים בהם טעית:</p>
                    \${feedbackHTML}
                \`;
            } else if (score >= shuffledQuestions.length * 0.6) {
                feedbackHTML = \`
                    <h3>לא רע! 👍</h3>
                    <p>ענית נכון על \${score} מתוך \${shuffledQuestions.length} שאלות.</p>
                    <p>מומלץ לחזור על הנושאים הבאים:</p>
                    \${feedbackHTML}
                \`;
            } else {
                feedbackHTML = \`
                    <h3>יש מקום לשיפור 📚</h3>
                    <p>ענית נכון על \${score} מתוך \${shuffledQuestions.length} שאלות.</p>
                    <p>כדאי לחזור למילון המושגים וללמוד שוב את הנושאים הבאים:</p>
                    \${feedbackHTML}
                \`;
            }
            
            feedback.innerHTML = feedbackHTML;
        }

        function restartQuiz() {
            currentQuestion = 0;
            score = 0;
            answers = new Array(questions.length).fill(null);
            shuffledQuestions = shuffleArray(questions); // ערבוב מחדש של השאלות
            document.querySelector('.results').style.display = 'none';
            document.querySelector('.quiz-container').style.display = 'block';
            showQuestion();
        }

        document.getElementById('next-btn').addEventListener('click', nextQuestion);
        document.getElementById('prev-btn').addEventListener('click', prevQuestion);

        // התחלת המבחן עם שאלות מעורבבות
        shuffledQuestions = shuffleArray(questions);
        showQuestion();
    </script>
</body>
</html>`;