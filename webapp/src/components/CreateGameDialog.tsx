import React, { useState } from 'react';

interface CreateGameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGame: (rows: number, cols: number, mines: number) => void;
}

export const CreateGameDialog: React.FC<CreateGameDialogProps> = ({
  isOpen,
  onClose,
  onCreateGame,
}) => {
  const [rows, setRows] = useState(10);
  const [cols, setCols] = useState(10);
  const [mines, setMines] = useState(10);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateGame(rows, cols, mines);
    onClose();
  };

  const maxMines = Math.floor(rows * cols * 0.3); // Max 30% of cells

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96">
        <h2 className="text-xl font-bold mb-4">创建新游戏</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              行数 (5-30)
            </label>
            <input
              type="number"
              min={5}
              max={30}
              value={rows}
              onChange={(e) => setRows(Math.max(5, Math.min(30, parseInt(e.target.value) || 5)))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              列数 (5-30)
            </label>
            <input
              type="number"
              min={5}
              max={30}
              value={cols}
              onChange={(e) => setCols(Math.max(5, Math.min(30, parseInt(e.target.value) || 5)))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              地雷数量 (1-{maxMines})
            </label>
            <input
              type="number"
              min={1}
              max={maxMines}
              value={mines}
              onChange={(e) => setMines(Math.max(1, Math.min(maxMines, parseInt(e.target.value) || 1)))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
