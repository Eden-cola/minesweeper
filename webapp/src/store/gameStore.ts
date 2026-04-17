import { create } from 'zustand';
import type { Game, Cell } from '../gql/generated';

interface GameState {
  // Current game
  currentGame: Game | null;
  isLoading: boolean;
  error: string | null;

  // Local UI state
  revealedCells: Set<string>; // "row-col" format

  // Actions
  setGame: (game: Game) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  revealCell: (row: number, col: number, cell: Cell) => void;
  updateGameFromSubscription: (game: Game) => void;
  reset: () => void;
}

const getCellKey = (row: number, col: number) => `${row}-${col}`;

export const useGameStore = create<GameState>((set) => ({
  currentGame: null,
  isLoading: false,
  error: null,
  revealedCells: new Set(),

  setGame: (game) => set({ currentGame: game }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  revealCell: (row, col, cell) => {
    if (cell.isRevealed) {
      set((state) => {
        const newRevealedCells = new Set(state.revealedCells);
        newRevealedCells.add(getCellKey(row, col));
        return { revealedCells: newRevealedCells };
      });
    }
  },

  updateGameFromSubscription: (game) => {
    set((state) => {
      const newRevealedCells = new Set(state.revealedCells);
      // Mark all revealed cells
      game.cells.forEach((rowCells, row) => {
        rowCells.forEach((cell, col) => {
          if (cell.isRevealed) {
            newRevealedCells.add(getCellKey(row, col));
          }
        });
      });
      return { currentGame: game, revealedCells: newRevealedCells };
    });
  },

  reset: () => set({
    currentGame: null,
    isLoading: false,
    error: null,
    revealedCells: new Set(),
  }),
}));

// Selector helpers
export const selectCurrentGame = (state: GameState) => state.currentGame;
export const selectIsLoading = (state: GameState) => state.isLoading;
export const selectError = (state: GameState) => state.error;
export const selectRevealedCells = (state: GameState) => state.revealedCells;
