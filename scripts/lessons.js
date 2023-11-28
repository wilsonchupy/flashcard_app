window.onload = startLesson();
const answerInput = document.getElementsByClassName("answerInput")[0]; 

function startLesson() {
    const questionElem = document.getElementsByClassName("question")[0]; 
    const categoryElem = document.getElementsByClassName("category")[0]; 
    const spanElem = document.getElementsByTagName("span"); 
    const answer = dataset.deck[0].answer;

    questionElem.innerHTML = dataset.deck[0].question;
    categoryElem.innerHTML = dataset.deck[0].category;
    spanElem.textContent = answer;
}

function checkAnswer(userInput, answer) {
    if(userInput === answer) {
        answerInput.classList.add('correctAnswer');
        answerInput.classList.remove('incorrectAnswer');
    } else {
        answerInput.classList.add('incorrectAnswer');  
        answerInput.classList.remove('correctAnswer');
    }
}

answerInput.addEventListener('keyup', (event) => {
    if(event.key === 'Enter') {
        const userAnswer = answerInput.value;
        const spanElem = document.getElementsByTagName("span"); 
        const answer = spanElem.textContent;
        checkAnswer(userAnswer, answer);
    }
});