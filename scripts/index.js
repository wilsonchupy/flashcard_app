let dataset;
const loadButton = document.getElementById('loadButton');
const reader = new FileReader();
const answerInput = document.getElementsByClassName("answerInput")[0]; 

reader.addEventListener(
    "load",
    () => {
        dataset = JSON.parse(reader.result);
        const profileElem = document.getElementById("profile");
        
        // Set 
        const {name, lastSeen, levels} = dataset;
        const currentLevel = levels[levels.length-1];
        const usernameElem = document.createElement("h1");
        const lastSeenElem = document.createElement("h1");
        const levelElem = document.createElement("h1");

        usernameElem.innerHTML = `Welcome ${name}`;
        lastSeenElem.innerHTML = `Last save: ${lastSeen}`;
        levelElem.innerHTML = `Level ${currentLevel.level}`;

        profileElem.appendChild(usernameElem);
        profileElem.appendChild(lastSeenElem);
        profileElem.appendChild(levelElem);

        // update user data
        dataset.lastSeen = new Date();
        if (!currentLevel.updateTime) {
            currentLevel.updateTime = dataset.lastSeen;
        }
        startLesson();
    },
    false,
);

loadButton.addEventListener('click', () => {
    const fileInput = document.getElementById('loadFileInput');
    
    fileInput.click();
    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        reader.readAsText(file);
    });
});


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