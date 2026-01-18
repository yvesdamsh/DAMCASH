import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VictoryParticles from '../effects/VictoryParticles';
import GameEndModal from './GameEndModal';

const PIECES = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
};

const initialBoard = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

export default function ChessBoard({ playerColor = 'white', onGameEnd, isMultiplayer = false, canMove = true, blockBoard = false, initialBoardState = null, onSaveMove = null, currentTurnOverride = null, gameStats = null }) {
  const [board] = useState(() => initialBoardState || initialBoard);
  const [gameStatus] = useState('playing');

  useEffect(() => {
    if (gameStatus !== 'playing' && onGameEnd) onGameEnd(gameStatus);
  }, [gameStatus, onGameEnd]);

  const displayBoard = playerColor === 'black' ? [...board].reverse().map(r => [...r].reverse()) : board;
  const winner = gameStatus === 'whiteWins' ? 'white' : gameStatus === 'blackWins' ? 'black' : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', flex: 1, backgroundColor: '#1a1a1a', padding: '16px' }}>
      <VictoryParticles show={gameStatus !== 'playing'} winner={winner} />
      <GameEndModal
        show={gameStatus !== 'playing'}
        winner={winner}
        playerColor={playerColor}
        onReplay={() => window.location.reload()}
        onHome={() => window.location.href = '/'}
        stats={gameStats}
      />
      <div style={{ width: 'min(90vw, calc(100vh - 200px))', height: 'min(90vw, calc(100vh - 200px))', aspectRatio: '1/1' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gridTemplateRows: 'repeat(8, 1fr)', width: '100%', height: '100%', gap: 0, border: '2px solid #3E2723' }}>
          {displayBoard.map((row, rowIndex) => (
            row.map((piece, colIndex) => {
              const actualRow = playerColor === 'black' ? 7 - rowIndex : rowIndex;
              const actualCol = playerColor === 'black' ? 7 - colIndex : colIndex;
              const isLight = (actualRow + actualCol) % 2 === 0;
              return (
                <div key={`${rowIndex}-${colIndex}`} style={{ backgroundColor: isLight ? '#F5E6D3' : '#B58863', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <AnimatePresence mode="wait">
                    {piece && (
                      <motion.span key={`${actualRow}-${actualCol}-${piece}`} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        style={{ fontSize: 'clamp(36px, 80%, 80px)', color: piece === piece.toUpperCase() ? '#FFFFFF' : '#1A1A1A', textShadow: piece === piece.toUpperCase() ? '0 2px 4px rgba(0,0,0,0.8)' : '0 1px 2px rgba(255,255,255,0.4)', userSelect: 'none' }}>
                        {PIECES[piece]}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          ))}
        </div>
      </div>
    </div>
  );
}