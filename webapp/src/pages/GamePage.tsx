import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  useCreateGame,
  useRevealCell,
  useGetGame,
  useGameStateSubscription,
  useCellRevealedSubscription,
} from '../hooks/useGraphQL';
import { GameBoard } from '../components/GameBoard';
import { GameInfo } from '../components/GameInfo';
import { CreateGameDialog } from '../components/CreateGameDialog';
import { PlayerList } from '../components/PlayerList';
import type { GameStatus } from '../gql/generated';

export const GamePage: React.FC = () => {
  const [gameId, setGameId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const {
    currentGame,
    isLoading: _isLoading,
    error,
    setGame,
    setLoading,
    setError,
    revealCell,
    updateGameFromSubscription,
    reset,
  } = useGameStore();

  const { execute: createGame, loading: creatingGame } = useCreateGame();
  const { execute: revealCellMutation, loading: revealingCell } = useRevealCell();

  // Fetch game data
  const { data: gameData, loading: fetchingGame } = useGetGame(gameId);

  // Subscribe to game state updates
  const { data: stateUpdate } = useGameStateSubscription(gameId);

  // Subscribe to cell reveal events
  const { data: cellRevealEvent } = useCellRevealedSubscription(gameId);

  // Update game from query
  useEffect(() => {
    if (gameData) {
      setGame(gameData as any);
    }
  }, [gameData, setGame]);

  // Handle game state subscription updates
  useEffect(() => {
    if (stateUpdate?.game) {
      updateGameFromSubscription(stateUpdate.game as any);
    }
  }, [stateUpdate, updateGameFromSubscription]);

  // Handle cell reveal subscription events
  useEffect(() => {
    if (cellRevealEvent?.cell) {
      const { cell } = cellRevealEvent;
      revealCell(cell.row, cell.col, cell);
    }
  }, [cellRevealEvent, revealCell]);

  const handleCreateGame = async (rows: number, cols: number, mines: number) => {
    try {
      setLoading(true);
      setError(null);
      const result = await createGame({ input: { rows, cols, mines } });
      if (result) {
        setGame(result as any);
        setGameId((result as any).id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建游戏失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = async (row: number, col: number) => {
    if (!gameId || revealingCell) return;

    try {
      setError(null);
      const result = await revealCellMutation({
        input: { gameId, row, col },
      });

      if (result) {
        const { cell, game } = result as any;
        revealCell(cell.row, cell.col, cell);
        if (game) {
          setGame(game);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '翻开格子失败');
    }
  };

  const handleCellRightClick = async (row: number, col: number) => {
    // Right-click for flagging - would need to implement toggleFlag mutation
    console.log('Right click on cell', row, col);
  };

  const handleNewGame = () => {
    reset();
    setGameId(null);
    setShowCreateDialog(true);
  };

  // Loading state
  if (creatingGame || fetchingGame) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">加载中...</div>
      </div>
    );
  }

  // No game loaded - show start screen
  if (!currentGame) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold mb-8">扫雷游戏</h1>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="px-8 py-4 bg-blue-600 text-white text-xl rounded-lg hover:bg-blue-700 transition-colors"
        >
          创建新游戏
        </button>

        <CreateGameDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onCreateGame={handleCreateGame}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">扫雷游戏</h1>
          <button
            onClick={handleNewGame}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            新游戏
          </button>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Game Info */}
        <GameInfo
          status={currentGame.status as GameStatus}
          remainingCells={currentGame.remainingCells}
          score={currentGame.scoreChange}
          mines={currentGame.mines}
          rows={currentGame.rows}
          cols={currentGame.cols}
        />

        {/* Game Board */}
        <div className="flex justify-center mb-4">
          <GameBoard
            game={currentGame}
            onCellClick={handleCellClick}
            onCellRightClick={handleCellRightClick}
          />
        </div>

        {/* Player List */}
        <PlayerList players={currentGame.players as any} />

        {/* Create Game Dialog */}
        <CreateGameDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onCreateGame={handleCreateGame}
        />
      </div>
    </div>
  );
};
