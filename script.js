const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const dot = document.getElementById('dot');
const resetButton = document.getElementById('reset');

const cols = 16;
const rows = 12;
const cell = Math.floor(canvas.width / cols);

let x = 2;
let y = 2;
const start = { x, y };

function drawGrid() {
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const isBlue = (col + row) % 2 === 1;
      ctx.fillStyle = isBlue ? '#71b7d3' : '#f4f4f4';
      ctx.fillRect(col * cell, row * cell, cell, cell);
    }
  }
}

function drawPathLine(fromX, fromY, toX, toY) {
  ctx.strokeStyle = '#0b1428';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(fromX * cell + cell / 2, fromY * cell + cell / 2);
  ctx.lineTo(toX * cell + cell / 2, toY * cell + cell / 2);
  ctx.stroke();
}

function drawStartDot() {
  ctx.fillStyle = '#0b1428';
  ctx.beginPath();
  ctx.arc(start.x * cell + cell / 2, start.y * cell + cell / 2, 6, 0, Math.PI * 2);
  ctx.fill();
}

function placeDot() {
  dot.style.left = `${((x + 0.5) / cols) * 100}%`;
  dot.style.top = `${((y + 0.5) / rows) * 100}%`;
}

function resetBoard() {
  x = start.x;
  y = start.y;
  drawGrid();
  drawStartDot();
  placeDot();
}

function move(dx, dy) {
  const nextX = Math.max(0, Math.min(cols - 1, x + dx));
  const nextY = Math.max(0, Math.min(rows - 1, y + dy));

  if (nextX === x && nextY === y) return;

  drawPathLine(x, y, nextX, nextY);
  x = nextX;
  y = nextY;
  placeDot();
}

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

resetButton.addEventListener('click', resetBoard);

resetBoard();
