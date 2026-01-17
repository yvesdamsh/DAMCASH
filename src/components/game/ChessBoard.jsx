import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Plus, Flag } from 'lucide-react';

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

export default function ChessBoard({ playerColor = 'white', aiLevel = 'medium', onGameEnd }) {
  const [board, setBoard] = useState(initialBoard);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [currentTurn, setCurrentTurn] = useState('white');
  const [validMoves, setValidMoves] = useState([]);
  const [gameStatus, setGameStatus] = useState('playing');
  const [moveHistory, setMoveHistory] = useState([]);
  const [castlingRights, setCastlingRights] = useState({
    whiteKingSide: true, whiteQueenSide: true,
    blackKingSide: true, blackQueenSide: true
  });
  const [enPassantTarget, setEnPassantTarget] = useState(null);
  const [lastMove, setLastMove] = useState(null);

  const isWhitePiece = (piece) => piece && piece === piece.toUpperCase();
  const isBlackPiece = (piece) => piece && piece === piece.toLowerCase();
  const isPieceOfColor = (piece, color) => 
    color === 'white' ? isWhitePiece(piece) : isBlackPiece(piece);

  const getValidMoves = useCallback((row, col, boardState, checkForCheck = true) => {
    const piece = boardState[row][col];
    if (!piece) return [];

    const moves = [];
    const isWhite = isWhitePiece(piece);
    const pieceType = piece.toLowerCase();

    const addMove = (r, c, isCapture = false, special = null) => {
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const targetPiece = boardState[r][c];
        if (!targetPiece || (isWhite ? isBlackPiece(targetPiece) : isWhitePiece(targetPiece))) {
          moves.push({ row: r, col: c, isCapture: !!targetPiece || isCapture, special });
        }
      }
    };

    const addSlidingMoves = (directions) => {
      directions.forEach(([dr, dc]) => {
        for (let i = 1; i < 8; i++) {
          const r = row + dr * i;
          const c = col + dc * i;
          if (r < 0 || r >= 8 || c < 0 || c >= 8) break;
          const target = boardState[r][c];
          if (!target) {
            addMove(r, c);
          } else {
            if (isWhite ? isBlackPiece(target) : isWhitePiece(target)) {
              addMove(r, c);
            }
            break;
          }
        }
      });
    };

    switch (pieceType) {
      case 'p':
        const direction = isWhite ? -1 : 1;
        const startRow = isWhite ? 6 : 1;
        
        if (!boardState[row + direction]?.[col]) {
          addMove(row + direction, col);
          if (row === startRow && !boardState[row + 2 * direction]?.[col]) {
            addMove(row + 2 * direction, col, false, 'double');
          }
        }
        
        [-1, 1].forEach(dc => {
          const target = boardState[row + direction]?.[col + dc];
          if (target && (isWhite ? isBlackPiece(target) : isWhitePiece(target))) {
            addMove(row + direction, col + dc);
          }
          if (enPassantTarget && enPassantTarget.row === row + direction && enPassantTarget.col === col + dc) {
            moves.push({ row: row + direction, col: col + dc, isCapture: true, special: 'enPassant' });
          }
        });
        break;

      case 'n':
        [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr, dc]) => {
          addMove(row + dr, col + dc);
        });
        break;

      case 'b':
        addSlidingMoves([[-1,-1],[-1,1],[1,-1],[1,1]]);
        break;

      case 'r':
        addSlidingMoves([[-1,0],[1,0],[0,-1],[0,1]]);
        break;

      case 'q':
        addSlidingMoves([[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]);
        break;

      case 'k':
        [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr, dc]) => {
          addMove(row + dr, col + dc);
        });
        
        if (isWhite && row === 7 && col === 4) {
          if (castlingRights.whiteKingSide && !boardState[7][5] && !boardState[7][6] && boardState[7][7] === 'R') {
            moves.push({ row: 7, col: 6, special: 'castleKing' });
          }
          if (castlingRights.whiteQueenSide && !boardState[7][1] && !boardState[7][2] && !boardState[7][3] && boardState[7][0] === 'R') {
            moves.push({ row: 7, col: 2, special: 'castleQueen' });
          }
        }
        if (!isWhite && row === 0 && col === 4) {
          if (castlingRights.blackKingSide && !boardState[0][5] && !boardState[0][6] && boardState[0][7] === 'r') {
            moves.push({ row: 0, col: 6, special: 'castleKing' });
          }
          if (castlingRights.blackQueenSide && !boardState[0][1] && !boardState[0][2] && !boardState[0][3] && boardState[0][0] === 'r') {
            moves.push({ row: 0, col: 2, special: 'castleQueen' });
          }
        }
        break;
    }

    if (checkForCheck) {
      return moves.filter(move => {
        const newBoard = boardState.map(r => [...r]);
        newBoard[move.row][move.col] = piece;
        newBoard[row][col] = null;
        if (move.special === 'enPassant') {
          newBoard[row][move.col] = null;
        }
        return !isKingInCheck(newBoard, isWhite ? 'white' : 'black');
      });
    }

    return moves;
  }, [castlingRights, enPassantTarget]);

  const isKingInCheck = (boardState, color) => {
    let kingPos = null;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece && piece.toLowerCase() === 'k' && isPieceOfColor(piece, color)) {
          kingPos = { row: r, col: c };
          break;
        }
      }
      if (kingPos) break;
    }

    if (!kingPos) return false;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece && !isPieceOfColor(piece, color)) {
          const moves = getValidMoves(r, c, boardState, false);
          if (moves.some(m => m.row === kingPos.row && m.col === kingPos.col)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const hasAnyValidMove = (boardState, color) => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece && isPieceOfColor(piece, color)) {
          const moves = getValidMoves(r, c, boardState, true);
          if (moves.length > 0) return true;
        }
      }
    }
    return false;
  };

  const makeMove = (fromRow, fromCol, toRow, toCol, special = null) => {
    const newBoard = board.map(r => [...r]);
    const piece = newBoard[fromRow][fromCol];
    const isWhite = isWhitePiece(piece);

    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;

    if (special === 'enPassant') {
      newBoard[fromRow][toCol] = null;
    }

    if (special === 'castleKing') {
      newBoard[toRow][5] = newBoard[toRow][7];
      newBoard[toRow][7] = null;
    }
    if (special === 'castleQueen') {
      newBoard[toRow][3] = newBoard[toRow][0];
      newBoard[toRow][0] = null;
    }

    if (piece.toLowerCase() === 'p' && (toRow === 0 || toRow === 7)) {
      newBoard[toRow][toCol] = isWhite ? 'Q' : 'q';
    }

    const newCastling = { ...castlingRights };
    if (piece === 'K') { newCastling.whiteKingSide = false; newCastling.whiteQueenSide = false; }
    if (piece === 'k') { newCastling.blackKingSide = false; newCastling.blackQueenSide = false; }
    if (fromRow === 7 && fromCol === 0) newCastling.whiteQueenSide = false;
    if (fromRow === 7 && fromCol === 7) newCastling.whiteKingSide = false;
    if (fromRow === 0 && fromCol === 0) newCastling.blackQueenSide = false;
    if (fromRow === 0 && fromCol === 7) newCastling.blackKingSide = false;
    setCastlingRights(newCastling);

    if (special === 'double') {
      setEnPassantTarget({ row: (fromRow + toRow) / 2, col: fromCol });
    } else {
      setEnPassantTarget(null);
    }

    setBoard(newBoard);
    setLastMove({ from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } });
    setMoveHistory([...moveHistory, { from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol }, piece }]);

    const nextColor = isWhite ? 'black' : 'white';
    setCurrentTurn(nextColor);

    if (!hasAnyValidMove(newBoard, nextColor)) {
      if (isKingInCheck(newBoard, nextColor)) {
        setGameStatus(isWhite ? 'whiteWins' : 'blackWins');
      } else {
        setGameStatus('draw');
      }
    }

    return newBoard;
  };

  const handleSquareClick = (row, col) => {
    if (gameStatus !== 'playing') return;
    if (currentTurn !== playerColor) return;

    const piece = board[row][col];

    if (selectedSquare) {
      const move = validMoves.find(m => m.row === row && m.col === col);
      if (move) {
        const newBoard = makeMove(selectedSquare.row, selectedSquare.col, row, col, move.special);
        setSelectedSquare(null);
        setValidMoves([]);
        
        if (gameStatus === 'playing') {
          setTimeout(() => makeAIMove(newBoard), 500);
        }
      } else if (piece && isPieceOfColor(piece, playerColor)) {
        setSelectedSquare({ row, col });
        setValidMoves(getValidMoves(row, col, board));
      } else {
        setSelectedSquare(null);
        setValidMoves([]);
      }
    } else {
      if (piece && isPieceOfColor(piece, playerColor)) {
        setSelectedSquare({ row, col });
        setValidMoves(getValidMoves(row, col, board));
      }
    }
  };

  const makeAIMove = (currentBoard) => {
    if (gameStatus !== 'playing') return;
    
    const aiColor = playerColor === 'white' ? 'black' : 'white';
    const possibleMoves = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = currentBoard[r][c];
        if (piece && isPieceOfColor(piece, aiColor)) {
          const moves = getValidMoves(r, c, currentBoard);
          moves.forEach(move => {
            possibleMoves.push({ from: { row: r, col: c }, to: move, piece });
          });
        }
      }
    }

    if (possibleMoves.length === 0) return;

    let selectedMove;
    
    const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    
    if (aiLevel === 'easy') {
      selectedMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    } else if (aiLevel === 'medium') {
      const captureMoves = possibleMoves.filter(m => m.to.isCapture);
      if (captureMoves.length > 0 && Math.random() > 0.3) {
        selectedMove = captureMoves.reduce((best, m) => {
          const targetPiece = currentBoard[m.to.row][m.to.col];
          const value = targetPiece ? pieceValues[targetPiece.toLowerCase()] : 0;
          const bestValue = best.targetValue || 0;
          return value > bestValue ? { ...m, targetValue: value } : best;
        }, captureMoves[0]);
      } else {
        selectedMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      }
    } else {
      possibleMoves.forEach(move => {
        let score = 0;
        const targetPiece = currentBoard[move.to.row][move.to.col];
        if (targetPiece) {
          score += pieceValues[targetPiece.toLowerCase()] * 10;
        }
        if (move.to.row >= 3 && move.to.row <= 4 && move.to.col >= 3 && move.to.col <= 4) {
          score += 2;
        }
        move.score = score;
      });
      
      possibleMoves.sort((a, b) => b.score - a.score);
      const topMoves = possibleMoves.slice(0, Math.min(5, possibleMoves.length));
      selectedMove = topMoves[Math.floor(Math.random() * topMoves.length)];
    }

    makeMove(selectedMove.from.row, selectedMove.from.col, selectedMove.to.row, selectedMove.to.col, selectedMove.to.special);
  };

  const resetGame = () => {
    setBoard(initialBoard);
    setSelectedSquare(null);
    setValidMoves([]);
    setCurrentTurn('white');
    setGameStatus('playing');
    setMoveHistory([]);
    setCastlingRights({ whiteKingSide: true, whiteQueenSide: true, blackKingSide: true, blackQueenSide: true });
    setEnPassantTarget(null);
    setLastMove(null);
  };

  const columns = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const displayBoard = playerColor === 'black' ? [...board].reverse().map(r => [...r].reverse()) : board;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-md px-2">
        <div className={`px-4 py-2 rounded-lg ${currentTurn === playerColor ? 'bg-amber-500/20 border border-amber-500' : 'bg-white/5'}`}>
          <span className="text-sm font-medium">
            {gameStatus === 'playing' 
              ? (currentTurn === playerColor ? 'Votre tour' : 'Tour de l\'IA')
              : gameStatus === 'whiteWins' 
                ? '⚪ Blancs gagnent !'
                : gameStatus === 'blackWins'
                  ? '⚫ Noirs gagnent !'
                  : '🤝 Match nul'
            }
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetGame} className="bg-white/5 border-white/20 hover:bg-white/10">
            <RotateCcw className="w-4 h-4 mr-1" /> Retour
          </Button>
          <Button variant="outline" size="sm" onClick={resetGame} className="bg-white/5 border-white/20 hover:bg-white/10">
            <Plus className="w-4 h-4 mr-1" /> Nouvelle
          </Button>
        </div>
      </div>

      <div className="relative">
        <div className="flex">
          <div className="flex flex-col justify-around pr-1 text-xs text-gray-400">
            {(playerColor === 'black' ? [1,2,3,4,5,6,7,8] : [8,7,6,5,4,3,2,1]).map(n => (
              <span key={n} className="h-8 sm:h-10 flex items-center">{n}</span>
            ))}
          </div>
          
          <div className="grid grid-cols-8 border-2 border-amber-900/50 rounded-lg overflow-hidden shadow-2xl">
            {displayBoard.map((row, rowIndex) => (
              row.map((piece, colIndex) => {
                const actualRow = playerColor === 'black' ? 7 - rowIndex : rowIndex;
                const actualCol = playerColor === 'black' ? 7 - colIndex : colIndex;
                const isLight = (rowIndex + colIndex) % 2 === 0;
                const isSelected = selectedSquare?.row === actualRow && selectedSquare?.col === actualCol;
                const isValidMove = validMoves.some(m => m.row === actualRow && m.col === actualCol);
                const isCapture = validMoves.find(m => m.row === actualRow && m.col === actualCol)?.isCapture;
                const isLastMove = lastMove && 
                  ((lastMove.from.row === actualRow && lastMove.from.col === actualCol) ||
                   (lastMove.to.row === actualRow && lastMove.to.col === actualCol));

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleSquareClick(actualRow, actualCol)}
                    className={`
                      w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center cursor-pointer
                      transition-all duration-150 relative
                      ${isLight ? 'bg-[#F0D9B5]' : 'bg-[#B58863]'}
                      ${isSelected ? 'ring-2 ring-amber-400 ring-inset' : ''}
                      ${isLastMove ? 'bg-amber-400/30' : ''}
                    `}
                  >
                    {piece && (
                      <span className={`text-2xl sm:text-3xl select-none ${isWhitePiece(piece) ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : 'text-gray-900'}`}>
                        {PIECES[piece]}
                      </span>
                    )}
                    {isValidMove && !piece && (
                      <div className="absolute w-3 h-3 rounded-full bg-amber-500/50"></div>
                    )}
                    {isValidMove && isCapture && (
                      <div className="absolute inset-0 border-4 border-red-500/50 rounded-sm"></div>
                    )}
                  </div>
                );
              })
            ))}
          </div>
        </div>
        
        <div className="flex justify-around pl-5 pt-1 text-xs text-gray-400">
          {(playerColor === 'black' ? [...columns].reverse() : columns).map(c => (
            <span key={c} className="w-8 sm:w-10 text-center">{c}</span>
          ))}
        </div>
      </div>
    </div>
  );
}