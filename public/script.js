const contentTxt = document.getElementById('content-txt')
const submitButton = document.getElementById('submit')
const loadingContainer = document.querySelector('.loading-container')

let quizSubmitButton = "";
let quizLength = 0;
submitButton.addEventListener("click", async () => {

    const selectedOptions = {};
    let quizArea = document.querySelector(".quiz-area");
    try {
        const options = {
            method: "POST",
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({ content: contentTxt.value })
        }

        loadingContainer.style.display = 'block'
        const response = await fetch('/generate-quiz', options);
        const responseData = await response.json();
        console.log(responseData)

        quizLength = responseData.quiz.length;
        responseData.quiz.forEach((quizItem, quizIndex) => {
            let questionOptionsElement = document.createElement('div');
            questionOptionsElement.className = 'question-options';
            let questionElement = document.createElement('p')
            questionElement.className = "question";
            questionElement.textContent = `Question ${quizIndex}: ${quizItem.question}`;
            let optionsElement = document.createElement('div');
            optionsElement.className = "options";
            quizItem.options.forEach((option, optionIndex) => {
                let spanElement = document.createElement('span');
                spanElement.className = "option";
                spanElement.textContent = `${optionIndex}. ${option}`
                spanElement.setAttribute('questionNumber', quizIndex)
                spanElement.setAttribute('optionNumber', optionIndex)
                spanElement.setAttribute('optionContent', option)
                optionsElement.appendChild(spanElement)

                spanElement.addEventListener("click", () => {
                    const previousSelectedOption = selectedOptions[quizIndex]
                    if (previousSelectedOption) {
                        previousSelectedOption.classList.remove('selected');
                    }
                    spanElement.classList.add("selected")
                    selectedOptions[quizIndex] = spanElement;
                })
            });

        questionOptionsElement.appendChild(questionElement)
        questionOptionsElement.appendChild(optionsElement)
        quizArea.appendChild(questionOptionsElement)
        });

    } catch (error) {
        console.error(error);
    } finally {
        loadingContainer.style.display = 'none';
    }

    quizSubmitButton = document.createElement('button');
    quizSubmitButton.textContent = "Submit"
    quizSubmitButton.id = 'quiz-button'
    quizArea.appendChild(quizSubmitButton)

    quizSubmitButton.addEventListener("click", async  () => {
        const selectedOptionElements = document.querySelectorAll('.option.selected')
        console.log(selectedOptionElements)

        const selectedOptions = Array.from(selectedOptionElements).map((optionElement) => ({
            questionNumber: optionElement.getAttribute('questionNumber'),
            optionNumber: optionElement.getAttribute('optionNumber'),
            optionContent: optionElement.getAttribute('optionContent')
        }))
        console.log(selectedOptions)

        if (selectedOptions.length !== quizLength) {
            alert("Please select an option for each question");
            return;
        }

        console.log("All options were selected")

        try {
            const options = {
                method: "POST",
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({selectedOptions})
            }
           const response = await fetch('/check-score', options);
           const scoreCardArray = await response.json();
           console.log(scoreCardArray);
           const scoreBox = document.getElementById('score-box');
           const scorePercentage = document.getElementById('percentage');
           scorePercentage.textContent = `Your score: ${scoreCardArray[0].percentage.toFixed(2)}%`;
           scoreBox.style.display = 'block';

           scoreCardArray.forEach(item => {
            const resultsElement = document.createElement('div');
            resultsElement.className = "results";
            const questionNumberElement = document.createElement('div')
            questionNumberElement.className = "question-number";
            const correctAnswerElement = document.createElement('div')
            correctAnswerElement.className = "correct-answer";
            const userAnswerElement = document.createElement('div')
            userAnswerElement.className = "user-answer";

            questionNumberElement.textContent = `Q. ${item.questionNumber}`
            correctAnswerElement.textContent = `${item.correctAnswerIndex}`
            if (item.correctAnswerIndex === item.userAnswer) {
                userAnswerElement.textContent = `${item.userAnswer} ✔️`
            } else {
                userAnswerElement.textContent = `${item.userAnswer} ❌`
            }

            resultsElement.appendChild(questionNumberElement)
            resultsElement.appendChild(correctAnswerElement)
            resultsElement.appendChild(userAnswerElement)
            scoreBox.appendChild(resultsElement)
           })
        } catch (error) {
            console.error(error)
        }
    })
})