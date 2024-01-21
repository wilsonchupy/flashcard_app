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
const notesCardElem = document.getElementsByClassName("notesCard")[0];
const landingDialog = document.querySelector("#landingDialog");
const completeDialog = document.querySelector("#completeDialog");
const completeDialogCloseButton = document.querySelector("#completeDialog button");
const reader = new FileReader();

window.onload = landingDialog.showModal();

reader.addEventListener(
    "load",
    () => {

        landingDialog.innerHTML = "<p>Loading...</p>";

        // simulate data load
        setTimeout(function() {
            dataset = JSON.parse(reader.result);
            for (let i = 0; i < dataset.deck.length; i++) {
                dataset.deck[i].id = i;
                dataset.deck[i].stage = dataset.deck[i].stage ? dataset.deck[i].stage : 0;
                dataset.deck[i].incorrectCount = 0;
            }

            // Setup UI after data load
            const {name, lastSeen, levels} = dataset;
            const currentLevel = levels[levels.length-1];

            setProfile(name, lastSeen, currentLevel.level);
            toggleLoadSaveButton(true);

            // update user data
            dataset.lastSeen = new Date();
            if (!currentLevel.updateTime) {
                currentLevel.updateTime = dataset.lastSeen;
            }

            landingDialog.close();

            startLesson();
        }, 1000);

        
    },
    false,
);

function loadData() {
    const fileInput = document.getElementById('loadFileInput');
    
    fileInput.click();
    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        reader.readAsText(file);
    });
}

function saveData() {
    saveProgress();
}

function startLesson() {
    // filter items in the deck if it is new or pass review time 
    let unlearnedCards = dataset.deck.filter(card => !card.nextReviewTime || new Date(card.nextReviewTime) <= new Date());

    // store in lesson data in global variables
    totalUnlearnedCards = unlearnedCards.length;
    lessons = unlearnedCards;

    correctPercentageElem.innerHTML = "✔100%&nbsp;";
    remainingCountElem.innerHTML = `&nbsp;🎴${lessons.length}`;

    enableAnswerInput();

    // Fetch a card from top of the deck
    if (lessons.length > 0) {
        currentCard = lessons.shift();
        displayCard(currentCard);
    } else {
        endLesson();
    }
}

function checkAnswer(userInput, answers) {
    // Using '===' to indicate a strict euqality check even though most of the time we are only comparing string
    // prevent edge cases when answers are falsy or numeric (i.e. 0, false)
    // TODO: use regex to provide tips if user input is similar to the answer above a certain thershold 
    if (answers.includes(userInput.toLowerCase())) {
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

answerInputButton.addEventListener('click', (event) => {
    // Click to check the answer
    // If user has already answered a question, move to the next question when the button is clicked again 
    if (answerInput.classList.contains('incorrectAnswer') || answerInput.classList.contains('correctAnswer')) {
        handleNextCard();
    } else {
        submitAnswer();
    }
})

answerInput.addEventListener('keyup', (event) => {

    // Press enter to check the answer when the input is on focus
    // If user has already answered a question, move to the next question when enter is pressed again 
    if ((answerInput.classList.contains('incorrectAnswer') || answerInput.classList.contains('correctAnswer')) && event.key === 'Enter') {
        handleNextCard();
    } else if(event.key === 'Enter') {
        submitAnswer();
    }
});

function handleNextCard() {
    // update the stats
    remainingCountElem.innerHTML = `&nbsp;🎴${lessons.length}`;
            
    // reset input and continue to next card
    resetInput();
    if (lessons.length > 0) {
        currentCard = lessons.shift();
        displayCard(currentCard);
    } else {
        endLesson();
    }
}

function submitAnswer() {
    // Allow user to check the notes after a question is attempt
    notesButton.removeAttribute("disabled");

    const isCorrect = checkAnswer(answerInput.value, currentCard.answers);

    // update data for a card
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

    // The lowest correct percentage is 0
    let correctPercentage = totalUnlearnedCards - totalIncorrectCount > 0 ? Math.round(( (totalUnlearnedCards - totalIncorrectCount) / totalUnlearnedCards) * 100) : 0;
    
    // update the stats
    correctPercentageElem.innerHTML = `✔${correctPercentage}%&nbsp;`;
    
    // save the updated card back to the deck
    dataset.deck[currentCard.id] = currentCard;
}

function displayCard(card) {
    // populate the UI with card data
    const answers = card.answers;

    questionElem.innerHTML = card.question;
    categoryElem.innerHTML = card.category;
}

function resetInput() {
    // restore UI to initial state
    answerInput.value = "";
    answerInput.classList.remove('correctAnswer');
    answerInput.classList.remove('incorrectAnswer');   
    answerInputButton.classList.remove('correctAnswer');
    answerInputButton.classList.remove('incorrectAnswer');
    questionElem.innerHTML = "";
    categoryElem.innerHTML = "";
    notesButton.setAttribute("disabled", "");
    hideNotes();
}

function getStage(card) {
    // Calculate the stage of an item in the deck
    // Incorrect count is the number of tries before getting an item right in a session
    // Penalty factor is doubled when item reaches stage 5
    // The lowest stage for an item is 0

    let incorrectAdjustmentCount = Math.ceil(card.incorrectCount / 2);
    let penaltyFactor = card.stage >= 5 ? 2 : 1;
    let newStage = card.stage - (incorrectAdjustmentCount * penaltyFactor);
    return newStage < 0 ? 0 : newStage;
}

function getNextReviewTime(stage) {
    // Calculate the next review time for an item in the deck
    // Default review time for an item is the current time
    // Next review time is lengthened based on the stage 
    // The higher the stage, the longer user can skip reviewing an item
    // Item with stage greater than 9 is considered burned
    // Burned items should be removed from deck but just keeping it for now as the item review feature has not been built 

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
            result = now.setFullYear(now.getFullYear() + 1);
            break;
    }
    return new Date(result);
}

function closeDialog(elem) {
    // Method for close buttons inside a dialog element
    elem.parentElement.close();
}

function endLesson() {
    // Display complete message and save progress automatically
    // Restore UI to initial state
    completeDialog.showModal();
    saveProgress();
    disableAnswerInput();
    resetStats();
    toggleLoadSaveButton(false);
}

function saveProgress() {
    // Update last seen as current datetime
    // replace symbols in timestamp with hypen for attaching to a filename 
    let currentTimestamp = new Date();
    dataset.lastSeen = currentTimestamp;
    currentTimestamp = currentTimestamp.toISOString().replace(/:/g,"-")
    currentTimestamp = currentTimestamp.replace(/\./,"-")
    
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
    // hide the notes if it is shown
    const notesTextElem = notesCardElem.getElementsByTagName("p")[0];
    if (notesTextElem) {
        notesCardElem.removeChild(notesTextElem);
        notesCardElem.setAttribute("hidden", "");
    }
}

function toggleNotes() {
    if (window.getComputedStyle(notesCardElem).display === "none") {
        // display the notes if it is not shown
        const notesTextElem = document.createElement("p");
        notesTextElem.innerHTML = currentCard.notes || '';
        notesCardElem.appendChild(notesTextElem);
        notesCardElem.removeAttribute("hidden");
    } else {
        hideNotes();
    }
}

function enableAnswerInput() {
    answerInput.setAttribute("placeholder", "➭ Answer");
    answerInput.removeAttribute("disabled");
    answerInputButton.removeAttribute("disabled");
}

function disableAnswerInput() {
    answerInput.setAttribute("placeholder", "");
    answerInput.setAttribute("disabled", "");
    answerInputButton.setAttribute("disabled", "");
}

function resetStats() {
    correctPercentageElem.innerHTML = "";
    remainingCountElem.innerHTML = "";
}

function setProfile(name, lastSeen, level) {
    const usernameCell = document.getElementById("username");
    const lastSeenCell = document.getElementById("lastSeen");
    const levelCell = document.getElementById("level");

    // Format date to MMM DD, YYYY, HH:MM:SS
    let date = lastSeen ? new Date(lastSeen) : new Date();
    let formattedDate = date.toLocaleDateString('en-us', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: false 
    }); 

    usernameCell.innerHTML = name;
    lastSeenCell.innerHTML = formattedDate;
    levelCell.innerHTML = `LEVEL ${level}`;
}

function toggleLoadSaveButton(start) {
    // start is true when a study session starts
    // start is false when a study session ends 
    if (start) {
        loadButton.setAttribute("disabled", "");
        saveButton.removeAttribute("disabled");
    } else {
        loadButton.removeAttribute("disabled");
        saveButton.setAttribute("disabled", "");
    }
}