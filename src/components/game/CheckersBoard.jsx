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

export default function CheckersBoard({ playerColor = 'white', aiLevel = 'medium', onGameEnd }) {
  const [board, setBoard] = useState(createInitialBoard);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [currentTurn, setCurrentTurn] = useState('white');
  const [gameStatus, setGameStatus] = useState('playing');
  const [score, setScore] = useState({ white: 0, black: 0 });
  const [mustCapture, setMustCapture] = useState([]);
  const [chainCapture, setChainCapture] = useState(null);

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

  const getAllCaptureMoves = useCallback((boardState, color) => {
    const captures = [];
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const piece = boardState[r][c];
        if (piece && piece.color === color) {
          const pieceMoves = getCaptureMoves(r, c, boardState, piece);
          if (pieceMoves.length > 0) {
            captures.push({ row: r, col: c, moves: pieceMoves });
          }
        }
      }
    }
    return captures;
  }, [getCaptureMoves]);

  const getValidMoves = useCallback((row, col, boardState) => {
    const piece = boardState[row][col];
    if (!piece) return [];

    const captureMoves = getCaptureMoves(row, col, boardState, piece);
    if (captureMoves.length > 0) return captureMoves;

    const allCaptures = getAllCaptureMoves(boardState, piece.color);
    if (allCaptures.length > 0) return [];

    return getRegularMoves(row, col, boardState, piece);
  }, [getCaptureMoves, getRegularMoves, getAllCaptureMoves]);

  const checkGameEnd = useCallback((boardState, nextColor) => {
    let hasValidMove = false;
    let hasPieces = false;

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const piece = boardState[r][c];
        if (piece && piece.color === nextColor) {
          hasPieces = true;
          const moves = getValidMoves(r, c, boardState);
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
  }, [getValidMoves]);

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
      const moreCapturesMoves = getCaptureMoves(toRow, toCol, newBoard, newBoard[toRow][toCol]);
      if (moreCapturesMoves.length > 0) {
        setChainCapture({ row: toRow, col: toCol });
        setSelectedSquare({ row: toRow, col: toCol });
        setValidMoves(moreCapturesMoves);
        return { board: newBoard, continueChain: true };
      }
    }

    const nextColor = piece.color === 'white' ? 'black' : 'white';
    setCurrentTurn(nextColor);
    setChainCapture(null);

    const allCaptures = getAllCaptureMoves(newBoard, nextColor);
    setMustCapture(allCaptures);

    const endStatus = checkGameEnd(newBoard, nextColor);
    if (endStatus) {
      setGameStatus(endStatus);
    }

    return { board: newBoard, continueChain: false };
  };

  const handleSquareClick = (row, col) => {
    if (gameStatus !== 'playing') return;
    if (currentTurn !== playerColor) return;

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
        if (!result.continueChain && gameStatus === 'playing') {
          setTimeout(() => makeAIMove(result.board), 500);
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

      const moreCapturesMoves = getCaptureMoves(toRow, toCol, newBoard, newBoard[toRow][toCol]);
      if (moreCapturesMoves.length > 0) {
        setTimeout(() => {
          const nextCapture = moreCapturesMoves[0];
          executeAIChainCapture(newBoard, toRow, toCol, nextCapture.row, nextCapture.col, nextCapture.captured);
        }, 300);
      } else {
        setCurrentTurn('white');
        const allCaptures = getAllCaptureMoves(newBoard, 'white');
        setMustCapture(allCaptures);
        
        const endStatus = checkGameEnd(newBoard, 'white');
        if (endStatus) {
          setGameStatus(endStatus);
        }
      }
    };

    if (selectedMove.to.isCapture) {
      executeAIChainCapture(currentBoard, selectedMove.from.row, selectedMove.from.col, selectedMove.to.row, selectedMove.to.col, selectedMove.to.captured);
    } else {
      const newBoard = currentBoard.map(r => r.map(c => c ? { ...c } : null));
      const piece = { ...newBoard[selectedMove.from.row][selectedMove.from.col] };

      if ((piece.color === 'white' && selectedMove.to.row === 0) || (piece.color === 'black' && selectedMove.to.row === 9)) {
        piece.isKing = true;
      }

      newBoard[selectedMove.to.row][selectedMove.to.col] = piece;
      newBoard[selectedMove.from.row][selectedMove.from.col] = null;

      setBoard(newBoard);
      setCurrentTurn('white');

      const allCaptures = getAllCaptureMoves(newBoard, 'white');
      setMustCapture(allCaptures);

      const endStatus = checkGameEnd(newBoard, 'white');
      if (endStatus) {
        setGameStatus(endStatus);
      }
    }
  }, [gameStatus, playerColor, aiLevel, getValidMoves, getCaptureMoves, getAllCaptureMoves, checkGameEnd]);

  useEffect(() => {
    if (currentTurn !== playerColor && gameStatus === 'playing' && !chainCapture) {
      const timer = setTimeout(() => makeAIMove(board), 500);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, playerColor, gameStatus, board, chainCapture, makeAIMove]);

  const resetGame = () => {
    setBoard(createInitialBoard());
    setSelectedSquare(null);
    setValidMoves([]);
    setCurrentTurn('white');
    setGameStatus('playing');
    setScore({ white: 0, black: 0 });
    setMustCapture([]);
    setChainCapture(null);
  };

  const displayBoard = playerColor === 'black' ? [...board].reverse().map(r => [...r].reverse()) : board;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-2" style={{ minHeight: '100vh' }}>
      <VictoryParticles 
        show={gameStatus !== 'playing'} 
        winner={gameStatus === 'whiteWins' ? 'white' : 'black'}
      />
      
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-gray-800 text-xs">
          <div className="w-3 h-3 rounded-full bg-gray-900 border border-gray-600"></div>
          <span>{score.black}</span>
        </div>
        <span className="text-gray-500 text-xs">-</span>
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-gray-800 text-xs">
          <div className="w-3 h-3 rounded-full bg-white border border-gray-300"></div>
          <span>{score.white}</span>
        </div>
      </div>

      <div className="absolute top-4 right-4 flex gap-1">
        <Button variant="outline" size="sm" onClick={resetGame} className="h-7 px-2 text-xs bg-white/5 border-white/20 hover:bg-white/10">
          <RotateCcw className="w-3 h-3" />
        </Button>
        <Button variant="outline" size="sm" onClick={resetGame} className="h-7 px-2 text-xs bg-white/5 border-white/20 hover:bg-white/10">
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      <div className={`absolute bottom-4 px-3 py-1.5 rounded-lg text-xs font-medium ${currentTurn === playerColor ? 'bg-amber-500/20 border border-amber-500' : 'bg-white/5'}`}>
        {gameStatus === 'playing' 
          ? (currentTurn === playerColor 
              ? `Votre tour (${playerColor === 'white' ? 'Blancs' : 'Noirs'})`
              : 'Tour de l\'IA')
          : gameStatus === 'whiteWins' 
            ? '⚪ Blancs gagnent !'
            : '⚫ Noirs gagnent !'
        }
      </div>

      <div className="relative flex justify-center items-center w-full h-full">
         {/* Wooden frame */}
         <div className="p-2 rounded-2xl bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 shadow-2xl" style={{ width: 'min(90vw, 700px)', height: 'min(90vw, 700px)' }}>
           <div className="p-1 bg-gradient-to-br from-amber-950 to-amber-900 rounded-xl w-full h-full">
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', width: '100%', height: '100%', borderRadius: '0.5rem', overflow: 'hidden', boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.5)' }}>
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

                   return (
                     <motion.div
                       key={`${rowIndex}-${colIndex}`}
                       onClick={() => isDark && handleSquareClick(actualRow, actualCol)}
                       whileHover={isDark ? { scale: 0.98 } : {}}
                       whileTap={isDark ? { scale: 0.95 } : {}}
                       style={{
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         position: 'relative',
                         backgroundColor: isDark ? '#4a2f1f' : '#f5e6d3',
                         cursor: isDark ? 'pointer' : 'default',
                         boxShadow: 
                           isSelected ? 'inset 0 0 0 4px #facc15, 0 0 20px rgba(250, 204, 21, 0.6)' :
                           isValidMove && isCapture ? 'inset 0 0 0 2px #ef4444' :
                           isValidMove && !isCapture ? 'inset 0 0 0 2px #22c55e' :
                           isMustCapture ? 'inset 0 0 0 2px #fb923c' :
                           'none'
                       }}
                       className={`${isDark ? 'hover:opacity-90' : ''}`}
                     >
                      {isDark && squareNum && (
                         <span style={{ position: 'absolute', top: '4px', left: '4px', fontSize: '9px', fontWeight: 'bold', color: 'rgba(251, 191, 36, 0.4)', userSelect: 'none' }}>
                           {squareNum}
                         </span>
                       )}
                      
                      <AnimatePresence mode="wait">
                        {cell && (
                          <motion.div 
                            key={`${actualRow}-${actualCol}-${cell.color}-${cell.isKing}`}
                            initial={{ scale: 0, y: -20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="relative w-5 h-5 sm:w-7 sm:h-7" 
                            style={{ transform: 'translateZ(0)' }}
                          >
                          {/* Main pion with 3D effect */}
                          <div 
                            className={`
                              absolute inset-0 rounded-full
                              ${cell.color === 'white' 
                                ? 'bg-gradient-to-br from-[#faf8f5] via-[#e8e6e0] to-[#d0cdc5]' 
                                : 'bg-gradient-to-br from-[#2a2a2a] via-[#1a1a1a] to-[#0a0a0a]'
                              }
                            `}
                            style={{
                              boxShadow: cell.color === 'white'
                                ? '0 4px 10px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -2px 4px rgba(0,0,0,0.15)'
                                : '0 4px 10px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.5)'
                            }}
                          >
                            {/* First concentric ring */}
                            <div 
                              className={`absolute inset-[12%] rounded-full border ${
                                cell.color === 'white' 
                                  ? 'border-gray-400/40 bg-gradient-to-br from-[#f0ede8] to-[#ddd9d0]' 
                                  : 'border-gray-600/40 bg-gradient-to-br from-[#252525] to-[#151515]'
                              }`}
                              style={{
                                boxShadow: cell.color === 'white'
                                  ? 'inset 0 1px 2px rgba(0,0,0,0.1)'
                                  : 'inset 0 1px 2px rgba(255,255,255,0.1)'
                              }}
                            />
                            
                            {/* Second concentric ring */}
                            <div 
                              className={`absolute inset-[25%] rounded-full border ${
                                cell.color === 'white' 
                                  ? 'border-gray-400/50 bg-gradient-to-br from-[#e5e2dd] to-[#d0ccc3]' 
                                  : 'border-gray-600/50 bg-gradient-to-br from-[#202020] to-[#101010]'
                              }`}
                              style={{
                                boxShadow: cell.color === 'white'
                                  ? 'inset 0 1px 2px rgba(0,0,0,0.15)'
                                  : 'inset 0 1px 2px rgba(255,255,255,0.08)'
                              }}
                            />
                            
                            {/* Third concentric ring */}
                            <div 
                              className={`absolute inset-[38%] rounded-full border ${
                                cell.color === 'white' 
                                  ? 'border-gray-400/60 bg-gradient-to-br from-[#dbd8d3] to-[#c5c1b8]' 
                                  : 'border-gray-600/60 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d]'
                              }`}
                              style={{
                                boxShadow: cell.color === 'white'
                                  ? 'inset 0 1px 2px rgba(0,0,0,0.2)'
                                  : 'inset 0 1px 2px rgba(255,255,255,0.05)'
                              }}
                            />
                            
                            {/* Central point */}
                            <div 
                              className={`absolute inset-[47%] rounded-full ${
                                cell.color === 'white' 
                                  ? 'bg-gradient-to-br from-[#bbb8b0] to-[#a8a59d]' 
                                  : 'bg-gradient-to-br from-[#151515] to-[#050505]'
                              }`}
                              style={{
                                boxShadow: cell.color === 'white'
                                  ? 'inset 0 1px 3px rgba(0,0,0,0.3)'
                                  : 'inset 0 1px 3px rgba(0,0,0,0.6)'
                              }}
                            />
                            
                            {/* Glossy highlight - plastic shine effect */}
                            <div 
                              className="absolute top-[15%] left-[25%] w-[35%] h-[30%] rounded-full"
                              style={{
                                background: cell.color === 'white'
                                  ? 'radial-gradient(ellipse at center, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 40%, transparent 70%)'
                                  : 'radial-gradient(ellipse at center, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 40%, transparent 70%)',
                                filter: 'blur(1px)'
                              }}
                            />
                            
                            {/* Secondary reflection */}
                            <div 
                              className="absolute top-[25%] right-[20%] w-[20%] h-[15%] rounded-full"
                              style={{
                                background: cell.color === 'white'
                                  ? 'radial-gradient(ellipse at center, rgba(255,255,255,0.6) 0%, transparent 60%)'
                                  : 'radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, transparent 60%)',
                                filter: 'blur(1.5px)'
                              }}
                            />
                            
                            {cell.isKing && (
                              <div className="absolute inset-0 flex items-center justify-center z-10">
                                <span 
                                  className={`text-xs sm:text-sm font-bold ${
                                    cell.color === 'white' ? 'text-amber-600' : 'text-amber-400'
                                  }`}
                                  style={{
                                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
                                    textShadow: cell.color === 'white'
                                      ? '0 1px 1px rgba(255,255,255,0.5)'
                                      : '0 1px 1px rgba(0,0,0,0.8)'
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
      </div>
    </div>
  );
}