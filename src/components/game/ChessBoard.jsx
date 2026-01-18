import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VictoryParticles from '../effects/VictoryParticles';
import GameEndModal from './GameEndModal';

const PIECES = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
};

const createInitialBoard = () => {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Rangée 0 (noirs): r, n, b, q, k, b, n, r
  board[0] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  
  // Rangée 1 (pions noirs)
  for (let i = 0; i < 8; i++) board[1][i] = 'p';
  
  // Rangées 2-5 (vides)
  
  // Rangée 6 (pions blancs)
  for (let i = 0; i < 8; i++) board[6][i] = 'P';
  
  // Rangée 7 (blancs): R, N, B, Q, K, B, N, R
  board[7] = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
  
  return board;
};

const cloneBoard = (board) => board.map(r => [...r]);

export default function ChessBoard({ 
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
  const [castlingRights, setCastlingRights] = useState({ white: { K: true, Q: true }, black: { K: true, Q: true } });

  useEffect(() => {
    if (gameStatus !== 'playing' && onGameEnd) onGameEnd(gameStatus);
  }, [gameStatus, onGameEnd]);

  const getPieceColor = (piece) => piece ? (piece === piece.toUpperCase() ? 'white' : 'black') : null;

  const isPathClear = (fromRow, fromCol, toRow, toCol, boardState) => {
    const rowDir = toRow === fromRow ? 0 : (toRow > fromRow ? 1 : -1);
    const colDir = toCol === fromCol ? 0 : (toCol > fromCol ? 1 : -1);
    let r = fromRow + rowDir;
    let c = fromCol + colDir;
    while (r !== toRow || c !== toCol) {
      if (boardState[r][c]) return false;
      r += rowDir;
      c += colDir;
    }
    return true;
  };

  const isSquareAttacked = (row, col, byColor, boardState) => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (!piece || getPieceColor(piece) !== byColor) continue;
        const moves = getPieceMovesRaw(r, c, boardState);
        if (moves.some(m => m.row === row && m.col === col)) return true;
      }
    }
    return false;
  };

  const getPieceMovesRaw = (row, col, boardState) => {
    const piece = boardState[row][col];
    if (!piece) return [];
    
    const color = getPieceColor(piece);
    const type = piece.toUpperCase();
    const moves = [];

    const addMove = (r, c) => {
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const target = boardState[r][c];
        if (!target || getPieceColor(target) !== color) moves.push({ row: r, col: c });
      }
    };

    const addLine = (directions) => {
      directions.forEach(([dr, dc]) => {
        for (let i = 1; i < 8; i++) {
          const r = row + dr * i, c = col + dc * i;
          if (r < 0 || r >= 8 || c < 0 || c >= 8) break;
          const target = boardState[r][c];
          if (!target) moves.push({ row: r, col: c });
          else {
            if (getPieceColor(target) !== color) moves.push({ row: r, col: c });
            break;
          }
        }
      });
    };

    if (type === 'P') {
      const dir = color === 'white' ? -1 : 1;
      const startRow = color === 'white' ? 6 : 1;
      if (!boardState[row + dir][col]) {
        moves.push({ row: row + dir, col });
        if (row === startRow && !boardState[row + 2 * dir][col]) {
          moves.push({ row: row + 2 * dir, col });
        }
      }
      [[dir, -1], [dir, 1]].forEach(([dr, dc]) => {
        const r = row + dr, c = col + dc;
        if (r >= 0 && r < 8 && c >= 0 && c < 8 && boardState[r][c] && getPieceColor(boardState[r][c]) !== color) {
          moves.push({ row: r, col: c });
        }
      });
    } else if (type === 'N') {
      [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]].forEach(([dr, dc]) => {
        addMove(row + dr, col + dc);
      });
    } else if (type === 'B') {
      addLine([[1, 1], [1, -1], [-1, 1], [-1, -1]]);
    } else if (type === 'R') {
      addLine([[0, 1], [0, -1], [1, 0], [-1, 0]]);
    } else if (type === 'Q') {
      addLine([[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
    } else if (type === 'K') {
      [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dr, dc]) => {
        addMove(row + dr, col + dc);
      });
    }

    return moves;
  };

  const getValidMoves = (row, col, boardState) => {
    const moves = getPieceMovesRaw(row, col, boardState);
    const color = getPieceColor(boardState[row][col]);
    return moves.filter(move => {
      const testBoard = cloneBoard(boardState);
      testBoard[move.row][move.col] = testBoard[row][col];
      testBoard[row][col] = null;
      const kingPos = findKing(color, testBoard);
      return kingPos && !isSquareAttacked(kingPos[0], kingPos[1], color === 'white' ? 'black' : 'white', testBoard);
    });
  };

  const findKing = (color, boardState) => {
    const king = color === 'white' ? 'K' : 'k';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (boardState[r][c] === king) return [r, c];
      }
    }
    return null;
  };

  const isCheckmate = (color, boardState) => {
    const kingPos = findKing(color, boardState);
    const opponent = color === 'white' ? 'black' : 'white';
    if (!isSquareAttacked(kingPos[0], kingPos[1], opponent, boardState)) return false;
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece && getPieceColor(piece) === color) {
          if (getValidMoves(r, c, boardState).length > 0) return false;
        }
      }
    }
    return true;
  };

  const makeMove = (fromRow, fromCol, toRow, toCol) => {
    const newBoard = cloneBoard(board);
    const piece = newBoard[fromRow][fromCol];
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;

    const nextColor = currentTurn === 'white' ? 'black' : 'white';
    setBoard(newBoard);
    setSelectedSquare(null);
    setValidMoves([]);
    setCurrentTurn(nextColor);

    if (isMultiplayer && onSaveMove) {
      onSaveMove(newBoard, nextColor);
    }

    if (isCheckmate(nextColor, newBoard)) {
      setGameStatus(currentTurn === 'white' ? 'whiteWins' : 'blackWins');
    }
  };

  const handleSquareClick = (row, col) => {
    if (blockBoard || gameStatus !== 'playing' || !canMove || effectiveTurn !== playerColor) return;

    const piece = board[row][col];

    if (selectedSquare) {
      if (selectedSquare.row === row && selectedSquare.col === col) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      const move = validMoves.find(m => m.row === row && m.col === col);
      if (move) {
        makeMove(selectedSquare.row, selectedSquare.col, row, col);
        return;
      }

      if (piece && getPieceColor(piece) === playerColor) {
        setSelectedSquare({ row, col });
        setValidMoves(getValidMoves(row, col, board));
      } else {
        setSelectedSquare(null);
        setValidMoves([]);
      }
    } else {
      if (piece && getPieceColor(piece) === playerColor) {
        setSelectedSquare({ row, col });
        setValidMoves(getValidMoves(row, col, board));
      }
    }
  };

  useEffect(() => {
    if (isMultiplayer || !aiLevel || blockBoard || gameStatus !== 'playing') return;
    if (currentTurn !== 'black') return;

    const makeAIMove = () => {
      const moves = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = board[r][c];
          if (piece && getPieceColor(piece) === 'black') {
            const pieceMoves = getValidMoves(r, c, board);
            pieceMoves.forEach(m => moves.push({ from: [r, c], to: [m.row, m.col] }));
          }
        }
      }

      if (moves.length === 0) return;

      const selected = aiLevel === 'easy'
        ? moves[Math.floor(Math.random() * moves.length)]
        : moves[Math.floor(Math.random() * moves.length)];

      makeMove(selected.from[0], selected.from[1], selected.to[0], selected.to[1]);
    };

    const timer = setTimeout(makeAIMove, 800);
    return () => clearTimeout(timer);
  }, [currentTurn, board, isMultiplayer, blockBoard, gameStatus, aiLevel]);

  const displayBoard = playerColor === 'black' ? [...board].reverse().map(r => [...r].reverse()) : board;
  const winner = gameStatus === 'whiteWins' ? 'white' : gameStatus === 'blackWins' ? 'black' : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', flex: 1, backgroundColor: '#1a1a1a', padding: '16px', overflow: 'auto' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gridTemplateRows: 'repeat(8, 1fr)', width: '100%', height: '100%', gap: 0, border: '3px solid #3E2723' }}>
          {displayBoard.map((row, rowIndex) => (
            row.map((piece, colIndex) => {
              const actualRow = playerColor === 'black' ? 7 - rowIndex : rowIndex;
              const actualCol = playerColor === 'black' ? 7 - colIndex : colIndex;
              const isLight = (actualRow + actualCol) % 2 === 0;
              const isSelected = selectedSquare?.row === actualRow && selectedSquare?.col === actualCol;
              const isValidMove = validMoves.some(m => m.row === actualRow && m.col === actualCol);

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleSquareClick(actualRow, actualCol)}
                  style={{
                    backgroundColor: isLight ? '#F5E6D3' : '#B58863',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    fontSize: 'clamp(32px, 70%, 60px)',
                    boxShadow: isSelected ? 'inset 0 0 0 4px #facc15' : isValidMove ? 'inset 0 0 0 3px #22c55e' : 'none'
                  }}
                >
                  {piece && <span>{PIECES[piece]}</span>}
                </div>
              );
            })
          ))}
        </div>
      </div>
    </div>
  );
}