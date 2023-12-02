let dataset;
let lessons;
let currentCard;
let totalUnlearnedCards;
let totalIncorrectCount = 0;

const loadButton = document.getElementById('loadButton');
const saveButton = document.getElementById('saveButton');
const notesButton = document.getElementById("notesButton"); 
const correctPercentageElem = document.getElementById("correctPercentage");
const remainingCountElem = document.getElementById("remainingCount");
const questionElem = document.getElementsByClassName("question")[0]; 
const categoryElem = document.getElementsByClassName("category")[0]; 
const answerInput = document.getElementsByClassName("answerInput")[0]; 
const answerInputButton = document.getElementById("answerInputButton"); 
const answerSpanElem = document.getElementById("answerSpan"); 
const notesCardElem = document.getElementsByClassName("notesCard")[0];
const reader = new FileReader();

reader.addEventListener(
    "load",
    () => {
        dataset = JSON.parse(reader.result);
        for (let i = 0; i < dataset.deck.length; i++) {
            dataset.deck[i].id = i;
            dataset.deck[i].stage = 0;
            dataset.deck[i].incorrectCount = 0;
        }
        const profileElem = document.getElementById("profile");
        
        // Set 
        const {name, lastSeen, levels} = dataset;
        const currentLevel = levels[levels.length-1];
        const usernameElem = document.getElementById("username") ? document.getElementById("username") : document.createElement("h1");
        const lastSeenElem = document.getElementById("lastSeen") ? document.getElementById("lastSeen") : document.createElement("h1");
        const levelElem = document.getElementById("level") ? document.getElementById("level") : document.createElement("h1");

        usernameElem.setAttribute("id", "username");
        lastSeenElem.setAttribute("id", "lastSeen");
        levelElem.setAttribute("id", "level");

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

saveButton.addEventListener('click', () => {
    saveProgress();
});


function startLesson() {
    let unlearnedCards = dataset.deck.filter(card => !card.nextReviewTime || card.nextReviewTime <= new Date());
    totalUnlearnedCards = unlearnedCards.length;
    lessons = unlearnedCards;

    correctPercentageElem.innerHTML = "✔100%&nbsp;";
    remainingCountElem.innerHTML = `&nbsp;🎴${lessons.length}`;

    answerInput.setAttribute("placeholder", "➭ Answer");
    answerInput.removeAttribute("disabled");
    answerInputButton.removeAttribute("disabled");

    if (lessons.length > 0) {
        currentCard = lessons.shift();
        displayCard(currentCard);
    } else {
        displayModal();
        answerInput.setAttribute("", "");
        answerInput.setAttribute("disabled", "");
        answerInputButton.removeAttribute("disabled");
    }
}

function checkAnswer(userInput, answer) {
    if(userInput === answer) {
        answerInput.classList.add('correctAnswer');
        answerInput.classList.remove('incorrectAnswer');
        answerInputButton.classList.add('correctAnswer');
        answerInputButton.classList.remove('incorrectAnswer');
        return true;
    } else {
        answerInput.classList.add('incorrectAnswer');  
        answerInput.classList.remove('correctAnswer');
        answerInputButton.classList.add('incorrectAnswer');  
        answerInputButton.classList.remove('correctAnswer');
        return false;
    }
}

answerInput.addEventListener('keyup', (event) => {

    
    if ((answerInput.classList.contains('incorrectAnswer') || answerInput.classList.contains('correctAnswer')) && event.key === 'Enter') {
        remainingCountElem.innerHTML = `&nbsp;🎴${lessons.length}`;
        // reset input and continue to next card
        
        resetInput();
        if (lessons.length > 0) {
            currentCard = lessons.shift();
            // continue to next card
            displayCard(currentCard);
        } else {
            displayModal();
        }
    } else if(event.key === 'Enter') {
        notesButton.removeAttribute("disabled");

        const isCorrect = checkAnswer(answerInput.value, answerSpanElem.textContent);

        if (isCorrect) {
            currentCard.incorrectCount = 0;
            currentCard.stage += 1;
            currentCard.stage = getStage(currentCard);
            currentCard.nextReviewTime = getNextReviewTime(currentCard.stage);
        } else {
            currentCard.incorrectCount++;
            currentCard.stage = getStage(currentCard);
            currentCard.nextReviewTime = getNextReviewTime(currentCard.stage);
            lessons.push(currentCard);
            totalIncorrectCount += 1;
        }

        correctPercentageElem.innerHTML = `✔${Math.round(( (totalUnlearnedCards - totalIncorrectCount) / totalUnlearnedCards) * 100)}%&nbsp;`;
        // save the updated card back to the deck
        dataset.deck[currentCard.id] = currentCard;
        
    }
});

function displayCard(card) {
    const answer = card.answer;

    questionElem.innerHTML = card.question;
    categoryElem.innerHTML = card.category;
    answerSpanElem.textContent = answer;
}

function resetInput() {
    answerInput.value = "";
    answerInput.classList.remove('correctAnswer');
    answerInput.classList.remove('incorrectAnswer');   
    answerInputButton.classList.remove('correctAnswer');
    answerInputButton.classList.remove('incorrectAnswer');
    questionElem.innerHTML = "";
    categoryElem.innerHTML = "";
    answerSpanElem.textContent = "";
    notesButton.setAttribute("disabled", "");
    hideNotes();
}

function getStage(card) {
    let incorrectAdjustmentCount = Math.ceil(card.incorrectCount / 2);
    let penaltyFactor = card.stage >= 5 ? 2 : 1;
    let newStage = card.stage - (incorrectAdjustmentCount * penaltyFactor);
    return newStage < 0 ? 0 : newStage;
}

function getNextReviewTime(stage) {
    let result;
    let now = new Date();

    switch(stage) {
        case 0:
            result = now;
            break;
        case 1:
            result = now.setHours(now.getHours() + 4);
            break;
        case 2:
            result = now.setHours(now.getHours() + 8);
            break;
        case 3:
            result = now.setHours(now.getHours() + 24);
            break;
        case 4:
            result = now.setHours(now.getHours() + 48);
            break;
        case 5:
            result = now.setDate(now.getDate() + 7);
            break;
        case 6:
            result = now.setDate(now.getDate() + 14);
            break;
        case 7:
            result = now.setMonth(now.getMonth() + 1);
            break;
        case 8:
            result = now.setMonth(now.getMonth() + 4);
            break;
        default:
            result = now;
            break;
    }
    return new Date(result);
}

const dialog = document.querySelector("dialog");
const closeButton = document.querySelector("dialog button");

// "Close" button closes the dialog
closeButton.addEventListener("click", () => {
    dialog.close();
});

function displayModal() {
    dialog.showModal();
    saveProgress();
}

function saveProgress() {
    let currentTimestamp = new Date();
    currentTimestamp = currentTimestamp.toISOString().replace(/:/g,"-")
    currentTimestamp = currentTimestamp.replace(/\./,"-")
    dataset.lastSeen = currentTimestamp;
    
    // convert data to blob and create url for download
    const datasetString = JSON.stringify(dataset);
    const link = document.getElementById("save");
    const blob = new Blob([datasetString], {type : 'application/json'});
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `dataset-${currentTimestamp}.json`;
    link.click();
}

function hideNotes() {
    // hide the notes
    const notesTextElem = notesCardElem.getElementsByTagName("p")[0];
    if (notesTextElem) {
        notesCardElem.removeChild(notesTextElem);
        notesCardElem.setAttribute("hidden", "");
    }
}

function toggleNotes() {
    if (window.getComputedStyle(notesCardElem).display === "none") {
        // display the notes
        const notesTextElem = document.createElement("p");
        notesTextElem.innerHTML = currentCard.notes || '';
        notesCardElem.appendChild(notesTextElem);
        notesCardElem.removeAttribute("hidden");
    } else {
        hideNotes();
    }
}