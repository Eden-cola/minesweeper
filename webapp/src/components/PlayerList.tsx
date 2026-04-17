import React from 'react';
import type { Player } from '../gql/generated';

interface PlayerListProps {
  players: Player[];
}

export const PlayerList: React.FC<PlayerListProps> = ({ players }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-bold mb-3">玩家列表</h3>
      {players.length === 0 ? (
        <div className="text-gray-500 text-sm">暂无玩家</div>
      ) : (
        <ul className="space-y-2">
          {players.map((player) => (
            <li key={player.id} className="flex justify-between items-center">
              <span className="font-medium">{player.user.name}</span>
              <span className="text-sm text-gray-600">分数: {player.score}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
