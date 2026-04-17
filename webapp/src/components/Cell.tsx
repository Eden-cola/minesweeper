import React from 'react';
import type { Cell as CellType } from '../gql/generated';
import { clsx } from 'clsx';

interface CellProps {
  cell: CellType;
  onClick: (row: number, col: number) => void;
  onRightClick: (row: number, col: number) => void;
}

const ADJACENT_MINE_COLORS: Record<number, string> = {
  1: 'text-blue-600',
  2: 'text-green-600',
  3: 'text-red-600',
  4: 'text-purple-600',
  5: 'text-yellow-600',
  6: 'text-cyan-600',
  7: 'text-black',
  8: 'text-gray-600',
};

export const Cell: React.FC<CellProps> = ({ cell, onClick, onRightClick }) => {
  const { row, col, isRevealed, isMine, isFlagged, adjacentMines } = cell;

  const handleClick = () => {
    if (!isRevealed && !isFlagged) {
      onClick(row, col);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isRevealed) {
      onRightClick(row, col);
    }
  };

  const getCellContent = () => {
    if (isFlagged) {
      return '🚩';
    }
    if (!isRevealed) {
      return '';
    }
    if (isMine) {
      return '💣';
    }
    if (adjacentMines > 0) {
      return adjacentMines;
    }
    return '';
  };

  const getCellStyle = () => {
    if (isRevealed) {
      if (isMine) {
        return 'bg-red-500';
      }
      return 'bg-gray-200';
    }
    return 'bg-gray-400 hover:bg-gray-500';
  };

  return (
    <button
      className={clsx(
        'w-8 h-8 flex items-center justify-center text-sm font-bold border border-gray-600 transition-colors',
        getCellStyle(),
        !isRevealed && !isFlagged && 'cursor-pointer',
        isRevealed && 'cursor-default'
      )}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      disabled={isRevealed}
    >
      <span className={clsx(isRevealed && adjacentMines > 0 && ADJACENT_MINE_COLORS[adjacentMines])}>
        {getCellContent()}
      </span>
    </button>
  );
};
