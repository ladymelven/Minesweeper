'use strict';

const grid = document.querySelector('.grid');
let cells = [];
let width = 16;
const bombCountDisplay = document.getElementById('bomb-count');
const newGameButton = document.getElementById('new-game-button');
const backdrop = document.getElementById('backdrop');
const configPanel = document.getElementById('config');
const restartPanel = document.getElementById('restart');
const markerColors = ['rgb(0, 0, 255)',
	'rgb(0, 128, 0)',
	'rgb(255, 0, 0)',
	'rgb(0, 0, 128)',
	'rgb(128, 0, 0)',
	'rgb(128, 0, 128)',
	'rgb(0, 128, 128)',
	'rgb(128, 128, 0)'];
let numBombs = 40;
let flaggedBombs = 0;

const findAllNext = (index) => {
	let cellsNext = [index - width, index + width];
	if (!Number.isInteger(index / width)) { // cell's not at left
		cellsNext.push(index - 1 - width, index - 1, index - 1 + width);
	}
	if (!Number.isInteger((index + 1) / width)) { // cell's not at right
		cellsNext.push(index + 1 - width, index + 1, index + 1 + width);
	}
	cellsNext = cellsNext.filter(cell => cell >= 0);
	cellsNext = cellsNext.filter(cell => cell < cells.length);
	return cellsNext;
};

// Setting up the field

const toggleConfig = () => {
	if (configPanel.style.display === 'none') {
		configPanel.style.display = 'block';
		backdrop.style.display = 'block';
	} else {
		configPanel.style.display = 'none';
		backdrop.style.display = 'none';
	}
};

const setUp = level => {
	let height = 0;
	grid.innerHTML = '';
	if (level === 'beginner') {
		numBombs = 10;
		width = 8;
		height = 8;
	} else if (level === 'inter') {
		numBombs = 40;
		width = 16;
		height = 16;
	} else if (level === 'hard') {
		numBombs = 99;
		width = 30;
		height = 16;
	}
	const fieldSize = width * height;
	for (let i = 0; i < fieldSize; i++) {
		const cell = document.createElement('div');
		cell.className = 'hidden';
		grid.append(cell);
	}
	grid.style.width = `${width * 20 + 10}px`;
	grid.style.height = `${height * 20 + 10}px`;
	grid.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
	grid.style.gridTemplateRows = `repeat(${height}, 1fr)`;
	grid.style.display = 'grid';
	cells = Array.from(grid.querySelectorAll('div'));
	bombCountDisplay.parentElement.style.display = 'block';
	bombCountDisplay.innerHTML = numBombs;
	newGame();
};

const placeBombs = () => {
	const maxIndex = cells.length - 1;
	let indices = [];
	while (indices.length < numBombs) {
		const index = Math.round(Math.random() * maxIndex);
		if (indices.includes(index) || // index already there
			findAllNext(index).every(i => indices.includes(i))) {
			continue; // to avoid replication & any given bomb being surrounded by bombs
		} else {
			indices.push(index);
		}
	}
	indices.forEach(index => {
		cells[index].classList.add('bomb');
	});
	placeMarkers(indices);
};

const placeMarkers = (bombIndices) => {
	cells.forEach(cell => {
		if (cell.classList.contains('bomb')) {
			return;
		}
		let bombsNext = 0;
		const indicesNext = findAllNext(cells.indexOf(cell));
		indicesNext.forEach(index => {
			if (cells[index].classList.contains('bomb')) {
				bombsNext += 1;
			}
		});
		if (bombsNext !== 0) {
			cell.innerHTML = bombsNext;
			cell.style.color = markerColors[bombsNext - 1];
		}
	});
};

// Winning, Game Over, New Game

const toggleRestart = (result) => {
	if (restartPanel.style.display === 'block') {
		restartPanel.style.display = 'none';
		backdrop.style.display = 'none';
	} else {
		restartPanel.style.display = 'block';
		backdrop.style.display = 'block';
	}
	if (restartPanel.querySelector('#result').innerHTML) {
		restartPanel.querySelector('#result').innerHTML = '';
	} else {
		restartPanel.querySelector('#result').innerHTML = result;
	}
};

const checkWin = () => {
	if (!cells.some(cell => cell.classList.contains('hidden')) &&
		flaggedBombs === numBombs) {
		toggleRestart('win');
	}
};

const gameOver = () => {
	cells.forEach(cell => {
		cell.classList.remove('hidden');
		if (cell.classList.contains('flagged') &&
			!cell.classList.contains('bomb')) {
			cell.classList.add('wrong');
		}
	});
	toggleRestart('lose');
};

const newGame = () => {
	cells.forEach(cell => {
		cell.className = 'hidden';
		cell.innerHTML = '';
	});
	flaggedBombs = 0;
	bombCountDisplay.innerHTML = numBombs;
	placeBombs();
};

// Playing mechanics

const reveal = cell => {
	if (!cell.classList.contains('hidden') ||
		cell.classList.contains('flagged')) {
		return;
	}
	cell.classList.remove('hidden');
	if (cell.classList.contains('bomb')) {
		cell.classList.add('blown');
		gameOver();
		return;
	} else if (cell.innerHTML === '') {
		findAllNext(cells.indexOf(cell)).forEach(index => {
			if (cells[index].classList.contains('hidden')) { reveal(cells[index]); }
		});
	}
	checkWin();
};

const toggleFlag = (cell) => {
	if (!cell.classList.contains('hidden') &&
		!cell.classList.contains('flagged')) {
		return;
	}

	cell.classList.toggle('flagged');
	cell.classList.toggle('hidden');
	if (cell.classList.contains('flagged')) {
		flaggedBombs += 1;
	} else {
		flaggedBombs -= 1;
	}
	bombCountDisplay.innerHTML = numBombs - flaggedBombs;
	checkWin();
};

// Event Listeners

grid.addEventListener('contextmenu', event => {
	event.preventDefault();
	event.stopImmediatePropagation();
	toggleFlag(event.target);
});

grid.addEventListener('click', event => {
	reveal(event.target);
	event.stopImmediatePropagation();
});

newGameButton.addEventListener('click', toggleConfig);

backdrop.addEventListener('click', event => {
	if (event.target !== backdrop) {
		return;
	}
	if (restartPanel.style.display === 'block') {
		toggleRestart();
	} else if (configPanel.style.display === 'block') {
		toggleConfig();
	}
});

configPanel.querySelector('form').addEventListener('submit', function (event) {
	event.preventDefault();
	setUp(this.level.value);
	toggleConfig();
});

document.getElementById('yes-button').addEventListener('click', () => {
	toggleRestart();
	newGame();
});

document.getElementById('no-button').addEventListener('click', toggleRestart);
