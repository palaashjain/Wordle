let targetWord;
getWord();
const WORD_LENGTH = 5;
const FLIP_ANIMATION_DURATION = 500;
const DANCE_ANIMATION_DURATION = 500;
const keyboard = document.querySelector("[data-keyboard]");

async function getWord() {
    const url = 'https://random-words5.p.rapidapi.com/getRandom?wordLength=5';
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': 'e5130e0842mshb2207f2d1308b41p156338jsnc39ff0d3d677',
            'X-RapidAPI-Host': 'random-words5.p.rapidapi.com'
        }
    };
    try {
        const response = await fetch(url, options);
        const result = await response.text();
        let loader = document.getElementById("loading");
        loader.addEventListener("transitionend", () => {
            loader.remove();
        });
        loader.style.opacity = 0;
        loader.style.visibility = "hidden";
        startInteraction();
        targetWord = result;
    } catch (error) {
        console.error(error);
    }
}

async function checkWord(word) {
    const url = `https://dictionary-by-api-ninjas.p.rapidapi.com/v1/dictionary?word=${word}`;
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': 'e5130e0842mshb2207f2d1308b41p156338jsnc39ff0d3d677',
            'X-RapidAPI-Host': 'dictionary-by-api-ninjas.p.rapidapi.com'
        }
    };
    try {
        const response = await fetch(url, options);
        const result = await response.text();
        return JSON.parse(result);
    } catch (error) {
        console.error(error);
    }
}

function startInteraction() {
    document.addEventListener("click", handleMouseClick);
    document.addEventListener("keydown", handleKeyPress);
}
function stopInteraction() {
    document.removeEventListener("click", handleMouseClick);
    document.removeEventListener("keydown", handleKeyPress);
}

function handleMouseClick(e) {
    if (e.target.matches("[data-key]")) {
        pressKey(e.target.dataset.key);
        return;
    }
    if (e.target.matches("[data-enter]")) {
        submitGuess();
        return
    }
    if (e.target.matches("[data-delete]")) {
        deleteKey();
        return;
    }
}

function handleKeyPress(e) {
    // console.log(e);
    if (e.key === "Enter") {
        submitGuess();
        return;
    }
    if (e.key === "Backspace" || e.key === "Delete") {
        deleteKey();
        return;
    }
    if (e.key >= "a" && e.key <= "z") {
        pressKey(e.key);
        return;
    }
}

// startInteraction();

const guessGrid = document.querySelector("[data-guess-grid]");

function pressKey(key) {
    // select the next empty grid
    if (getActiveTiles().length >= WORD_LENGTH) {
        return;
    }
    const nextTile = guessGrid.querySelector(":not([data-letter])");
    nextTile.dataset.letter = key.toLowerCase();
    nextTile.textContent = key;
    nextTile.dataset.state = "active";
}

function getActiveTiles() {
    return guessGrid.querySelectorAll(`[data-state="active"]`);
    // don't use .length here
}

function deleteKey() {
    const activeTiles = getActiveTiles();
    if (activeTiles.length == 0) {
        return;
    }
    const currTile = activeTiles[activeTiles.length - 1];
    currTile.removeAttribute('data-state');
    currTile.textContent = "";
    currTile.removeAttribute('data-letter');
}

async function submitGuess() {
    const activeTiles = [...getActiveTiles()];
    // not useful when using querySelectorAll return type
    if (activeTiles.length !== WORD_LENGTH) {
        showAlert("Not enough letters");
        shakeTiles(activeTiles);
        return
    }
    const guess = activeTiles.reduce((word, tile) => {
        return word + tile.dataset.letter;
    }, "");
    const response = await checkWord(guess);
    if (response.valid === false) {
        showAlert("Invalid Word!");
        shakeTiles(activeTiles);
        return;
    }
    stopInteraction();
    activeTiles.forEach((...params) => flipTiles(...params, guess));
}
function flipTiles(tile, index, array, guess) {
    const letter = tile.dataset.letter;
    const key = keyboard.querySelector(`[data-key="${letter}"i]`);
    // i is for a case insensitive check / letter.toLowerCase() also works
    setTimeout(() => {
        tile.classList.add("flip");
    }, index * FLIP_ANIMATION_DURATION / 2);
    tile.addEventListener("transitionend", () => {
        tile.classList.remove("flip");
        if (targetWord[index] === letter) {
            tile.dataset.state = "correct";
            key.classList.add("correct");
        }
        else if (targetWord.includes(letter)) {
            tile.dataset.state = "misplaced";
            key.classList.add("misplaced");
        }
        else {
            tile.dataset.state = "wrong";
            key.classList.add("wrong");
        }
        if (index === array.length - 1) {
            tile.addEventListener("transitionend", () => {
                startInteraction();
                checkWinLose(guess, array);
            }, { once: true });
        }
    }, { once: true });
}

const alertContainer = document.querySelector("[data-alert-container]");
function showAlert(msg, duration=1000) {
    const alert = document.createElement("div");
    alert.textContent = msg;
    alert.classList.add("alert");
    alertContainer.prepend(alert);
    if (duration == null) {
        return;
    }
    setTimeout(() => {
        alert.classList.add("hide");
        alert.ontransitionend = () => {
            alert.remove();
        };
    }, duration);
}
function shakeTiles(tilesToShake) {
    tilesToShake.forEach(tile => {
        tile.classList.add("shake");
        tile.addEventListener("animationend", () => {
            tile.classList.remove("shake");
        }, { once: true });
    })
}

function checkWinLose(guess, tiles) {
    if (guess === targetWord) {
        showAlert("Incredible! You Win", 5000);
        danceTiles(tiles);
        stopInteraction();
        return;
    }
    const remainingTiles = guessGrid.querySelectorAll(":not([data-letter])");
    if (remainingTiles.length === 0) {
        showAlert(targetWord.toUpperCase(), null);
        stopInteraction();
    }
}
function danceTiles(tiles) {
    tiles.forEach((tile, index) => {
        setTimeout(() => {
            tile.classList.add("dance");
            tile.addEventListener("animationend", () => {
                tile.classList.remove("dance");
            }, { once: true });
        }, index * DANCE_ANIMATION_DURATION / 5);
    });
}
