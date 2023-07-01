require('dotenv').config()
const express = require('express');
const hbs = require('hbs');
const app = express();
const { Configuration, OpenAIApi } = require("openai");

app.use(express.urlencoded({ extended: true }))
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'hbs');
const PORT = 3000;

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

app.get('/', function(req,res) {
    res.render('index')
})

const correctAnswers = []
app.post('/generate-quiz', async function(req,res) {
    // console.log(req.body)
    // var responseData = {
    //     quiz: [
    //       {
    //         question: 'What is the screen size of the ROG Ally?',
    //         options: ['5in', '6in', '7in', '8in'],
    //         answer: '7in'
    //       },
    //       {
    //         question: 'What is the resolution of the ROG Ally display?',
    //         options: ['1280x720', '1920x1080', '2560x1440', '3840x2160'],
    //         answer: '1920x1080'
    //       },
    //       {
    //         question: 'What type of touchscreen does the ROG Ally have?',
    //         options: ['IPS', 'AMOLED', 'LCD', 'OLED'],
    //         answer: 'IPS'
    //       },
    //       {
    //         question: 'Which glass provides extra durability to the ROG Ally display?',
    //         options: ['Gorilla Glass 3', 'Gorilla Glass 5', 'Gorilla Glass 6', 'Gorilla Glass Victus'],
    //         answer: 'Gorilla Glass Victus'
    //       },
    //       {
    //         question: 'What aspect ratio does the ROG Ally display have?',
    //         options: ['4:3', '16:9', '18:9', '21:9'],
    //         answer: '16:9'
    //       }
    //     ]
    //   };

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo-0613",
      messages: [{role: "user", content: req.body.content}],
      functions: [
        {
          "name": "generate_quiz",
          "description": "Generate quiz of 5 questions with 4 options from the given text",
          "parameters": {
            "type": "object",
            "properties": {
              "quiz": {
                "type": "array",
                "description": "Array of quiz questions and answers",
                "items": {
                  "type": "object",
                  "properties": {
                    "question": {
                      "type": "string",
                      "description": "Quiz question"
                    },
                    "options": {
                      "type": "array",
                      "description": "Array of options for the quiz question",
                      "items": {
                        "type": "string",
                        "description": "Option for the quiz question"
                      }
                    },
                    // "answer": {
                    //   "type": "integer",
                    //   "description": "Index of the correct answer in the options array (index starting from 0)."
                    // }
                    "answer": {
                      "type": "string",
                      "description": "Write the correct option from the options array"
                    }
                  },
                  "required": ["question", "options", "answer"]
                }
              }
            },
            "required": ["quiz"]
          }
        }
      ],
      function_call: {"name": "generate_quiz"}
    });

    const responseData = JSON.parse(completion.data.choices[0].message.function_call.arguments);
    console.log(responseData);
    
      for (let i=0; i<responseData.quiz.length; i++) {
        correctAnswers[i] = {
            "questionNumber": i,
            "answer": responseData.quiz[i].answer,
            "answerIndex": responseData.quiz[i].options.indexOf(responseData.quiz[i].answer)
        }
      }

      responseData.quiz.forEach((item) => {
        delete item.answer;
      })

      console.log("Correct Answer array:",correctAnswers)
      console.log("Response Data:",responseData)

      res.json(responseData)
      
})

app.post('/check-score', function(req,res) {
    const selectedAnswers = req.body.selectedOptions;
    console.log("User Answers", selectedAnswers);
    console.log("Correct Answer",correctAnswers);
    let score = 0;

    selectedAnswers.forEach((selectedAnswer) => {
      const questionNumber = parseInt(selectedAnswer.questionNumber);
      const optionNumber = parseInt(selectedAnswer.optionNumber);
      const optionContent = selectedAnswer.optionContent;
    
      const correctAnswer = correctAnswers.find((item) => item.questionNumber === questionNumber);
      // if (correctAnswer && correctAnswer.answer === optionNumber) {
      //   score++;
      // }

      if (correctAnswer && correctAnswer.answer === optionContent) {
        score++;
      }
 
    });

    const totalQuestions = correctAnswers.length;
    const percentage = (score / totalQuestions) * 100;
    console.log(percentage);
    const scoreCard = selectedAnswers.map(item => {
      const questionNumber = parseInt(item.questionNumber);
      const optionNumber = parseInt(item.optionNumber);
      const correctAnswer = correctAnswers.find(item => item.questionNumber === questionNumber);

      return {
        questionNumber,
        "userAnswer": optionNumber,
        "correctAnswer": correctAnswer.answer,
        "correctAnswerIndex": correctAnswer.answerIndex,
        percentage
      }
    })

    console.log("Score Card",scoreCard)
    res.json(scoreCard)
})

app.listen(PORT, ()=> {
    console.log(`Server started at port ${PORT}`)
})