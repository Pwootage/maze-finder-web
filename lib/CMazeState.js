import {CRandom16} from './CRandom16.js';

export const skMazeCols = 9;
export const skMazeRows = 7;
export const skEnterCol = 4;
export const skEnterRow = 4;
export const skTargetCol = 5;
export const skTargetRow = 3;

export const ESide = {
  Invalid: -1,
  Top: 0,
  Right: 1,
  Bottom: 2,
  Left: 3
}

export class CMazeState {
  rng = new CRandom16(0);
  cells = [];
  path = [];
  initialized = false;

  constructor(blank) {
    this.reset(0, blank);
  }

  getCell(col, row) {
    if (row === undefined) {
      return this.cells[col];
    }
    return this.cells[col + row * skMazeCols];
  }

  reset(seed, blank) {
    this.rng.seed = seed;
    this.initialized = false;
    this.cells = [];
    this.path = [];
    for (let i = 0; i < skMazeCols * skMazeRows; i++) {
      this.cells.push(new SMazeCell());
    }

    if (blank) {
      for (let col = 0; col < skMazeCols; col++) {
        for (let row = 0; row < skMazeRows; row++) {
          let cell = this.getCell(col, row);
          if (row !== 0) {
            cell.openTop = true;
          }
          if (row !== skMazeRows - 1) {
            cell.openBottom = true;
          }
          if (col !== 0) {
            cell.openLeft = true;
          }
          if (col !== skMazeCols - 1) {
            cell.openRight = true;
          }
        }
      }
      return;
    }

    let sides = new Array(4).fill(ESide.Invalid);
    let cellIdx = 0;
    for (let i = skMazeCols * skMazeRows - 1; i !== 0;) {
      let acc = 0;
      if (cellIdx - skMazeCols > 0 && !this.getCell(cellIdx - skMazeCols).isOpen) {
        sides[acc++] = ESide.Top;
      }
      if (cellIdx < this.cells.length - 2 && (cellIdx + 1) % skMazeCols !== 0 && !this.getCell(cellIdx + 1).isOpen) {
        sides[acc++] = ESide.Right;
      }
      if (cellIdx + skMazeCols < this.cells.length && !this.getCell(cellIdx + skMazeCols).isOpen) {
        sides[acc++] = ESide.Bottom;
      }
      if (cellIdx > 0 && cellIdx % skMazeCols !== 0 && !this.getCell(cellIdx - 1).isOpen) {
        sides[acc++] = ESide.Left;
      }

      if (acc === 0) {
        do {
          cellIdx++;
          if (cellIdx > this.cells.length - 1) {
            cellIdx = 0;
          }
        } while (!this.getCell(cellIdx).isOpen);
        continue;
      }

      i--;
      let side = sides[this.rng.next() % acc];
      if (side === ESide.Bottom) {
        this.getCell(cellIdx).openBottom = true;
        this.getCell(cellIdx + skMazeCols).openTop = true;
        cellIdx += skMazeCols;
      } else if (side === ESide.Top) {
        this.getCell(cellIdx).openTop = true;
        this.getCell(cellIdx - skMazeCols).openBottom = true;
        cellIdx -= skMazeCols;
      } else if (side === ESide.Right) {
        this.getCell(cellIdx).openRight = true;
        this.getCell(cellIdx + 1).openLeft = true;
        cellIdx++;
      } else if (side === ESide.Left) {
        this.getCell(cellIdx).openLeft = true;
        this.getCell(cellIdx - 1).openRight = true;
        cellIdx--;
      }
    }
  }

  initialize() {
    let path = new Array(skMazeRows * skMazeCols).fill(0);
    path[0] = skEnterCol + skEnterRow * skMazeCols;
    this.getCell(path[0]).checked = true;
    let pathLength = 1;
    while (path[0] !== skTargetCol + skTargetRow * skMazeCols) {
      if (this.getCell(path[0]).openTop) {
        if (!this.getCell(path[0] - skMazeCols).checked) {
          path[pathLength] = path[0] - skMazeCols;
          pathLength++;
        }
      }
      if (this.getCell(path[0]).openRight) {
        if (!this.getCell(path[0] + 1).checked) {
          path[pathLength] = path[0] + 1;
          pathLength++;
        }
      }
      if (this.getCell(path[0]).openBottom) {
        if (!this.getCell(path[0] + skMazeCols).checked) {
          path[pathLength] = path[0] + skMazeCols;
          pathLength++;
        }
      }
      if (this.getCell(path[0]).openLeft) {
        if (!this.getCell(path[0] - 1).checked) {
          path[pathLength] = path[0] - 1;
          pathLength++;
        }
      }
      if (path[0] === path[pathLength - 1]) {
        pathLength--;
      }
      path[0] = path[pathLength - 1];
      this.getCell(path[0]).checked = true;
    }
    let idx = path[pathLength];
    while (pathLength !== 0) {
      // path[pathLength]--;
      pathLength--;
      idx = path[pathLength];
      let cell = this.getCell(idx);
      if (cell.checked) {
        cell.onPath = true;
        if (pathLength > 0) {
          this.path.push(idx);
        }
      }
    }
    this.path.push(skEnterCol + skEnterRow * skMazeCols);
    this.initialized = true;
  }

  generateObstacles() {
    if (!this.initialized) {
      this.initialize();
    }

    let self = this;

    function getRandom(offset) {
      let tmp = self.rng.next();
      return tmp + Math.imul((tmp / 5) | 0, -5) + offset;
    }

    let gate1Idx = getRandom(9);
    let gate2Idx = getRandom(21);
    let gate3Idx = getRandom(33);
    let puddle1Idx = getRandom(13);
    let puddle2Idx = getRandom(29);

    let side = ESide.Invalid;
    let idx = 0;

    let prevCol = skEnterCol;
    let prevRow = skEnterRow;
    let col = skEnterCol;
    let row = skEnterRow;

    while (col !== skTargetCol || row !== skTargetRow) {
      if (idx === gate1Idx || idx === gate2Idx || idx === gate3Idx) {
        if (side === ESide.Bottom) {
          this.getCell(col, row).gateTop = true;
          this.getCell(prevCol, prevRow).gateBottom = true;
        } else if (side === ESide.Top) {
          this.getCell(col, row).gateBottom = true;
          this.getCell(prevCol, prevRow).gateTop = true;
        } else if (side === ESide.Right) {
          this.getCell(col, row).gateLeft = true;
          this.getCell(prevCol, prevRow).gateRight = true;
        } else if (side === ESide.Left) {
          this.getCell(col, row).gateRight = true;
          this.getCell(prevCol, prevRow).gateLeft = true;
        }
      }

      let nextCol = col;
      let nextRow = -1;
      if (row < 1 || side === ESide.Bottom || !this.getCell(col, row).openTop || !this.getCell(col, row - 1).onPath) {
        if (row < skMazeRows - 1 && side !== ESide.Top && this.getCell(col, row).openBottom &&
          this.getCell(col, row + 1).onPath) {
          side = ESide.Bottom;
          nextRow = row + 1;
        } else {
          nextRow = row;
          if (col < 1 || side === ESide.Right || !this.getCell(col, row).openLeft ||
            !this.getCell(col - 1, row).onPath) {
            if (col > skMazeRows || side === ESide.Left || !this.getCell(col, row).openRight ||
              !this.getCell(col + 1, row).onPath) {
              return;
            }
            side = ESide.Right;
            nextCol = col + 1;
          } else {
            side = ESide.Left;
            nextCol = col - 1;
          }
        }
      } else {
        side = ESide.Top;
        nextRow = row - 1;
      }

      if (idx === puddle1Idx || idx === puddle2Idx) {
        if (col === 0 || row === 0 || col === skMazeCols - 1 || row === skMazeRows - 1) {
          if (idx === puddle1Idx) {
            puddle1Idx++;
          } else {
            puddle2Idx++;
          }
        } else {
          let cell = this.getCell(col, row);
          cell.puddle = true;
          if (side === ESide.Bottom) {
            this.getCell(nextCol, nextRow).openTop = false;
            cell.openBottom = false;
          } else if (side === ESide.Top) {
            this.getCell(nextCol, nextRow).openBottom = false;
            cell.openTop = false;
          } else if (side === ESide.Right) {
            this.getCell(nextCol, nextRow).openLeft = false;
            cell.openRight = false;
          } else if (side === ESide.Left) {
            this.getCell(nextCol, nextRow).openRight = false;
            cell.openLeft = false;
          }
        }
      }

      idx++;
      prevCol = col;
      prevRow = row;
      col = nextCol;
      row = nextRow;
    }
  }

  calcFastestPath() {
    let path = [];

    class Node {
      constructor(row, col, previous, gatePath, puddle) {
        this.row = row;
        this.col = col;
        this.previous = previous;
        this.f = Math.abs(row - skTargetRow) + Math.abs(col - skTargetCol);
        if (previous) {
          this.f += previous.g;
        }

        if (previous) {
          this.g = previous.g + Math.abs(row - previous.row) + Math.abs(col - previous.col);
          if (gatePath) {
            this.g += 0.5;
          }
          if (puddle) {
            this.g += 2;
          }
          // check if we're going the same direction
          if (previous.previous) {
            let same = false;
            // same direction
            let yDir = row - previous.row;
            let prevYDir = previous.row - previous.previous.row;
            let xDir = col - previous.col;
            let prevXDir = previous.col - previous.previous.col;
            if (xDir === prevXDir && yDir === prevYDir) {
              same = true;
            }
            if (!same) {
              this.g += 0.1;
            }
          }
        } else {
          this.g = 0;
        }
      }

      getIdx() {
        return this.row * skMazeCols + this.col;
      }
    }

    let open = [];
    let visited = new Array(this.cells.length).fill(false);
    open.push(new Node(skEnterRow, skEnterCol, null))

    while (open.length > 0) {
      // ok this should be a heap but
      open.sort((a, b) => b.f - a.f);
      let shortest = open.pop();
      if (visited[shortest.getIdx()]) {
        continue;
      }
      visited[shortest.getIdx()] = true;

      let cell = this.getCell(shortest.col, shortest.row);

      let neighbors = [];
      if (cell.openTop || cell.gateTop || cell.puddle) {
        let up = new Node(shortest.row - 1, shortest.col, shortest, cell.gateTop, cell.puddle);
        neighbors.push(up);
      }
      if (cell.openBottom || cell.gateBottom || cell.puddle) {
        let down = new Node(shortest.row + 1, shortest.col, shortest, cell.gateBottom, cell.puddle);
        neighbors.push(down);
      }
      if (cell.openLeft || cell.gateLeft || cell.puddle) {
        let left = new Node(shortest.row, shortest.col - 1, shortest, cell.gateLeft, cell.puddle);
        neighbors.push(left);
      }
      if (cell.openRight || cell.gateRight || cell.puddle) {
        let right = new Node(shortest.row, shortest.col + 1, shortest, cell.gateRight, cell.puddle);
        neighbors.push(right);
      }

      for (let neighbor of neighbors) {
        if (neighbor.row === skTargetRow && neighbor.col === skTargetCol) {
          // done!
          let path = [];
          let v = neighbor;
          while (v) {
            path.push(v.getIdx());
            v = v.previous;
          }
          return path;
        }

        if (neighbor.row >= skMazeRows || neighbor.row < 0) {
          continue;
        }
        if (neighbor.col >= skMazeCols || neighbor.col < 0) {
          continue;
        }
        if (visited[neighbor.getIdx()]) {
          continue;
        }
        open.push(neighbor);
      }
    }

    throw new Error('no path found');
  }

  toDebugString() {
    let res = '';
    for (let row = 0; row < skMazeRows; row++) {
      // first row
      for (let col = 0; col < skMazeCols; col++) {
        let cell = this.cells[col + row * skMazeCols];
        res += '╋';
        if (cell.gateTop) {
          res += '┅';
        } else if (cell.openTop) {
          res += ' ';
        } else {
          res += '━';
        }
      }
      res += '╋\n';
      // center row
      for (let col = 0; col < skMazeCols; col++) {
        let cell = this.cells[col + row * skMazeCols];
        if (cell.gateLeft) {
          res += '┇';
        } else if (cell.openLeft) {
          res += ' ';
        } else {
          res += '┃';
        }
        if (row === skEnterRow && col === skEnterCol) {
          res += 'E';
        } else if (row === skTargetRow && col === skTargetCol) {
          res += 'X';
        } else if (cell.puddle) {
          res += 'O';
        } else {
          res += ' ';
        }
      }
      {
        // last one
        let cell = this.cells[(skMazeCols - 1) + row * skMazeCols];
        if (cell.gateRight) {
          res += '┇';
        } else if (cell.openRight) {
          res += ' ';
        } else {
          res += '┃';
        }
      }
      res += '\n';
    }

    // last row
    for (let col = 0; col < skMazeCols; col++) {
      let cell = this.cells[col + (skMazeRows - 1) * skMazeCols];
      res += '╋';
      if (cell.gateBottom) {
        res += '┅';
      } else if (cell.openBottom) {
        res += ' ';
      } else {
        res += '━';
      }
    }
    res += '╋';

    return res;
  }
}

export class SMazeCell {
  openTop = false;
  openRight = false;
  openBottom = false;
  openLeft = false;

  gateTop = false;
  gateRight = false;
  gateBottom = false;
  gateLeft = false;

  puddle = false;
  onPath = false;
  checked = false;

  constructor() {
  }

  get isOpen() {
    return this.openTop || this.openRight || this.openBottom || this.openLeft;
  }
}
