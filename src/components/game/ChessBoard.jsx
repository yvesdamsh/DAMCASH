import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VictoryParticles from '../effects/VictoryParticles';
import GameEndModal from './GameEndModal';

const PIECES = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
};

const createInitialBoard = () => [
  ['r','n','b','q','k','b','n','r'],
  ['p','p','p','p','p','p','p','p'],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['P','P','P','P','P','P','P','P'],
  ['R','N','B','Q','K','B','N','R']
];

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

  const getPieceSymbol = (piece) => {
    const symbols = {
      'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
      'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
    };
    return symbols[piece] || '';
  };

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
      <div style={{ width: 'min(90vw, calc(100vh - 200px))', height: 'min(90vw, calc(100vh - 200px))', aspectRatio: '1/1', display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 0, border: '3px solid #3E2723' }}>
        {Array.from({length: 64}).map((_, i) => {
          const r = Math.floor(i / 8);
          const c = i % 8;
          const displayRow = playerColor === 'black' ? 7 - r : r;
          const displayCol = playerColor === 'black' ? 7 - c : c;
          const piece = board[displayRow][displayCol];
          const isSelected = selectedSquare?.row === displayRow && selectedSquare?.col === displayCol;
          const isValidMove = validMoves.some(m => m.row === displayRow && m.col === displayCol);
          
          return (
            <div
              key={i}
              onClick={() => handleSquareClick(displayRow, displayCol)}
              style={{
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: (r + c) % 2 === 0 ? '#F5E6D3' : '#B58863',
                cursor: 'pointer',
                fontSize: '40px',
                boxShadow: isSelected ? 'inset 0 0 0 4px #facc15' : isValidMove ? 'inset 0 0 0 3px #22c55e' : 'none'
              }}
            >
              {piece && piece !== '' ? getPieceSymbol(piece) : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}