import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VictoryParticles from '../effects/VictoryParticles';
import GameEndModal from './GameEndModal';
import useMovePieceSound from '../hooks/useMovePieceSound';

// ── Board initialisation ────────────────────────────────────────────────────
const createInitialBoard = () => {
  const board = Array(10).fill(null).map(() => Array(10).fill(null));
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 10; col++)
      if ((row + col) % 2 === 1) board[row][col] = { color: 'black', isKing: false };
  for (let row = 6; row < 10; row++)
    for (let col = 0; col < 10; col++)
      if ((row + col) % 2 === 1) board[row][col] = { color: 'white', isKing: false };
  return board;
};

// International draughts square numbering: 1-50, top-left dark = 1
const getSquareNumber = (row, col) => {
  if ((row + col) % 2 === 0) return null;
  return row * 5 + Math.floor(col / 2) + 1;
};

const cloneBoard = (board) => board.map(r => r.map(c => c ? { ...c } : null));

// ── Piece component ─────────────────────────────────────────────────────────
function CheckerPiece({ color, isKing, size }) {
  const isWhite = color === 'white';
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {/* Shadow under piece */}
      <div style={{
        position: 'absolute',
        bottom: '-4px',
        left: '6%',
        right: '6%',
        height: '55%',
        borderRadius: '50%',
        background: 'rgba(0,0,0,0.45)',
        filter: 'blur(4px)',
        zIndex: 0
      }} />
      {/* Base disc */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        background: isWhite
          ? 'radial-gradient(ellipse at 38% 30%, #ffffff 0%, #e8e0d0 40%, #c8bfaa 70%, #b0a890 100%)'
          : 'radial-gradient(ellipse at 38% 30%, #5a5a5a 0%, #2e2e2e 40%, #1a1a1a 70%, #0d0d0d 100%)',
        boxShadow: isWhite
          ? '0 4px 8px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(0,0,0,0.2)'
          : '0 4px 8px rgba(0,0,0,0.7), inset 0 1px 2px rgba(120,120,120,0.3), inset 0 -2px 4px rgba(0,0,0,0.6)',
        border: isWhite ? '1.5px solid #a09880' : '1.5px solid #0a0a0a',
        zIndex: 1
      }}>
        {/* Inner ring 1 */}
        <div style={{
          position: 'absolute',
          inset: '10%',
          borderRadius: '50%',
          border: isWhite ? '1.5px solid rgba(160,152,128,0.7)' : '1.5px solid rgba(80,80,80,0.6)',
          pointerEvents: 'none'
        }} />
        {/* Inner ring 2 */}
        <div style={{
          position: 'absolute',
          inset: '20%',
          borderRadius: '50%',
          border: isWhite ? '1.5px solid rgba(160,152,128,0.5)' : '1.5px solid rgba(80,80,80,0.4)',
          pointerEvents: 'none'
        }} />
        {/* Highlight */}
        <div style={{
          position: 'absolute',
          top: '12%',
          left: '15%',
          width: '38%',
          height: '24%',
          borderRadius: '50%',
          background: isWhite
            ? 'rgba(255,255,255,0.75)'
            : 'rgba(160,160,160,0.25)',
          filter: 'blur(2px)',
          transform: 'rotate(-20deg)',
          pointerEvents: 'none'
        }} />
        {/* King crown */}
        {isKing && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '42%',
            lineHeight: 1,
            filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))',
            zIndex: 2
          }}>
            👑
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
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
  const { playMoveSound } = useMovePieceSound();
  const [board, setBoard] = useState(() => initialBoardState || createInitialBoard());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [currentTurn, setCurrentTurn] = useState('white');
  const effectiveTurn = isMultiplayer && currentTurnOverride ? currentTurnOverride : currentTurn;
  const [gameStatus, setGameStatus] = useState('playing');
  const [mustCapture, setMustCapture] = useState([]);
  const [chainCapture, setChainCapture] = useState(null);
  const [draggedPiece, setDraggedPiece] = useState(null);
  const boardRef = useRef(null);

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

  // ── International rules: flying king captures ──────────────────────────
  const getCaptureMoves = useCallback((row, col, boardState, piece) => {
    const moves = [];
    const allDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    const dirs = piece.isKing
      ? allDirs
      : piece.color === 'white' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];

    if (piece.isKing) {
      allDirs.forEach(([dr, dc]) => {
        let foundOpponent = null;
        let foundPos = null;
        for (let i = 1; i < 10; i++) {
          const r = row + dr * i, c = col + dc * i;
          if (r < 0 || r >= 10 || c < 0 || c >= 10) break;
          const p = boardState[r][c];
          if (!p) {
            if (foundOpponent) moves.push({ row: r, col: c, captured: [foundPos], isCapture: true });
          } else if (p.color !== piece.color && !foundOpponent) {
            foundOpponent = p; foundPos = { row: r, col: c };
          } else break;
        }
      });
    } else {
      // Regular pieces can capture in all 4 dirs (international rules)
      allDirs.forEach(([dr, dc]) => {
        const midRow = row + dr, midCol = col + dc;
        const tRow = row + dr * 2, tCol = col + dc * 2;
        if (tRow >= 0 && tRow < 10 && tCol >= 0 && tCol < 10) {
          const mid = boardState[midRow]?.[midCol];
          if (mid && mid.color !== piece.color && !boardState[tRow][tCol])
            moves.push({ row: tRow, col: tCol, captured: [{ row: midRow, col: midCol }], isCapture: true });
        }
      });
    }
    return moves;
  }, []);

  const getCaptureSequences = useCallback((boardState, row, col, piece) => {
    const sequences = [];
    const caps = getCaptureMoves(row, col, boardState, piece);
    if (caps.length === 0) return [[]];
    caps.forEach(move => {
      const nb = cloneBoard(boardState);
      const mp = { ...nb[row][col] };
      move.captured.forEach(({ row: cr, col: cc }) => { nb[cr][cc] = null; });
      nb[move.row][move.col] = mp;
      nb[row][col] = null;
      const nexts = getCaptureSequences(nb, move.row, move.col, mp);
      nexts.forEach(seq => sequences.push([move, ...seq]));
    });
    return sequences;
  }, [getCaptureMoves]);

  const getMaxCaptureMovesForPiece = useCallback((boardState, row, col, piece) => {
    const seqs = getCaptureSequences(boardState, row, col, piece);
    const counts = seqs.map(s => s.reduce((sum, m) => sum + (m.captured?.length || 0), 0));
    const max = Math.max(0, ...counts);
    if (max === 0) return { maxCaptures: 0, moves: [] };
    const map = new Map();
    seqs.forEach((seq, i) => {
      if (counts[i] === max && seq.length > 0) {
        const m = seq[0];
        const key = `${m.row}-${m.col}-${JSON.stringify(m.captured)}`;
        if (!map.has(key)) map.set(key, m);
      }
    });
    return { maxCaptures: max, moves: Array.from(map.values()) };
  }, [getCaptureSequences]);

  const getForcedCaptures = useCallback((boardState, color) => {
    let maxCaps = 0;
    const captures = [];
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const piece = boardState[r][c];
        if (piece && piece.color === color) {
          const res = getMaxCaptureMovesForPiece(boardState, r, c, piece);
          if (res.maxCaptures > 0) {
            if (res.maxCaptures > maxCaps) { maxCaps = res.maxCaptures; captures.length = 0; captures.push({ row: r, col: c, moves: res.moves }); }
            else if (res.maxCaptures === maxCaps) captures.push({ row: r, col: c, moves: res.moves });
          }
        }
      }
    }
    return { maxCaptures: maxCaps, captures };
  }, [getMaxCaptureMovesForPiece]);

  const getRegularMoves = useCallback((row, col, boardState, piece) => {
    const moves = [];
    const dirs = piece.isKing
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : piece.color === 'white' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
    if (piece.isKing) {
      dirs.forEach(([dr, dc]) => {
        for (let i = 1; i < 10; i++) {
          const nr = row + dr * i, nc = col + dc * i;
          if (nr < 0 || nr >= 10 || nc < 0 || nc >= 10) break;
          if (boardState[nr][nc]) break;
          moves.push({ row: nr, col: nc, isCapture: false });
        }
      });
    } else {
      dirs.forEach(([dr, dc]) => {
        const nr = row + dr, nc = col + dc;
        if (nr >= 0 && nr < 10 && nc >= 0 && nc < 10 && !boardState[nr][nc])
          moves.push({ row: nr, col: nc, isCapture: false });
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
    const caps = getCaptureMoves(row, col, boardState, piece);
    if (caps.length > 0) return caps;
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
    let hasPieces = false, hasMove = false;
    for (let r = 0; r < 10 && !hasMove; r++) {
      for (let c = 0; c < 10; c++) {
        const p = boardState[r][c];
        if (p && p.color === nextColor) {
          hasPieces = true;
          if (getValidMovesForColor(r, c, boardState, nextColor).length > 0) { hasMove = true; break; }
        }
      }
    }
    if (!hasPieces || !hasMove) return nextColor === 'white' ? 'blackWins' : 'whiteWins';
    return null;
  }, [getValidMovesForColor]);

  const makeMove = (fromRow, fromCol, toRow, toCol, capturedSquares = []) => {
    playMoveSound();
    const nb = board.map(r => r.map(c => c ? { ...c } : null));
    const piece = { ...nb[fromRow][fromCol] };
    capturedSquares.forEach(({ row, col }) => { nb[row][col] = null; });
    // Promotion: pieces captured during a move are removed AFTER promotion check (international rule)
    if ((piece.color === 'white' && toRow === 0) || (piece.color === 'black' && toRow === 9))
      piece.isKing = true;
    nb[toRow][toCol] = piece;
    nb[fromRow][fromCol] = null;
    setBoard(nb);
    setSelectedSquare(null);
    setValidMoves([]);

    if (capturedSquares.length > 0) {
      const next = getMaxCaptureMovesForPiece(nb, toRow, toCol, nb[toRow][toCol]);
      if (next.moves.length > 0) {
        setChainCapture({ row: toRow, col: toCol });
        setSelectedSquare({ row: toRow, col: toCol });
        setValidMoves(next.moves);
        return { board: nb, continueChain: true };
      }
    }

    const nextColor = piece.color === 'white' ? 'black' : 'white';
    setCurrentTurn(nextColor);
    setChainCapture(null);
    const forced = getForcedCaptures(nb, nextColor);
    setMustCapture(forced.captures);
    const endStatus = checkGameEnd(nb, nextColor);
    if (endStatus) setGameStatus(endStatus);
    return { board: nb, continueChain: false };
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
        if (!result.continueChain && isMultiplayer && onSaveMove) {
          const mp = board[chainCapture.row][chainCapture.col];
          onSaveMove(result.board, mp.color === 'white' ? 'black' : 'white');
        }
      }
      return;
    }

    if (selectedSquare) {
      const move = validMoves.find(m => m.row === row && m.col === col);
      if (move) {
        const result = makeMove(selectedSquare.row, selectedSquare.col, row, col, move.captured || []);
        if (!result.continueChain && isMultiplayer && onSaveMove) {
          const mp = board[selectedSquare.row][selectedSquare.col];
          onSaveMove(result.board, mp.color === 'white' ? 'black' : 'white');
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

  // AI
  useEffect(() => {
    if (isMultiplayer || !aiLevel || blockBoard || gameStatus !== 'playing') return;
    if (currentTurn !== 'black') return;
    const makeAIMove = () => {
      const possibleMoves = [];
      for (let r = 0; r < 10; r++)
        for (let c = 0; c < 10; c++) {
          const piece = board[r][c];
          if (piece && piece.color === 'black') {
            getValidMovesForColor(r, c, board, 'black').forEach(m => possibleMoves.push({ fromRow: r, fromCol: c, ...m }));
          }
        }
      if (!possibleMoves.length) return;
      const caps = possibleMoves.filter(m => m.isCapture);
      const sel = aiLevel === 'easy' ? possibleMoves[Math.floor(Math.random() * possibleMoves.length)]
        : caps.length ? caps[Math.floor(Math.random() * caps.length)]
          : possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      makeMove(sel.fromRow, sel.fromCol, sel.row, sel.col, sel.captured || []);
    };
    const t = setTimeout(makeAIMove, 800);
    return () => clearTimeout(t);
  }, [currentTurn, board, isMultiplayer, blockBoard, gameStatus, aiLevel, getValidMovesForColor]);

  // ── Render ──────────────────────────────────────────────────────────────
  const displayBoard = playerColor === 'black' ? [...board].reverse().map(r => [...r].reverse()) : board;
  const winner = gameStatus === 'whiteWins' ? 'white' : gameStatus === 'blackWins' ? 'black' : null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      flex: 1,
      backgroundColor: '#1a1a1a',
      padding: '8px',
    }}>
      <VictoryParticles show={gameStatus !== 'playing'} winner={winner} />
      <GameEndModal
        show={gameStatus !== 'playing'}
        winner={winner}
        playerColor={playerColor}
        onReplay={() => window.location.reload()}
        onHome={() => window.location.href = '/'}
        stats={gameStats}
      />

      {/* Board wrapper — square, responsive */}
      <div 
        ref={boardRef}
        style={{
          width: 'min(96vw, 96vh, 520px)',
          aspectRatio: '1 / 1',
          border: '6px solid #5a3a1c',
          borderRadius: '4px',
          boxShadow: '0 0 0 3px #3a2510, 0 8px 32px rgba(0,0,0,0.8)',
          overflow: 'hidden',
          flexShrink: 0,
          position: 'relative',
          touchAction: 'none'
        }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(10, 1fr)',
          gridTemplateRows: 'repeat(10, 1fr)',
          width: '100%',
          height: '100%',
        }}>
          {displayBoard.map((row, rowIdx) =>
            row.map((cell, colIdx) => {
              const actualRow = playerColor === 'black' ? 9 - rowIdx : rowIdx;
              const actualCol = playerColor === 'black' ? 9 - colIdx : colIdx;
              const isDark = (actualRow + actualCol) % 2 === 1;
              const squareNum = getSquareNumber(actualRow, actualCol);
              const isSelected = selectedSquare?.row === actualRow && selectedSquare?.col === actualCol;
              const isValidMove = validMoves.some(m => m.row === actualRow && m.col === actualCol);
              const isCapture = validMoves.find(m => m.row === actualRow && m.col === actualCol)?.isCapture;
              const isMustCapture = mustCapture.some(c => c.row === actualRow && c.col === actualCol);

              // Lidraughts-style colors
              const lightColor = '#f0d9b5';  // beige clair
              const darkColor  = '#b58863';  // marron

              let bg = isDark ? darkColor : lightColor;
              let overlay = null;

              if (isDark) {
                if (isSelected) bg = '#f6f669';          // jaune sélection
                else if (isValidMove && isCapture) bg = '#cc3333';   // rouge capture
                else if (isValidMove) bg = '#99cc44';                // vert mouvement
                else if (isMustCapture) bg = '#e06030';              // orange forcé
              }

              return (
                <div
                   key={`${rowIdx}-${colIdx}`}
                   onClick={() => isDark && handleSquareClick(actualRow, actualCol)}
                   onDragOver={(e) => {
                     if (!isDark || blockBoard || gameStatus !== 'playing' || !canMove) return;
                     e.preventDefault();
                     e.dataTransfer.dropEffect = 'move';
                   }}
                   onDrop={(e) => {
                     if (!isDark || blockBoard || gameStatus !== 'playing' || !canMove) return;
                     e.preventDefault();
                     const [fromRow, fromCol] = e.dataTransfer.getData('text/plain').split(',').map(Number);
                     const piece = board[fromRow][fromCol];
                     if (piece && piece.color === playerColor) {
                       const move = validMoves.find(m => m.row === actualRow && m.col === actualCol);
                       if (move) {
                         const result = makeMove(fromRow, fromCol, actualRow, actualCol, move.captured || []);
                         if (!result.continueChain && isMultiplayer && onSaveMove) {
                           const mp = board[fromRow][fromCol];
                           onSaveMove(result.board, mp.color === 'white' ? 'black' : 'white');
                         }
                       }
                     }
                     setDraggedPiece(null);
                   }}
                   style={{
                     position: 'relative',
                     backgroundColor: bg,
                     cursor: isDark ? (blockBoard || gameStatus !== 'playing' || !canMove ? 'default' : 'pointer') : 'default',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     transition: 'background-color 0.1s',
                     userSelect: 'none',
                   }}
                 >
                  {/* Square number (international draughts) */}
                  {isDark && squareNum && (
                    <span style={{
                      position: 'absolute',
                      top: '2px',
                      right: '3px',
                      fontSize: 'clamp(6px, 1.1vw, 10px)',
                      fontWeight: '700',
                      color: isSelected || isValidMove || isMustCapture
                        ? 'rgba(0,0,0,0.4)'
                        : 'rgba(255,255,255,0.45)',
                      fontFamily: 'monospace',
                      lineHeight: 1,
                      pointerEvents: 'none',
                    }}>
                      {squareNum}
                    </span>
                  )}

                  {/* Piece with Drag */}
                   <AnimatePresence mode="wait">
                     {cell && (
                       <motion.div
                         key={`${actualRow}-${actualCol}-${cell.color}-${cell.isKing}`}
                         initial={{ scale: 0.5, opacity: 0 }}
                         animate={{ 
                           scale: draggedPiece?.row === actualRow && draggedPiece?.col === actualCol ? 1.1 : 1, 
                           opacity: 1,
                           zIndex: draggedPiece?.row === actualRow && draggedPiece?.col === actualCol ? 50 : 1
                         }}
                         exit={{ scale: 0.5, opacity: 0 }}
                         transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                         draggable={!blockBoard && gameStatus === 'playing' && canMove && effectiveTurn === playerColor && cell.color === playerColor}
                         onDragStart={(e) => {
                           if (blockBoard || gameStatus !== 'playing' || !canMove || effectiveTurn !== playerColor || cell.color !== playerColor) {
                             e.preventDefault();
                             return;
                           }
                           setDraggedPiece({ row: actualRow, col: actualCol, startX: e.clientX, startY: e.clientY });
                           e.dataTransfer.effectAllowed = 'move';
                           e.dataTransfer.setData('text/plain', `${actualRow},${actualCol}`);
                         }}
                         onDragEnd={() => setDraggedPiece(null)}
                         style={{ 
                           width: '82%', 
                           height: '82%', 
                           zIndex: 1,
                           cursor: !blockBoard && gameStatus === 'playing' && canMove && effectiveTurn === playerColor && cell.color === playerColor ? 'grab' : 'default'
                         }}
                       >
                         <CheckerPiece color={cell.color} isKing={cell.isKing} size="100%" />
                       </motion.div>
                     )}
                   </AnimatePresence>

                  {/* Valid move dot */}
                  {isValidMove && !cell && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{
                        width: '28%',
                        height: '28%',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0,0,0,0.25)',
                        zIndex: 1,
                      }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}