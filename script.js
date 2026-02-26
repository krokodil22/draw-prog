const facts = [
  'На Марсе есть самая высокая гора',
  'Сатурн известен своими кольцами',
  'В космосе нельзя услышать звук',
  'Звёзды — это огромные раскалённые шары из газа',
];

const factBox = document.getElementById('factBox');
const quoteBtn = document.getElementById('quoteBtn');

quoteBtn.addEventListener('click', () => {
  factBox.textContent = facts[(Math.random() * facts.length) | 0];
});

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const step = 10;

const state = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  drawing: true,
};

ctx.lineWidth = 4;
ctx.lineCap = 'round';
ctx.strokeStyle = '#d91f26';
ctx.fillStyle = '#d91f26';

ctx.beginPath();
ctx.arc(state.x, state.y, 3, 0, Math.PI * 2);
ctx.fill();

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function drawTo(nextX, nextY) {
  ctx.beginPath();
  ctx.moveTo(state.x, state.y);
  ctx.lineTo(nextX, nextY);
  ctx.stroke();
  state.x = nextX;
  state.y = nextY;
}

window.addEventListener('keydown', (event) => {
  const key = event.key;

  if ([
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    ' ',
    'c',
    'C',
  ].includes(key)) {
    event.preventDefault();
  }

  if (key === 'c' || key === 'C') {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  if (key === ' ') {
    ctx.beginPath();
    ctx.arc(state.x, state.y, 4, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  let dx = 0;
  let dy = 0;

  if (key === 'ArrowUp') dy = -step;
  if (key === 'ArrowDown') dy = step;
  if (key === 'ArrowLeft') dx = -step;
  if (key === 'ArrowRight') dx = step;

  if (!dx && !dy) return;

  const nextX = clamp(state.x + dx, 0, canvas.width);
  const nextY = clamp(state.y + dy, 0, canvas.height);
  drawTo(nextX, nextY);
});
