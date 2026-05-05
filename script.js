const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const resetButton = document.getElementById('reset');
const successMessage = document.getElementById('success');
const logicInputs = document.querySelectorAll('.animal-floor input');
const logicSuccessMessage = document.getElementById('logic-success');
const completionModal = document.getElementById('completion-modal');
const completionCloseButton = document.getElementById('completion-close');
const fireworksContainer = document.getElementById('fireworks');
const monsters = document.querySelectorAll('.monster');
const houseSlots = document.querySelectorAll('.house-slot');
const monstersResetButton = document.getElementById('monsters-reset');
const monstersSuccessMessage = document.getElementById('monsters-success');

const trainerStartButton = document.getElementById('trainer-start');
const trainerWrap = document.getElementById('trainer-wrap');
const trainerFrame = trainerWrap?.querySelector('iframe');
const trainerStartOverlay = document.getElementById('trainer-start-overlay');

const STORAGE_KEY = 'draw-prog-progress-v1';
const progress = loadProgress();

const taskElements = {
  draw: document.querySelector('section.task[aria-label="Задание 1"]'),
  logic: document.querySelector('section.task[aria-label="Задание 2"]'),
  monsters: document.querySelector('section.task[aria-label="Задание 4"]'),
};

const cols = 16;
const rows = 15;
const algorithmRows = [
  '2↑2→1↑1→2↑1→1↓1→1↑1→1↓1→1↑1→2↓4←',
  '1↓1←3↓1→1↓7→3↓1←2↑1←6↓1←2↑1←2↑3←',
  '2↓1←2↓1←5↑1←4↑1←',
];

const logicAnswers = { rabbit: '3', fox: '5', mouse: '4', elephant: '2' };
const directionByArrow = { '↑': { dx: 0, dy: -1 }, '↓': { dx: 0, dy: 1 }, '←': { dx: -1, dy: 0 }, '→': { dx: 1, dy: 0 } };
const start = { x: 2, y: 5 };
const expectedSteps = parseAlgorithm(algorithmRows);
const expectedPath = buildPath(expectedSteps);

let cell = 40;
let x = start.x;
let y = start.y;
let drawnSegments = [];
let allTasksCelebrated = false;
let draggedMonsterId = null;

const fireworkPalette = ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#5f27cd', '#ff9ff3'];
const monsterAnswers = { red: 'house3', blue: 'house2', green: 'house5', black: 'house4', yellow: 'house1' };

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}
function saveProgress() { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }

function setTaskCompleted(taskKey, completed) {
  const el = taskElements[taskKey];
  if (!el) return;
  progress.completed = progress.completed || {};
  progress.completed[taskKey] = completed;
  el.classList.toggle('task-completed', completed);
  saveProgress();
}

function hydrateTaskBadges() {
  Object.entries(taskElements).forEach(([key, task]) => {
    if (!task) return;
    const badge = document.createElement('span');
    badge.className = 'task-done-badge';
    badge.textContent = '✅ Выполнено';
    task.appendChild(badge);
    task.classList.toggle('task-completed', Boolean(progress.completed?.[key]));
  });
}

function createFireworks() { fireworksContainer.innerHTML=''; for (let i=0;i<14;i+=1){const firework=document.createElement('span');firework.className='firework';firework.style.setProperty('--x',`${10+Math.random()*80}%`);firework.style.setProperty('--y',`${10+Math.random()*80}%`);firework.style.setProperty('--size',`${10+Math.random()*12}px`);firework.style.color=fireworkPalette[i%fireworkPalette.length];firework.style.animationDelay=`${Math.random()*1.5}s`;fireworksContainer.appendChild(firework);} }
function closeCompletionModal(){completionModal.classList.remove('visible');}
function celebrateAllTasks(){ if(allTasksCelebrated) return; allTasksCelebrated=true; createFireworks(); completionModal.classList.add('visible'); }
function checkAllTasksCompletion(){ if(checkCompletion()&&checkLogicTask()&&checkMonsterTask()) celebrateAllTasks(); }

function parseAlgorithm(rowsText){return rowsText.flatMap((rowText)=>{const matches=rowText.matchAll(/(\d+)([↑↓←→])/g);const expanded=[];for(const m of matches){const count=Number.parseInt(m[1],10);const unit=directionByArrow[m[2]];for(let i=0;i<count;i+=1) expanded.push({dx:unit.dx,dy:unit.dy});}return expanded;});}
function buildPath(steps){let pointX=start.x;let pointY=start.y;const path=[];for(const step of steps){pointX+=step.dx;pointY+=step.dy;path.push({x:pointX,y:pointY});}return path;}

function getBoardGeometry(){const availableWidth=Math.max(320,Math.floor(canvas.parentElement.clientWidth));const bottomBlocks=document.querySelectorAll('.controls');const bottomSpace=Array.from(bottomBlocks).reduce((sum,block)=>{const styles=window.getComputedStyle(block);return sum+block.offsetHeight+(Number.parseFloat(styles.marginTop)||0)+(Number.parseFloat(styles.marginBottom)||0);},0);const freeHeight=window.innerHeight-canvas.getBoundingClientRect().top-bottomSpace-10;const availableHeight=Math.max(200,Math.floor(freeHeight));const fitByWidth=Math.floor(availableWidth/cols);const fitByHeight=Math.floor(availableHeight/rows);cell=Math.max(18,Math.min(fitByWidth,fitByHeight));return {width:cols*cell,height:rows*cell};}
function resizeBoard(){const {width,height}=getBoardGeometry();canvas.width=width;canvas.height=height;canvas.parentElement.style.width=`${width}px`;canvas.parentElement.style.height=`${height}px`;redrawAll();}
function drawGrid(){for(let row=0;row<rows;row+=1){for(let col=0;col<cols;col+=1){ctx.fillStyle=(col+row)%2===1?'#dbf2fb':'#f7f4ff';ctx.fillRect(col*cell,row*cell,cell,cell);}}}
function drawPathLine(fromX,fromY,toX,toY){ctx.strokeStyle='#5a26be';ctx.lineWidth=Math.max(4,Math.floor(cell*0.16));ctx.lineCap='round';ctx.beginPath();ctx.moveTo(fromX*cell,fromY*cell);ctx.lineTo(toX*cell,toY*cell);ctx.stroke();}
function drawStartMarker(){ctx.fillStyle='#5a26be';ctx.beginPath();ctx.arc(start.x*cell,start.y*cell,Math.max(4,cell*0.1),0,Math.PI*2);ctx.fill();}
function drawCursorDot(){ctx.fillStyle='#e95bb7';ctx.beginPath();ctx.arc(x*cell,y*cell,Math.max(6,cell*0.15),0,Math.PI*2);ctx.fill();}
function redrawAll(){drawGrid();let from={...start};for(const point of drawnSegments){drawPathLine(from.x,from.y,point.x,point.y);from=point;}drawStartMarker();drawCursorDot();}

function checkCompletion(){ if(drawnSegments.length!==expectedPath.length) return false; return drawnSegments.every((point,index)=>point.x===expectedPath[index].x&&point.y===expectedPath[index].y); }
function updateSuccessText(){const ok=checkCompletion();successMessage.textContent=ok?'Поздравляем! Рисунок выполнен правильно!':'';successMessage.classList.toggle('visible',ok);setTaskCompleted('draw',ok);if(ok) checkAllTasksCompletion();}
function resetBoard(){x=start.x;y=start.y;drawnSegments=[];redrawAll();updateSuccessText();}
function move(dx,dy){const nextX=Math.max(0,Math.min(cols-1,x+dx));const nextY=Math.max(0,Math.min(rows-1,y+dy));if(nextX===x&&nextY===y) return;drawPathLine(x,y,nextX,nextY);x=nextX;y=nextY;drawnSegments.push({x,y});drawCursorDot();updateSuccessText();}

function checkLogicTask(){const allCorrect=Array.from(logicInputs).every((input)=>input.value===logicAnswers[input.dataset.animal]);logicSuccessMessage.textContent=allCorrect?'Поздравляем! Все животные расселены правильно!':'';setTaskCompleted('logic',allCorrect);return allCorrect;}

function resetMonsters(){const list=document.querySelector('.monster-list');monsters.forEach((monster)=>list.appendChild(monster));monstersSuccessMessage.textContent='';houseSlots.forEach((slot)=>slot.classList.remove('house-correct','house-wrong'));setTaskCompleted('monsters',false);}
function checkMonsterTask(){const placed=Array.from(houseSlots).flatMap((slot)=>Array.from(slot.querySelectorAll('.monster')).map((monster)=>({house:slot.dataset.house,monster:monster.dataset.monster})));if(placed.length!==monsters.length){monstersSuccessMessage.textContent='';setTaskCompleted('monsters',false);return false;}const allCorrect=placed.every((p)=>monsterAnswers[p.monster]===p.house);houseSlots.forEach((slot)=>{const monster=slot.querySelector('.monster');if(!monster) return;const correctHouse=monsterAnswers[monster.dataset.monster];slot.classList.toggle('house-correct',correctHouse===slot.dataset.house);slot.classList.toggle('house-wrong',correctHouse!==slot.dataset.house);});monstersSuccessMessage.textContent=allCorrect?'Отлично! Все монстрики живут в правильных домиках!':'';setTaskCompleted('monsters',allCorrect);return allCorrect;}
function restoreProgress(){
  Object.entries(taskElements).forEach(([key, task]) => {
    if (!task) return;
    task.classList.toggle('task-completed', Boolean(progress.completed?.[key]));
  });
}

logicInputs.forEach((input)=>input.addEventListener('input',()=>{input.value=input.value.replace(/[^0-9]/g,'').slice(0,1);checkLogicTask();checkAllTasksCompletion();}));
monsters.forEach((monster)=>monster.addEventListener('dragstart',(event)=>{draggedMonsterId=monster.id;event.dataTransfer.setData('text/plain',monster.id);}));
houseSlots.forEach((slot)=>{slot.addEventListener('dragover',(event)=>event.preventDefault());slot.addEventListener('drop',(event)=>{event.preventDefault();const id=event.dataTransfer.getData('text/plain')||draggedMonsterId;const monster=document.getElementById(id);if(!monster) return;slot.appendChild(monster);checkMonsterTask();checkAllTasksCompletion();});});
monstersResetButton.addEventListener('click',resetMonsters);
window.addEventListener('keydown',(event)=>{const keyActions={ArrowUp:()=>move(0,-1),ArrowDown:()=>move(0,1),ArrowLeft:()=>move(-1,0),ArrowRight:()=>move(1,0)};if(keyActions[event.key]){event.preventDefault();keyActions[event.key]();}});
window.addEventListener('resize',resizeBoard);
resetButton.addEventListener('click',resetBoard);
completionCloseButton.addEventListener('click',closeCompletionModal);
completionModal.addEventListener('click',(event)=>{if(event.target===completionModal) closeCompletionModal();});

hydrateTaskBadges();
restoreProgress();
resizeBoard();

// Не пересчитываем статусы задач при загрузке страницы,
// чтобы не сбрасывать сохранённую отметку «Выполнено».


if (trainerStartButton && trainerWrap && trainerFrame && trainerStartOverlay) {
  trainerStartButton.addEventListener('click', () => {
    trainerWrap.classList.remove('trainer-wrap--locked');
    trainerStartOverlay.hidden = true;
    trainerFrame.contentWindow?.focus();
  });

  window.addEventListener('keydown', (event) => {
    if (!trainerStartOverlay.hidden && event.code === 'Space') {
      event.preventDefault();
    }
  });
}
