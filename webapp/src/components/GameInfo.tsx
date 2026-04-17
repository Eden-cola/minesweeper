import React from 'react';
import type { GameStatus } from '../gql/generated';

interface GameStatusProps {
  status: GameStatus;
  remainingCells: number;
  score: number;
  mines: number;
  rows: number;
  cols: number;
}

const STATUS_LABELS: Record<GameStatus, string> = {
  WAITING: '等待开始',
  PLAYING: '游戏中',
  COMPLETED: '游戏结束',
  ABANDONED: '已放弃',
};

const STATUS_COLORS: Record<GameStatus, string> = {
  WAITING: 'text-yellow-600',
  PLAYING: 'text-green-600',
  COMPLETED: 'text-blue-600',
  ABANDONED: 'text-red-600',
};

export const GameInfo: React.FC<GameStatusProps> = ({
  status,
  remainingCells,
  score,
  mines,
  rows,
  cols,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-500">游戏状态</div>
          <div className={`text-lg font-bold ${STATUS_COLORS[status]}`}>
            {STATUS_LABELS[status]}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">当前分数</div>
          <div className="text-lg font-bold text-blue-600">{score}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">游戏规模</div>
          <div className="text-lg font-bold">
            {rows} × {cols}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">剩余格子</div>
          <div className="text-lg font-bold text-orange-600">{remainingCells}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">地雷数量</div>
          <div className="text-lg font-bold text-red-600">{mines}</div>
        </div>
      </div>
    </div>
  );
};
