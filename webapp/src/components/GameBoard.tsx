import React from 'react';
import type { Game } from '../gql/generated';
import { Cell } from './Cell';

interface GameBoardProps {
  game: Game;
  onCellClick: (row: number, col: number) => void;
  onCellRightClick: (row: number, col: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  game,
  onCellClick,
  onCellRightClick,
}) => {
  const { rows, cols, cells } = game;

  return (
    <div
      className="inline-grid gap-0 border-2 border-gray-800"
      style={{
        gridTemplateColumns: `repeat(${cols}, 2rem)`,
        gridTemplateRows: `repeat(${rows}, 2rem)`,
      }}
    >
      {cells.map((rowCells, rowIndex) =>
        rowCells.map((cell, colIndex) => (
          <Cell
            key={`${rowIndex}-${colIndex}`}
            cell={cell}
            onClick={onCellClick}
            onRightClick={onCellRightClick}
          />
        ))
      )}
    </div>
  );
};
