import { CellModel } from './cell-model';
import { ObservableModel } from './observable-model';
import { BALLS, BoardDimension, EntryCellsCount } from '../constants';
import sampleSize from 'lodash.samplesize';
import { BallModel } from './ball-model';
import sample from 'lodash.sample';
import { findHorizontal, findMainDiagonal, findSecondaryDiagonal, findVertical } from '../utils';
import chunk from 'lodash.chunk';

export class BoardModel extends ObservableModel {
  constructor() {
    super('BoardModel');

    this._cells = null;
    this._combinations = [];

    this.makeObservable();
  }

  get cells() {
    return this._cells;
  }

  get activeCell() {
    return this._cells.find((cell) => cell.isActive);
  }

  get selectedCell() {
    return this._cells.find((cell) => cell.isSelected);
  }

  getEmptyCells(count) {
    const emptyCells = sampleSize(
      this._cells.filter((cell) => cell.isEmpty),
      count
    );

    return emptyCells;
  }

  getCellByUuid(uuid) {
    return this._cells.find((cell) => cell.uuid === uuid);
  }

  setBallsIntoCells(count) {
    const emptyCells = this.getEmptyCells(count);
    emptyCells.forEach((cell) => {
      cell.addBall(sample(BALLS));
    });
  }

  initialize() {
    this._initCells();
    this.setBallsIntoCells(3);
  }

  _initCells() {
    const cells = [];

    const { size } = BoardDimension;
    const gap = 10;
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const cell = new CellModel(i, j);
        cells.push(cell);
      }
    }
    this._cells = cells;
  }

  checkMath() {
    this._updateCombinations();

    if (this._combinations.length) {
      this._destroyBalls();
    }
  }

  _updateCombinations() {
    const { size } = BoardDimension;

    this._combinations.length = 0;
    this.cells2D = chunk(this._cells, size);

    for (let i = 0; i < this.cells2D.length; i++) {
      for (let j = 0; j < this.cells2D[i].length; j++) {
        const cell = this.cells2D[i][j];

        if (cell.ball) {
          const md = findMainDiagonal(this.cells2D, i, j, cell.ball.type, [cell]);
          if (md) {
            if (!this._comboAlreadyExists(md)) {
              this._combinations.push(md);
            }
          }

          const sd = findSecondaryDiagonal(this.cells2D, i, j, cell.ball.type, [cell]);
          if (sd) {
            if (!this._comboAlreadyExists(sd)) {
              this._combinations.push(sd);
            }
          }

          const h = findHorizontal(this.cells2D, i, j, cell.ball.type, [cell]);
          if (h) {
            if (!this._comboAlreadyExists(h)) {
              this._combinations.push(h);
            }
          }

          const v = findVertical(this.cells2D, i, j, cell.ball.type, [cell]);
          if (v) {
            if (!this._comboAlreadyExists(v)) {
              this._combinations.push(v);
            }
          }
        }
      }
    }
  }

  _comboAlreadyExists(combo) {
    const comboString = combo.map((cell) => `${cell.row}.${cell.col}`);
    for (let i = 0; i < this._combinations.length; i++) {
      const c = this._combinations[i].map((cell) => `${cell.row}.${cell.col}`);
      if (contains(c, comboString)) {
        return true;
      }
    }

    return false;
  }

  _checkSecondaryDiagonalCombos() {
    const { size } = BoardDimension;
    this.cells2D = chunk(this._cells, size);

    console.warn(this.cells2D);
    for (let i = 0; i < this.cells2D.length; i++) {
      for (let j = 0; j < this.cells2D[i].length; j++) {
        const cell = this.cells2D[i][j];

        if (cell.ball) {
          const { group } = findSecondaryDiagonal(this.cells2D, i, j, cell.ball.type, [cell]);
          if (group) {
            this._combinations.push(group);
          }
        }
      }
    }
  }

  _destroyBalls() {
    this._combinations.forEach((combo) => {
      combo.forEach((cell, index) => {
        setTimeout(() => {
          cell.removeBall();
        }, index * 80 + 300);
      });
    });
  }

  getPath(from, to) {
    const { size } = BoardDimension;
    this.cells2D = chunk(this._cells, size);

    const { row: fromRow, col: fromCol } = from;
    const { row: toRow, col: toCol } = to;

    var PF = require('pathfinding');

    const matrix = [];

    for (let i = 0; i < size; i++) {
      matrix[i] = [];
      for (let j = 0; j < size; j++) {
        if (this.cells2D[j][i].ball) {
          matrix[i][j] = 1;
        } else {
          matrix[i][j] = 0;
        }
      }
    }
    let grid = new PF.Grid(matrix);
    let finder = new PF.AStarFinder();
    let path = finder.findPath(fromRow, fromCol, toRow, toCol, grid);
    console.warn(path);
    if (path.length > 0) {
      let i = 0;
      const ball = from.removeBall();

      // const interval = setInterval(() => {
      //   const cell = this.cells2D[path[i][0]][path[i][1]];
      //   console.warn(cell);
      //   cell.addBall(ball.type);
      //   i++;
      //   if (i >= path.length) {
      //     cell.ball = ball;
      //     clearInterval(interval);
      //   }
      // }, 100);
    }
    if (path.length === 0) {
    }
  }
}
