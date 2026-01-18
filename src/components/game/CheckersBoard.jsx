import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VictoryParticles from '../effects/VictoryParticles';
import GameEndModal from './GameEndModal';

const createInitialBoard = () => {
  const board = Array(10).fill(null).map(() => Array(10).fill(null));
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 10; col++) {
      if ((row + col) % 2 === 1) board[row][col] = { color: 'black', isKing: false };
    }
  }
  for (let row = 6; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if ((row + col) % 2 === 1) board[row][col] = { color: 'white', isKing: false };
    }
  }
  return board;
};

const getSquareNumber = (row, col) => {
  if ((row + col) % 2 === 0) return null;
  return Math.floor(row * 5 + col / 2) + 1;
};

const cloneBoard = (board) => board.map(r => r.map(c => c ? { ...c } : null));

export default function CheckersBoard({
        playerColor = 'white',
        onGameEnd,
        isMultiplayer = false,
        canMove = true,
        blockBoard = false,
        initialBoardState = null,
        onSaveMove = null,
        currentTurnOverride = null,
        gameStats = null,
        aiLevel = 'medium'
      }) {
  const [board, setBoard] = useState(() => initialBoardState || createInitialBoard());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [currentTurn, setCurrentTurn] = useState('white');
  const effectiveTurn = isMultiplayer && currentTurnOverride ? currentTurnOverride : currentTurn;
  const [gameStatus, setGameStatus] = useState('playing');
  const [mustCapture, setMustCapture] = useState([]);
  const [chainCapture, setChainCapture] = useState(null);

  useEffect(() => {
    if (initialBoardState) {
      setBoard(initialBoardState);
      setSelectedSquare(null);
      setValidMoves([]);
      setChainCapture(null);
    }
  }, [initialBoardState]);

  useEffect(() => {
    if (gameStatus !== 'playing' && onGameEnd) onGameEnd(gameStatus);
  }, [gameStatus, onGameEnd]);

  const getCaptureMoves = useCallback((row, col, boardState, piece) => {
    const moves = [];
    const directions = piece.isKing
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : piece.color === 'white'
        ? [[-1, -1], [-1, 1]]
        : [[1, -1], [1, 1]];

    if (piece.isKing) {
      directions.forEach(([dr, dc]) => {
        let foundOpponent = null;
        let foundPos = null;
        for (let i = 1; i < 10; i++) {
          const r = row + dr * i;
          const c = col + dc * i;
          if (r < 0 || r >= 10 || c < 0 || c >= 10) break;
          const p = boardState[r][c];
          if (!p) {
            if (foundOpponent) moves.push({ row: r, col: c, captured: [foundPos], isCapture: true });
          } else if (p.color !== piece.color && !foundOpponent) {
            foundOpponent = p;
            foundPos = { row: r, col: c };
          } else {
            break;
          }
        }
      });
    } else {
      [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => {
        const midRow = row + dr;
        const midCol = col + dc;
        const targetRow = row + dr * 2;
        const targetCol = col + dc * 2;
        if (targetRow >= 0 && targetRow < 10 && targetCol >= 0 && targetCol < 10) {
          const midPiece = boardState[midRow]?.[midCol];
          const targetPiece = boardState[targetRow]?.[targetCol];
          if (midPiece && midPiece.color !== piece.color && !targetPiece) {
            moves.push({ row: targetRow, col: targetCol, captured: [{ row: midRow, col: midCol }], isCapture: true });
          }
        }
      });
    }
    return moves;
  }, []);

  const getCaptureSequences = useCallback((boardState, row, col, piece) => {
    const sequences = [];
    const captureMoves = getCaptureMoves(row, col, boardState, piece);
    if (captureMoves.length === 0) return [[]];

    captureMoves.forEach(move => {
      const newBoard = cloneBoard(boardState);
      const movingPiece = { ...newBoard[row][col] };
      move.captured.forEach(({ row: cr, col: cc }) => { newBoard[cr][cc] = null; });
      newBoard[move.row][move.col] = movingPiece;
      newBoard[row][col] = null;
      const nextSequences = getCaptureSequences(newBoard, move.row, move.col, movingPiece);
      nextSequences.forEach(seq => sequences.push([move, ...seq]));
    });
    return sequences;
  }, [getCaptureMoves]);

  const getMaxCaptureMovesForPiece = useCallback((boardState, row, col, piece) => {
    const sequences = getCaptureSequences(boardState, row, col, piece);
    const counts = sequences.map(seq => seq.reduce((sum, m) => sum + (m.captured?.length || 0), 0));
    const maxCaptures = Math.max(0, ...counts);
    if (maxCaptures === 0) return { maxCaptures: 0, moves: [] };
    const movesMap = new Map();
    sequences.forEach((seq, idx) => {
      if (counts[idx] === maxCaptures && seq.length > 0) {
        const move = seq[0];
        const key = `${move.row}-${move.col}-${JSON.stringify(move.captured)}`;
        if (!movesMap.has(key)) movesMap.set(key, move);
      }
    });
    return { maxCaptures, moves: Array.from(movesMap.values()) };
  }, [getCaptureSequences]);

  const getForcedCaptures = useCallback((boardState, color) => {
    let maxCaptures = 0;
    const captures = [];
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const piece = boardState[r][c];
        if (piece && piece.color === color) {
          const result = getMaxCaptureMovesForPiece(boardState, r, c, piece);
          if (result.maxCaptures > 0) {
            if (result.maxCaptures > maxCaptures) {
              maxCaptures = result.maxCaptures;
              captures.length = 0;
              captures.push({ row: r, col: c, moves: result.moves });
            } else if (result.maxCaptures === maxCaptures) {
              captures.push({ row: r, col: c, moves: result.moves });
            }
          }
        }
      }
    }
    return { maxCaptures, captures };
  }, [getMaxCaptureMovesForPiece]);

  const getRegularMoves = useCallback((row, col, boardState, piece) => {
    const moves = [];
    const directions = piece.isKing
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : piece.color === 'white'
        ? [[-1, -1], [-1, 1]]
        : [[1, -1], [1, 1]];

    if (piece.isKing) {
      directions.forEach(([dr, dc]) => {
        for (let i = 1; i < 10; i++) {
          const newRow = row + dr * i;
          const newCol = col + dc * i;
          if (newRow < 0 || newRow >= 10 || newCol < 0 || newCol >= 10) break;
          if (boardState[newRow][newCol]) break;
          moves.push({ row: newRow, col: newCol, isCapture: false });
        }
      });
    } else {
      directions.forEach(([dr, dc]) => {
        const newRow = row + dr;
        const newCol = col + dc;
        if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10) {
          if (!boardState[newRow][newCol]) moves.push({ row: newRow, col: newCol, isCapture: false });
        }
      });
    }
    return moves;
  }, []);

  const getValidMoves = useCallback((row, col, boardState) => {
    const piece = boardState[row][col];
    if (!piece) return [];
    if (mustCapture.length > 0) {
      const forced = mustCapture.find(c => c.row === row && c.col === col);
      return forced ? forced.moves : [];
    }
    const captureMoves = getCaptureMoves(row, col, boardState, piece);
    if (captureMoves.length > 0) return captureMoves;
    return getRegularMoves(row, col, boardState, piece);
  }, [getRegularMoves, getCaptureMoves, mustCapture]);

  const getValidMovesForColor = useCallback((row, col, boardState, color) => {
    const piece = boardState[row][col];
    if (!piece || piece.color !== color) return [];
    const forced = getForcedCaptures(boardState, color);
    if (forced.captures.length > 0) {
      const entry = forced.captures.find(c => c.row === row && c.col === col);
      return entry ? entry.moves : [];
    }
    return getRegularMoves(row, col, boardState, piece);
  }, [getForcedCaptures, getRegularMoves]);

  const checkGameEnd = useCallback((boardState, nextColor) => {
    let hasValidMove = false;
    let hasPieces = false;
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const piece = boardState[r][c];
        if (piece && piece.color === nextColor) {
          hasPieces = true;
          const moves = getValidMovesForColor(r, c, boardState, nextColor);
          if (moves.length > 0) { hasValidMove = true; break; }
        }
      }
      if (hasValidMove) break;
    }
    if (!hasPieces || !hasValidMove) return nextColor === 'white' ? 'blackWins' : 'whiteWins';
    return null;
  }, [getValidMovesForColor]);

  const makeMove = (fromRow, fromCol, toRow, toCol, capturedSquares = []) => {
    const newBoard = board.map(r => r.map(c => c ? { ...c } : null));
    const piece = { ...newBoard[fromRow][fromCol] };

    capturedSquares.forEach(({ row, col }) => { newBoard[row][col] = null; });

    if ((piece.color === 'white' && toRow === 0) || (piece.color === 'black' && toRow === 9)) {
      piece.isKing = true;
    }

    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;

    setBoard(newBoard);
    setSelectedSquare(null);
    setValidMoves([]);

    if (capturedSquares.length > 0) {
      const nextCapture = getMaxCaptureMovesForPiece(newBoard, toRow, toCol, newBoard[toRow][toCol]);
      if (nextCapture.moves.length > 0) {
        setChainCapture({ row: toRow, col: toCol });
        setSelectedSquare({ row: toRow, col: toCol });
        setValidMoves(nextCapture.moves);
        return { board: newBoard, continueChain: true };
      }
    }

    const nextColor = piece.color === 'white' ? 'black' : 'white';
    setCurrentTurn(nextColor);
    setChainCapture(null);

    const forced = getForcedCaptures(newBoard, nextColor);
    setMustCapture(forced.captures);

    const endStatus = checkGameEnd(newBoard, nextColor);
    if (endStatus) setGameStatus(endStatus);

    return { board: newBoard, continueChain: false };
  };

  const handleSquareClick = (row, col) => {
    if (blockBoard || gameStatus !== 'playing' || !canMove) return;
    if (effectiveTurn !== playerColor) return;

    const piece = board[row][col];

    if (chainCapture) {
      if (row === chainCapture.row && col === chainCapture.col) return;
      const move = validMoves.find(m => m.row === row && m.col === col);
      if (move) {
        const result = makeMove(chainCapture.row, chainCapture.col, row, col, move.captured);
        if (!result.continueChain) {
          if (isMultiplayer && onSaveMove) {
            const movingPiece = board[chainCapture.row][chainCapture.col];
            const nextColor = movingPiece.color === 'white' ? 'black' : 'white';
            onSaveMove(result.board, nextColor);
          }
        }
      }
      return;
    }

    if (selectedSquare) {
      const move = validMoves.find(m => m.row === row && m.col === col);
      if (move) {
        const result = makeMove(selectedSquare.row, selectedSquare.col, row, col, move.captured || []);
        if (!result.continueChain) {
          if (isMultiplayer && onSaveMove) {
            const movingPiece = board[selectedSquare.row][selectedSquare.col];
            const nextColor = movingPiece.color === 'white' ? 'black' : 'white';
            onSaveMove(result.board, nextColor);
          }
        }
      } else if (piece && piece.color === playerColor) {
        setSelectedSquare({ row, col });
        setValidMoves(getValidMoves(row, col, board));
      } else {
        setSelectedSquare(null);
        setValidMoves([]);
      }
    } else {
      if (piece && piece.color === playerColor) {
        setSelectedSquare({ row, col });
        setValidMoves(getValidMoves(row, col, board));
      }
    }
  };

  useEffect(() => {
    const forced = getForcedCaptures(board, effectiveTurn);
    setMustCapture(forced.captures);
  }, [board, effectiveTurn, getForcedCaptures]);

  // IA joue quand currentTurn === 'black' (IA) et c'est le tour des noirs
  useEffect(() => {
    if (isMultiplayer || !aiLevel || blockBoard || gameStatus !== 'playing') return;
    if (currentTurn !== 'black') return; // Attendre que ce soit le tour de l'IA (noirs)

    const makeAIMove = () => {
      const aiColor = 'black';
      const possibleMoves = [];

      // Trouver tous les coups possibles pour l'IA
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
          const piece = board[r][c];
          if (piece && piece.color === aiColor) {
            const moves = getValidMovesForColor(r, c, board, aiColor);
            if (moves.length > 0) {
              moves.forEach(move => {
                possibleMoves.push({ fromRow: r, fromCol: c, ...move });
              });
            }
          }
        }
      }

      if (possibleMoves.length === 0) return;

      // Choisir un coup: facile = aléatoire, sinon priorité aux captures
      const captures = possibleMoves.filter(m => m.isCapture);
      const selectedMove = aiLevel === 'easy'
        ? possibleMoves[Math.floor(Math.random() * possibleMoves.length)]
        : captures.length > 0
          ? captures[Math.floor(Math.random() * captures.length)]
          : possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

      makeMove(selectedMove.fromRow, selectedMove.fromCol, selectedMove.row, selectedMove.col, selectedMove.captured || []);
    };

    const timer = setTimeout(makeAIMove, 800);
    return () => clearTimeout(timer);
  }, [currentTurn, board, isMultiplayer, blockBoard, gameStatus, aiLevel, getValidMovesForColor, makeMove]);

  const displayBoard = playerColor === 'black' ? [...board].reverse().map(r => [...r].reverse()) : board;
  const winner = gameStatus === 'whiteWins' ? 'white' : gameStatus === 'blackWins' ? 'black' : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', flex: 1, backgroundColor: '#1a1a1a', margin: 0, padding: '16px', overflow: 'auto' }}>
      <VictoryParticles show={gameStatus !== 'playing'} winner={winner} />
      <GameEndModal
        show={gameStatus !== 'playing'}
        winner={winner}
        playerColor={playerColor}
        onReplay={() => window.location.reload()}
        onHome={() => window.location.href = '/'}
        stats={gameStats}
      />
      <div style={{ width: 'min(90vw, calc(100vh - 200px))', height: 'min(90vw, calc(100vh - 200px))', aspectRatio: '1/1', flexShrink: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gridTemplateRows: 'repeat(10, 1fr)', width: '100%', height: '100%', gap: 0 }}>
          {displayBoard.map((row, rowIndex) => (
            row.map((cell, colIndex) => {
              const actualRow = playerColor === 'black' ? 9 - rowIndex : rowIndex;
              const actualCol = playerColor === 'black' ? 9 - colIndex : colIndex;
              const isDark = (actualRow + actualCol) % 2 === 1;
              const squareNum = getSquareNumber(actualRow, actualCol);
              const isSelected = selectedSquare?.row === actualRow && selectedSquare?.col === actualCol;
              const isValidMove = validMoves.some(m => m.row === actualRow && m.col === actualCol);
              const isCapture = validMoves.find(m => m.row === actualRow && m.col === actualCol)?.isCapture;
              const isMustCapture = mustCapture.some(c => c.row === actualRow && c.col === actualCol);

              const baseStyles = {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                backgroundColor: isDark ? '#5D3A1A' : '#F5E6D3',
                cursor: isDark ? 'pointer' : 'default',
                aspectRatio: '1/1',
                border: 'none'
              };

              if (isSelected) baseStyles.boxShadow = 'inset 0 0 0 4px #facc15, 0 0 25px rgba(250, 204, 21, 0.8)';
              else if (isValidMove && isCapture) baseStyles.boxShadow = 'inset 0 0 0 3px #ef4444';
              else if (isValidMove) baseStyles.boxShadow = 'inset 0 0 0 3px #22c55e';
              else if (isMustCapture) baseStyles.boxShadow = 'inset 0 0 0 3px #fb923c';

              return (
                <div key={`${rowIndex}-${colIndex}`} onClick={() => isDark && handleSquareClick(actualRow, actualCol)} style={baseStyles}>
                  {isDark && squareNum && (
                    <span style={{ position: 'absolute', top: '6px', left: '6px', fontSize: '10px', fontWeight: 'bold', color: 'rgba(212,165,116,0.5)', userSelect: 'none', fontFamily: 'monospace' }}>
                      {squareNum}
                    </span>
                  )}
                  <AnimatePresence mode="wait">
                    {cell && (
                      <motion.div key={`${actualRow}-${actualCol}-${cell.color}-${cell.isKing}`} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        style={{ position: 'relative', width: '85%', height: '85%', borderRadius: '50%', filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.8))' }}>
                        {/* Anneau 4 (intérieur) */}
                        <div style={{
                          position: 'absolute',
                          inset: '18%',
                          borderRadius: '50%',
                          background: cell.color === 'white' ? '#d9d4ca' : '#2a2a2a',
                          border: cell.color === 'white' ? '2px solid #bfb9ad' : '2px solid #1a1a1a',
                          boxShadow: cell.color === 'white'
                            ? 'inset 0 2px 4px rgba(0,0,0,0.3), 0 1px 2px rgba(255,255,255,0.6)'
                            : 'inset 0 2px 4px rgba(0,0,0,0.8), 0 1px 2px rgba(80,80,80,0.4)'
                        }} />
                        {/* Anneau 3 */}
                        <div style={{
                          position: 'absolute',
                          inset: '12%',
                          borderRadius: '50%',
                          background: cell.color === 'white' ? '#e8e2d8' : '#3d3d3d',
                          border: cell.color === 'white' ? '2px solid #d4cebc' : '2px solid #262626',
                          boxShadow: cell.color === 'white'
                            ? 'inset 0 2px 4px rgba(0,0,0,0.25), 0 1px 2px rgba(255,255,255,0.7)'
                            : 'inset 0 2px 4px rgba(0,0,0,0.7), 0 1px 2px rgba(100,100,100,0.3)'
                        }} />
                        {/* Anneau 2 */}
                        <div style={{
                          position: 'absolute',
                          inset: '6%',
                          borderRadius: '50%',
                          background: cell.color === 'white' ? '#f0ebe1' : '#4a4a4a',
                          border: cell.color === 'white' ? '2px solid #dcd6ca' : '2px solid #313131',
                          boxShadow: cell.color === 'white'
                            ? 'inset 0 2px 4px rgba(0,0,0,0.2), 0 1px 2px rgba(255,255,255,0.8)'
                            : 'inset 0 2px 4px rgba(0,0,0,0.6), 0 1px 2px rgba(120,120,120,0.3)'
                        }} />
                        {/* Anneau 1 (base extérieure) */}
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '50%',
                          background: cell.color === 'white' ? '#f8f5f0' : '#2d2d2d',
                          border: cell.color === 'white' ? '2px solid #e8e4da' : '2px solid #1a1a1a',
                          boxShadow: cell.color === 'white'
                            ? 'inset 0 3px 6px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.3), inset 0 -1px 2px rgba(0,0,0,0.1), 0 6px 14px rgba(0,0,0,0.6)'
                            : 'inset 0 3px 6px rgba(0,0,0,0.8), 0 0 1px rgba(0,0,0,0.5), inset 0 -1px 2px rgba(0,0,0,0.4), 0 6px 14px rgba(0,0,0,0.9)'
                        }} />
                        {/* Surbrillance centrale */}
                        <div style={{
                          position: 'absolute',
                          inset: '25%',
                          borderRadius: '50%',
                          background: cell.color === 'white'
                            ? 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.8) 0%, transparent 70%)'
                            : 'radial-gradient(circle at 35% 30%, rgba(100,100,100,0.4) 0%, transparent 70%)',
                          pointerEvents: 'none'
                        }} />
                        {cell.isKing && (
                          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(24px, 50%, 40px)', textShadow: '0 3px 6px rgba(0,0,0,0.9), 0 0 10px rgba(255,215,0,0.7)', filter: 'drop-shadow(0 0 4px rgba(255,215,0,0.9))' }}>
                            👑
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {isValidMove && !cell && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{
                      position: 'absolute',
                      width: '30%',
                      height: '30%',
                      borderRadius: '50%',
                      backgroundColor: '#22c55e',
                      boxShadow: '0 0 15px rgba(34, 197, 94, 0.9)'
                    }} />
                  )}
                </div>
              );
            })
          ))}
        </div>
      </div>
    </div>
  );
}