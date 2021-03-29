import {
  CMazeState,
  skEnterCol,
  skEnterRow,
  skMazeCols,
  skMazeRows,
  skTargetCol,
  skTargetRow
} from './lib/CMazeState.js';
import {seeds} from './lib/seeds.js';

export function main() {
  document.querySelector('#clicker').addEventListener('click', () => {
    click();
  })

  document.querySelector('#seedNumber').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      click();
    }
  });

  const urlParams = new URLSearchParams(window.location.search);
  let seed = Math.floor(Math.random() * 300);
  if (urlParams.has('seed')) {
    let urlSeed = Number(urlParams.get('seed'))
    if (!isNaN(urlSeed) && seed >= 0 && seed < 300) {
      seed = urlSeed;
    }
  }
  document.querySelector('#seedNumber').value = seed;
  click();
}

export function click() {
  const seed = Number(document.querySelector('#seedNumber').value);

  const maze = new CMazeState();
  maze.reset(seeds[seed]);
  maze.initialize();
  maze.generateObstacles();
  // document.querySelector('#output').innerHTML = maze.toDebugString();

  drawMaze(maze);
}

const cellSize = 40;
const tailLength = cellSize / 4;

function drawPath(path, ctx) {
  for (let i = 1; i < path.length; i++) {
    let cellIdx = path[i];
    let row = (cellIdx / skMazeCols) | 0;
    let col = cellIdx % skMazeCols;

    let prevIdx = path[i - 1];
    let prevRow = (prevIdx / skMazeCols) | 0;
    let prevCol = prevIdx % skMazeCols;

    const x = col * cellSize + cellSize / 2;
    const y = row * cellSize + cellSize / 2;

    const prevX = prevCol * cellSize + cellSize / 2;
    const prevY = prevRow * cellSize + cellSize / 2;

    const borderX = (x + prevX) / 2;
    const borderY = (y + prevY) / 2;

    function arrow(x0, y0, x1, y1) {
      ctx.beginPath();
      // main body
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);

      let line = normalizeVec([
        x1 - x0,
        y1 - y0
      ]).map(v => v * tailLength);
      {
        // "left" part,
        let theta = Math.PI / 4;
        let rotMat = [
          Math.cos(theta), -Math.sin(theta),
          Math.sin(theta), Math.cos(theta)
        ];

        let [x2, y2] = matrixTimesVector(rotMat, line);

        ctx.moveTo(borderX, borderY);
        ctx.lineTo(borderX - x2, borderY - y2);
      }

      {
        // "right" part,
        let theta = -Math.PI / 4;
        let rotMat = [
          Math.cos(theta), -Math.sin(theta),
          Math.sin(theta), Math.cos(theta)
        ];
        let [x2, y2] = matrixTimesVector(rotMat, line);

        ctx.moveTo(borderX, borderY);
        ctx.lineTo(borderX - x2, borderY - y2);
      }

      // done
      ctx.stroke();
    }

    arrow(x, y, prevX, prevY);

    // ctx.beginPath();
    // ctx.arc(x, y, (cellSize / 2) * 0.5, 0, 2 * Math.PI);
    // ctx.fill();

    // ctx.font = '8px JetBrains Mono';
    // ctx.strokeStyle = '#000';
    // ctx.fillStyle = '#000';
    // ctx.fillText(`${i}`, x, y);
  }
}

export function drawMaze(maze) {
  const canvas = document.querySelector('#canvasOut');
  canvas.width = skMazeCols * cellSize;
  canvas.height = skMazeRows * cellSize;
  const ctx = canvas.getContext("2d");

  // First, draw the maze cells
  for (let row = 0; row < skMazeRows; row++) {
    for (let col = 0; col < skMazeCols; col++) {
      const x0 = col * cellSize;
      const x1 = x0 + cellSize;
      const y0 = row * cellSize;
      const y1 = y0 + cellSize;
      const cell = maze.getCell(col, row);

      function line(startX, startY, endX, endY) {
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      if (cell.gateTop) {
        // gate
        ctx.strokeStyle = '#AA0';
        line(x0, y0, x1, y0);
      } else if (!cell.openTop) {
        // closed
        ctx.strokeStyle = '#000';
        line(x0, y0, x1, y0);
      }

      if (cell.gateBottom) {
        // gate
        ctx.strokeStyle = '#AA0';
        line(x0, y1, x1, y1);
      } else if (!cell.openBottom) {
        // closed
        ctx.strokeStyle = '#000';
        line(x0, y1, x1, y1);
      }

      if (cell.gateLeft) {
        // gate
        ctx.strokeStyle = '#AA0';
        line(x0, y0, x0, y1);
      } else if (!cell.openLeft) {
        // closed
        ctx.strokeStyle = '#000';
        line(x0, y0, x0, y1);
      }

      if (cell.gateRight) {
        // gate
        ctx.strokeStyle = '#AA0';
        line(x1, y0, x1, y1);
      } else if (!cell.openRight) {
        // closed
        ctx.strokeStyle = '#000';
        line(x1, y0, x1, y1);
      }

      if (cell.puddle) {
        ctx.strokeStyle = '#99F';
        ctx.fillStyle = '#99F';
        ctx.beginPath();
        ctx.arc((x0 + x1) / 2, (y0 + y1) / 2, (cellSize / 2) * 0.75, 0, 2 * Math.PI);
        ctx.fill();
      }

      if (col === skEnterCol && row === skEnterRow) {
        ctx.strokeStyle = '#6F6';
        ctx.fillStyle = '#6f6';
        ctx.beginPath();
        ctx.arc((x0 + x1) / 2, (y0 + y1) / 2, (cellSize / 2) * 0.75, 0, 2 * Math.PI);
        ctx.fill();
      }

      if (col === skTargetCol && row === skTargetRow) {
        ctx.strokeStyle = '#F33';
        ctx.fillStyle = '#F33';
        ctx.beginPath();
        ctx.arc((x0 + x1) / 2, (y0 + y1) / 2, (cellSize / 2) * 0.75, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }

  // Then the calculated path
  ctx.strokeStyle = 'rgba(150, 0, 150, 0.25)';
  ctx.fillStyle = 'rgba(150, 0, 150, 0.25)';
  ctx.lineWidth = 3;
  drawPath(maze.path, ctx);

  // then the fastest path
  ctx.strokeStyle = '#0F0';
  ctx.fillStyle = '#0F0';
  ctx.lineWidth = 3;
  let fastestPath = maze.calcFastestPath();
  drawPath(fastestPath, ctx);

  let outEle = document.querySelector('#out');
  outEle.innerHTML = `
  Game's length: ${maze.path.length}<br />
  Acutal length: ${fastestPath.length}
  `;
}

function matrixTimesVector(matrix, vector) {
  const n = vector.length;
  const res = new Array(n);
  for (let i = 0; i < n; i++) {
    let v = 0;
    for (let j = 0; j < n; j++) {
      v += matrix[i * n + j] * vector[j];
    }
    res[i] = v;
  }
  return res;
}

function normalizeVec(vec) {
  let v = 0;
  for (let i of vec) {
    v += i * i;
  }
  let len = Math.sqrt(v);
  return vec.map(i => i / len);
}

main();
