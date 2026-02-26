const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const resetButton = document.getElementById('reset');
const successMessage = document.getElementById('success');
const logicInputs = document.querySelectorAll('.animal-floor input');
const logicSuccessMessage = document.getElementById('logic-success');

const cols = 16;
const rows = 15;
const algorithmRows = [
  '2↑2→1↑1→2↑1→1↓1→1↑1→1↓1→1↑1→2↓4←',
  '1↓1←3↓1→1↓7→3↓1←2↑1←6↓1←2↑1←2↑3←',
  '2↓1←2↓1←5↑1←4↑1←',
];

const logicAnswers = {
  rabbit: '3',
  fox: '5',
  mouse: '4',
  elephant: '2',
};

const directionByArrow = {
  '↑': { dx: 0, dy: -1 },
  '↓': { dx: 0, dy: 1 },
  '←': { dx: -1, dy: 0 },
  '→': { dx: 1, dy: 0 },
};

const start = { x: 2, y: 5 };
const expectedSteps = parseAlgorithm(algorithmRows);
const expectedPath = buildPath(expectedSteps);

let cell = 40;
let x = start.x;
let y = start.y;
let drawnSegments = [];

function parseAlgorithm(rowsText) {
  return rowsText.flatMap((rowText) => {
    const matches = rowText.matchAll(/(\d+)([↑↓←→])/g);
    const expandedMoves = [];

    for (const match of matches) {
      const count = Number.parseInt(match[1], 10);
      const arrow = match[2];
      const unit = directionByArrow[arrow];

      for (let i = 0; i < count; i += 1) {
        expandedMoves.push({ dx: unit.dx, dy: unit.dy });
      }
    }

    return expandedMoves;
  });
}

function buildPath(steps) {
  let pointX = start.x;
  let pointY = start.y;
  const path = [];

  for (const step of steps) {
    pointX += step.dx;
    pointY += step.dy;
    path.push({ x: pointX, y: pointY });
  }

  return path;
}

function getBoardGeometry() {
  const availableWidth = Math.max(320, Math.floor(canvas.parentElement.clientWidth));
  const bottomBlocks = document.querySelectorAll('.controls');
  const bottomSpace = Array.from(bottomBlocks).reduce((sum, block) => {
    const styles = window.getComputedStyle(block);
    const marginTop = Number.parseFloat(styles.marginTop) || 0;
    const marginBottom = Number.parseFloat(styles.marginBottom) || 0;
    return sum + block.offsetHeight + marginTop + marginBottom;
  }, 0);

  const freeHeight = window.innerHeight - canvas.getBoundingClientRect().top - bottomSpace - 16;
  const availableHeight = Math.max(240, Math.floor(freeHeight));

  const fitByWidth = Math.floor(availableWidth / cols);
  const fitByHeight = Math.floor(availableHeight / rows);
  cell = Math.max(24, Math.min(fitByWidth, fitByHeight));

  return {
    width: cols * cell,
    height: rows * cell,
  };
}

function resizeBoard() {
  const { width, height } = getBoardGeometry();

  canvas.width = width;
  canvas.height = height;
  canvas.parentElement.style.width = `${width}px`;
  canvas.parentElement.style.height = `${height}px`;

  redrawAll();
}

function drawGrid() {
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const isBlue = (col + row) % 2 === 1;
      ctx.fillStyle = isBlue ? '#dbf2fb' : '#f7f4ff';
      ctx.fillRect(col * cell, row * cell, cell, cell);
    }
  }
}

function drawPathLine(fromX, fromY, toX, toY) {
  ctx.strokeStyle = '#5a26be';
  ctx.lineWidth = Math.max(4, Math.floor(cell * 0.16));
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(fromX * cell, fromY * cell);
  ctx.lineTo(toX * cell, toY * cell);
  ctx.stroke();
}

function drawStartMarker() {
  ctx.fillStyle = '#5a26be';
  ctx.beginPath();
  ctx.arc(start.x * cell, start.y * cell, Math.max(4, cell * 0.1), 0, Math.PI * 2);
  ctx.fill();
}

function drawCursorDot() {
  ctx.fillStyle = '#e95bb7';
  ctx.beginPath();
  ctx.arc(x * cell, y * cell, Math.max(6, cell * 0.15), 0, Math.PI * 2);
  ctx.fill();
}

function redrawAll() {
  drawGrid();

  let from = { ...start };
  for (const point of drawnSegments) {
    drawPathLine(from.x, from.y, point.x, point.y);
    from = point;
  }

  drawStartMarker();
  drawCursorDot();
}

function checkCompletion() {
  if (drawnSegments.length !== expectedPath.length) {
    return false;
  }

  return drawnSegments.every((point, index) => {
    const expectedPoint = expectedPath[index];
    return point.x === expectedPoint.x && point.y === expectedPoint.y;
  });
}

function updateSuccessText() {
  if (checkCompletion()) {
    successMessage.textContent = 'Поздравляем! Рисунок выполнен правильно!';
    successMessage.classList.add('visible');
  } else {
    successMessage.textContent = '';
    successMessage.classList.remove('visible');
  }
}

function resetBoard() {
  x = start.x;
  y = start.y;
  drawnSegments = [];
  successMessage.textContent = '';
  successMessage.classList.remove('visible');
  redrawAll();
}

function move(dx, dy) {
  const nextX = Math.max(0, Math.min(cols - 1, x + dx));
  const nextY = Math.max(0, Math.min(rows - 1, y + dy));

  if (nextX === x && nextY === y) return;

  drawPathLine(x, y, nextX, nextY);
  x = nextX;
  y = nextY;
  drawnSegments.push({ x, y });

  drawCursorDot();
  updateSuccessText();
}

function checkLogicTask() {
  const allCorrect = Array.from(logicInputs).every((input) => {
    const expectedValue = logicAnswers[input.dataset.animal];
    return input.value === expectedValue;
  });

  logicSuccessMessage.textContent = allCorrect
    ? 'Поздравляем! Все животные расселены правильно!'
    : '';
}

logicInputs.forEach((input) => {
  input.addEventListener('input', () => {
    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 1);
    checkLogicTask();
  });
});

window.addEventListener('keydown', (event) => {
  const keyActions = {
    ArrowUp: () => move(0, -1),
    ArrowDown: () => move(0, 1),
    ArrowLeft: () => move(-1, 0),
    ArrowRight: () => move(1, 0),
  };

  if (keyActions[event.key]) {
    event.preventDefault();
    keyActions[event.key]();
  }
});

window.addEventListener('resize', resizeBoard);
resetButton.addEventListener('click', resetBoard);

resizeBoard();
updateSuccessText();
checkLogicTask();
