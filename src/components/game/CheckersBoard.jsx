import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VictoryParticles from '../effects/VictoryParticles';

const createInitialBoard = () => {
  const board = Array(10).fill(null).map(() => Array(10).fill(null));
  
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 10; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = { color: 'black', isKing: false };
      }
    }
  }
  
  for (let row = 6; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = { color: 'white', isKing: false };
      }
    }
  }
  
  return board;
};

const getSquareNumber = (row, col) => {
  if ((row + col) % 2 === 0) return null;
  return Math.floor(row * 5 + col / 2) + 1;
};

const cloneBoard = (board) => board.map(r => r.map(c => c ? { ...c } : null));

export default function CheckersBoard({ playerColor = 'white', aiLevel = 'medium', onGameEnd, isMultiplayer = false, canMove = true, blockBoard = false, initialBoardState = null, onSaveMove = null, currentTurnOverride = null }) {
  const [board, setBoard] = useState(() => initialBoardState ? initialBoardState : createInitialBoard());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [currentTurn, setCurrentTurn] = useState('white');
  const effectiveTurn = isMultiplayer && currentTurnOverride ? currentTurnOverride : currentTurn;
  const [gameStatus, setGameStatus] = useState('playing');
  const [score, setScore] = useState({ white: 0, black: 0 });
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
    if (gameStatus !== 'playing' && onGameEnd) {
      onGameEnd(gameStatus);
    }
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
          const checkRow = row + dr * i;
          const checkCol = col + dc * i;
          
          if (checkRow < 0 || checkRow >= 10 || checkCol < 0 || checkCol >= 10) break;
          
          const checkPiece = boardState[checkRow][checkCol];
          
          if (!checkPiece) {
            if (foundOpponent) {
              moves.push({
                row: checkRow,
                col: checkCol,
                captured: [foundPos],
                isCapture: true
              });
            }
          } else if (checkPiece.color !== piece.color && !foundOpponent) {
            foundOpponent = checkPiece;
            foundPos = { row: checkRow, col: checkCol };
          } else {
            break;
          }
        }
      });
    } else {
      const allDirections = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      allDirections.forEach(([dr, dc]) => {
        const midRow = row + dr;
        const midCol = col + dc;
        const targetRow = row + dr * 2;
        const targetCol = col + dc * 2;

        if (targetRow >= 0 && targetRow < 10 && targetCol >= 0 && targetCol < 10) {
          const midPiece = boardState[midRow]?.[midCol];
          const targetPiece = boardState[targetRow]?.[targetCol];

          if (midPiece && midPiece.color !== piece.color && !targetPiece) {
            moves.push({
              row: targetRow,
              col: targetCol,
              captured: [{ row: midRow, col: midCol }],
              isCapture: true
            });
          }
        }
      });
    }

    return moves;
  }, []);

  const getCaptureSequences = useCallback((boardState, row, col, piece) => {
    const sequences = [];
    const captureMoves = getCaptureMoves(row, col, boardState, piece);

    if (captureMoves.length === 0) {
      return [[]];
    }

    captureMoves.forEach(move => {
      const newBoard = cloneBoard(boardState);
      const movingPiece = { ...newBoard[row][col] };

      move.captured.forEach(({ row: cr, col: cc }) => {
        newBoard[cr][cc] = null;
      });

      newBoard[move.row][move.col] = movingPiece;
      newBoard[row][col] = null;

      const nextSequences = getCaptureSequences(newBoard, move.row, move.col, movingPiece);
      nextSequences.forEach(seq => {
        sequences.push([move, ...seq]);
      });
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
        if (!movesMap.has(key)) {
          movesMap.set(key, move);
        }
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
          if (!boardState[newRow][newCol]) {
            moves.push({ row: newRow, col: newCol, isCapture: false });
          }
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

    return getRegularMoves(row, col, boardState, piece);
  }, [getRegularMoves, mustCapture]);

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
          if (moves.length > 0) {
            hasValidMove = true;
            break;
          }
        }
      }
      if (hasValidMove) break;
    }

    if (!hasPieces || !hasValidMove) {
      return nextColor === 'white' ? 'blackWins' : 'whiteWins';
    }
    return null;
  }, [getValidMovesForColor]);

  const makeMove = (fromRow, fromCol, toRow, toCol, capturedSquares = []) => {
    const newBoard = board.map(r => r.map(c => c ? { ...c } : null));
    const piece = { ...newBoard[fromRow][fromCol] };

    capturedSquares.forEach(({ row, col }) => {
      newBoard[row][col] = null;
    });

    if ((piece.color === 'white' && toRow === 0) || (piece.color === 'black' && toRow === 9)) {
      piece.isKing = true;
    }

    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;

    if (capturedSquares.length > 0) {
      setScore(prev => ({
        ...prev,
        [piece.color]: prev[piece.color] + capturedSquares.length
      }));
    }

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
    if (endStatus) {
      setGameStatus(endStatus);
    }

    return { board: newBoard, continueChain: false };
  };

  const handleSquareClick = (row, col) => {
    if (blockBoard) return;
    if (gameStatus !== 'playing') return;
    if (!canMove) return;
    if (effectiveTurn !== playerColor) return;

    const piece = board[row][col];

    if (chainCapture) {
      if (row === chainCapture.row && col === chainCapture.col) {
        return;
      }
      const move = validMoves.find(m => m.row === row && m.col === col);
      if (move) {
        const result = makeMove(chainCapture.row, chainCapture.col, row, col, move.captured);
        if (!result.continueChain && currentTurn !== playerColor) {
          setTimeout(() => makeAIMove(result.board), 500);
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
            // Sauvegarder le coup pour l'adversaire
            const nextColor = piece.color === 'white' ? 'black' : 'white';
            onSaveMove(result.board, nextColor);
          } else if (gameStatus === 'playing') {
            setTimeout(() => makeAIMove(result.board), 500);
          }
        }
      } else if (piece && piece.color === playerColor) {
        if (mustCapture.length > 0) {
          const canCapture = mustCapture.some(c => c.row === row && c.col === col);
          if (!canCapture) return;
        }
        setSelectedSquare({ row, col });
        setValidMoves(getValidMoves(row, col, board));
      } else {
        setSelectedSquare(null);
        setValidMoves([]);
      }
    } else {
      if (piece && piece.color === playerColor) {
        if (mustCapture.length > 0) {
          const canCapture = mustCapture.some(c => c.row === row && c.col === col);
          if (!canCapture) return;
        }
        setSelectedSquare({ row, col });
        setValidMoves(getValidMoves(row, col, board));
      }
    }
  };

  const makeAIMove = useCallback((currentBoard) => {
    if (gameStatus !== 'playing') return;

    const aiColor = playerColor === 'white' ? 'black' : 'white';
    const allMoves = [];

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const piece = currentBoard[r][c];
        if (piece && piece.color === aiColor) {
          const moves = getValidMoves(r, c, currentBoard);
          moves.forEach(move => {
            allMoves.push({ from: { row: r, col: c }, to: move, piece });
          });
        }
      }
    }

    if (allMoves.length === 0) return;

    let selectedMove;

    if (aiLevel === 'easy') {
      selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
    } else {
      const captureMoves = allMoves.filter(m => m.to.isCapture);
      if (captureMoves.length > 0) {
        captureMoves.sort((a, b) => (b.to.captured?.length || 0) - (a.to.captured?.length || 0));
        selectedMove = aiLevel === 'hard' ? captureMoves[0] : captureMoves[Math.floor(Math.random() * Math.min(3, captureMoves.length))];
      } else {
        const forwardMoves = allMoves.filter(m => 
          aiColor === 'black' ? m.to.row > m.from.row : m.to.row < m.from.row
        );
        selectedMove = forwardMoves.length > 0 
          ? forwardMoves[Math.floor(Math.random() * forwardMoves.length)]
          : allMoves[Math.floor(Math.random() * allMoves.length)];
      }
    }

    const executeAIChainCapture = (currentB, fromRow, fromCol, toRow, toCol, captured) => {
      const newBoard = currentB.map(r => r.map(c => c ? { ...c } : null));
      const piece = { ...newBoard[fromRow][fromCol] };

      captured.forEach(({ row, col }) => {
        newBoard[row][col] = null;
      });

      if ((piece.color === 'white' && toRow === 0) || (piece.color === 'black' && toRow === 9)) {
        piece.isKing = true;
      }

      newBoard[toRow][toCol] = piece;
      newBoard[fromRow][fromCol] = null;

      setBoard(newBoard);
      setScore(prev => ({
        ...prev,
        [piece.color]: prev[piece.color] + captured.length
      }));

      const nextCapture = getMaxCaptureMovesForPiece(newBoard, toRow, toCol, newBoard[toRow][toCol]);
      if (nextCapture.moves.length > 0) {
        setTimeout(() => {
          const nextMove = nextCapture.moves[0];
          executeAIChainCapture(newBoard, toRow, toCol, nextMove.row, nextMove.col, nextMove.captured);
        }, 300);
      } else {
        setCurrentTurn('white');
        const forced = getForcedCaptures(newBoard, 'white');
        setMustCapture(forced.captures);
        
        const endStatus = checkGameEnd(newBoard, 'white');
        if (endStatus) {
          setGameStatus(endStatus);
        }
      }
    };

    if (selectedMove.to.isCapture) {
      executeAIChainCapture(currentBoard, selectedMove.from.row, selectedMove.from.col, selectedMove.to.row, selectedMove.to.col, selectedMove.to.captured);
    } else if (!isMultiplayer) {
      const newBoard = currentBoard.map(r => r.map(c => c ? { ...c } : null));
      const piece = { ...newBoard[selectedMove.from.row][selectedMove.from.col] };

      if ((piece.color === 'white' && selectedMove.to.row === 0) || (piece.color === 'black' && selectedMove.to.row === 9)) {
        piece.isKing = true;
      }

      newBoard[selectedMove.to.row][selectedMove.to.col] = piece;
      newBoard[selectedMove.from.row][selectedMove.from.col] = null;

      setBoard(newBoard);
      setCurrentTurn('white');

      const forced = getForcedCaptures(newBoard, 'white');
      setMustCapture(forced.captures);

      const endStatus = checkGameEnd(newBoard, 'white');
      if (endStatus) {
        setGameStatus(endStatus);
      }
    }
  }, [gameStatus, playerColor, aiLevel, getValidMoves, getCaptureMoves, getForcedCaptures, checkGameEnd]);

  useEffect(() => {
    if (!isMultiplayer && currentTurn !== playerColor && gameStatus === 'playing' && !chainCapture) {
      const timer = setTimeout(() => makeAIMove(board), 500);
      return () => clearTimeout(timer);
    }
  }, [isMultiplayer, currentTurn, playerColor, gameStatus, board, chainCapture, makeAIMove]);

  const resetGame = () => {
    setBoard(createInitialBoard());
    setSelectedSquare(null);
    setValidMoves([]);
    setCurrentTurn('white');
    setGameStatus('playing');
    setScore({ white: 0, black: 0 });
    const forced = getForcedCaptures(createInitialBoard(), 'white');
    setMustCapture(forced.captures);
    setChainCapture(null);
  };

  useEffect(() => {
    const forced = getForcedCaptures(board, currentTurn);
    setMustCapture(forced.captures);
  }, [board, currentTurn, getForcedCaptures]);

  const displayBoard = playerColor === 'black' ? [...board].reverse().map(r => [...r].reverse()) : board;

  return (
    <div style={{ 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      flex: 1,
      backgroundColor: '#1a1a1a',
      margin: 0,
      padding: '16px',
      overflow: 'auto'
    }}>
      <VictoryParticles 
        show={gameStatus !== 'playing'} 
        winner={gameStatus === 'whiteWins' ? 'white' : 'black'}
      />
      
      {/* Score (top-left corner) */}
      <div style={{ position: 'fixed', top: '12px', left: '12px', display: 'flex', gap: '8px', zIndex: 10 }}>
        <div style={{ display: 'flex', gap: '4px', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#333' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#222', border: '1px solid #555' }}></div>
          <span style={{ fontSize: '11px', color: '#fff' }}>{score.black}</span>
        </div>
        <span style={{ color: '#666', fontSize: '11px' }}>-</span>
        <div style={{ display: 'flex', gap: '4px', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#333' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fff', border: '1px solid #ccc' }}></div>
          <span style={{ fontSize: '11px', color: '#fff' }}>{score.white}</span>
        </div>
      </div>

      {/* Game status (bottom-center) */}
      <div style={{ 
        position: 'fixed', 
        bottom: '12px', 
        left: '50%', 
        transform: 'translateX(-50%)',
        padding: '8px 16px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: '500',
        backgroundColor: effectiveTurn === playerColor ? 'rgba(217, 119, 6, 0.2)' : 'rgba(255,255,255,0.05)',
        border: effectiveTurn === playerColor ? '1px solid #d97706' : 'none',
        color: '#fff',
        zIndex: 10
      }}>
        {gameStatus === 'playing' 
          ? (effectiveTurn === playerColor 
              ? `Votre tour (${playerColor === 'white' ? 'Blancs' : 'Noirs'})`
              : (isMultiplayer ? 'Tour de l\'adversaire' : 'Tour de l\'IA'))
          : gameStatus === 'whiteWins' 
            ? '⚪ Blancs gagnent !'
            : '⚫ Noirs gagnent !'
        }
      </div>

      {/* Board without frame */}
      <div style={{ 
        width: 'min(90vw, calc(100vh - 200px))',
        height: 'min(90vw, calc(100vh - 200px))',
        aspectRatio: '1/1',
        flexShrink: 0
      }}>
        {/* Game board grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(10, 1fr)',
            gridTemplateRows: 'repeat(10, 1fr)',
            width: '100%', 
            height: '100%', 
            overflow: 'hidden',
            gap: 0,
            border: 'none'
          }}>
               {displayBoard.map((row, rowIndex) => (
                 row.map((cell, colIndex) => {
                   const actualRow = playerColor === 'black' ? 9 - rowIndex : rowIndex;
                   const actualCol = playerColor === 'black' ? 9 - colIndex : colIndex;
                   const piece = displayBoard[actualRow]?.[actualCol];
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

                   if (isSelected) {
                     baseStyles.boxShadow = 'inset 0 0 0 4px #facc15, 0 0 25px rgba(250, 204, 21, 0.8)';
                   } else if (isValidMove && isCapture) {
                     baseStyles.boxShadow = 'inset 0 0 0 3px #ef4444';
                   } else if (isValidMove && !isCapture) {
                     baseStyles.boxShadow = 'inset 0 0 0 3px #22c55e';
                   } else if (isMustCapture) {
                     baseStyles.boxShadow = 'inset 0 0 0 3px #fb923c';
                   }

                   return (
                     <motion.div
                       key={`${rowIndex}-${colIndex}`}
                       onClick={() => isDark && handleSquareClick(actualRow, actualCol)}
                       whileHover={isDark ? { backgroundColor: isDark ? '#6d4a2a' : '#F5E6D3' } : {}}
                       whileTap={isDark ? { scale: 0.98 } : {}}
                       style={baseStyles}
                     >
                      {isDark && squareNum && (
                         <span style={{ position: 'absolute', top: '6px', left: '6px', fontSize: '10px', fontWeight: 'bold', color: 'rgba(212, 165, 116, 0.5)', userSelect: 'none', fontFamily: 'monospace' }}>
                           {squareNum}
                         </span>
                       )}
                      
                      <AnimatePresence mode="wait">
                        {piece && (
                          <motion.div 
                            key={`${actualRow}-${actualCol}-${piece.color}-${piece.isKing}`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            style={{ 
                              position: 'relative',
                              width: '85%',
                              height: '85%',
                              borderRadius: '50%',
                              filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.6))'
                            }}
                          >
                          {/* Main pion with 3D effect */}
                          <div 
                            style={{
                              position: 'absolute',
                              inset: 0,
                              borderRadius: '50%',
                              background: piece.color === 'white' 
                                ? 'radial-gradient(circle at 30% 30%, #ffffff 0%, #e8e6e0 20%, #d0cdc5 100%)' 
                                : 'radial-gradient(circle at 35% 35%, #4a4a4a 0%, #2a2a2a 30%, #0a0a0a 100%)',
                              boxShadow: piece.color === 'white'
                                ? '0 4px 10px rgba(0,0,0,0.4), inset -1px -1px 2px rgba(0,0,0,0.2), inset 1px 1px 3px rgba(255,255,255,0.7)' 
                                : '0 4px 10px rgba(0,0,0,0.7), inset -1px -1px 2px rgba(0,0,0,0.6), inset 1px 1px 2px rgba(100,100,100,0.3)'
                            }}
                          >
                            {/* Concentric ring 1 */}
                            <div 
                              style={{
                                position: 'absolute',
                                inset: '10%',
                                borderRadius: '50%',
                                border: piece.color === 'white' ? '1px solid rgba(100, 100, 100, 0.3)' : '1px solid rgba(80, 80, 80, 0.4)',
                                background: piece.color === 'white'
                                  ? 'radial-gradient(circle, #f5f3f0 0%, #e0ddd5 100%)'
                                  : 'radial-gradient(circle, #383838 0%, #1f1f1f 100%)',
                                boxShadow: piece.color === 'white'
                                  ? 'inset 0 1px 2px rgba(0,0,0,0.1)'
                                  : 'inset 0 1px 1px rgba(120,120,120,0.3)'
                              }}
                            />

                            {/* Concentric ring 2 */}
                            <div 
                              style={{
                                position: 'absolute',
                                inset: '22%',
                                borderRadius: '50%',
                                border: piece.color === 'white' ? '1px solid rgba(80, 80, 80, 0.4)' : '1px solid rgba(60, 60, 60, 0.5)',
                                background: piece.color === 'white'
                                  ? 'radial-gradient(circle, #ece9e4 0%, #ddd9d0 100%)'
                                  : 'radial-gradient(circle, #2d2d2d 0%, #161616 100%)',
                                boxShadow: piece.color === 'white'
                                  ? 'inset 0 1px 2px rgba(0,0,0,0.15)'
                                  : 'inset 0 1px 1px rgba(100,100,100,0.2)'
                              }}
                            />

                            {/* Center point */}
                            <div 
                              style={{
                                position: 'absolute',
                                inset: '45%',
                                borderRadius: '50%',
                                background: piece.color === 'white'
                                  ? 'radial-gradient(circle, #c9c5bb 0%, #b0ada5 100%)'
                                  : 'radial-gradient(circle, #222222 0%, #0a0a0a 100%)',
                                boxShadow: piece.color === 'white'
                                  ? 'inset 0 1px 3px rgba(0,0,0,0.4)'
                                  : 'inset 0 1px 2px rgba(80,80,80,0.4)'
                              }}
                            />

                            {/* Glossy highlight */}
                            <div 
                              style={{
                                position: 'absolute',
                                top: '12%',
                                left: '20%',
                                width: '40%',
                                height: '25%',
                                borderRadius: '50%',
                                background: piece.color === 'white'
                                  ? 'radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.5) 50%, transparent 70%)'
                                  : 'radial-gradient(ellipse at center, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                                filter: 'blur(0.5px)',
                                pointerEvents: 'none'
                              }}
                            />

                            {/* Secondary shine */}
                            <div 
                              style={{
                                position: 'absolute',
                                bottom: '15%',
                                right: '15%',
                                width: '18%',
                                height: '18%',
                                borderRadius: '50%',
                                background: piece.color === 'white'
                                  ? 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)'
                                  : 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                                filter: 'blur(1px)',
                                pointerEvents: 'none'
                              }}
                            />

                            {cell.isKing && (
                              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                <span 
                                  style={{
                                    fontSize: '70%',
                                    fontWeight: 'bold',
                                    color: cell.color === 'white' ? '#c97a00' : '#fbbf24',
                                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))',
                                    textShadow: cell.color === 'white'
                                      ? '0 0.5px 1px rgba(255,255,255,0.6)'
                                      : '0 0.5px 1px rgba(0,0,0,0.9)',
                                    lineHeight: 1
                                  }}
                                >
                                  ♔
                                </span>
                              </div>
                            )}
                          </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      {isValidMove && !cell && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          style={{ 
                            position: 'absolute', 
                            width: '30%', 
                            height: '30%', 
                            borderRadius: '50%',
                            backgroundColor: '#22c55e',
                            boxShadow: '0 0 15px rgba(34, 197, 94, 0.9)'
                          }}
                        />
                      )}
                    </motion.div>
                  );
                })
              ))}
              </div>
              </div>
              </div>
              );
            }