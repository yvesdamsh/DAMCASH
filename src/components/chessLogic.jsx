// Logique complète des échecs selon les règles internationales

export const createInitialBoard = () => {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Pions
  for (let i = 0; i < 8; i++) {
    board[1][i] = 'p'; // Noirs
    board[6][i] = 'P'; // Blancs
  }
  
  // Autres pièces
  const pieces = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  for (let i = 0; i < 8; i++) {
    board[0][i] = pieces[i]; // Noirs
    board[7][i] = pieces[i].toUpperCase(); // Blancs
  }
  
  return board;
};

export const isInCheck = (board, color) => {
  // Trouver le roi
  let kingPos = null;
  const king = color === 'white' ? 'K' : 'k';
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === king) {
        kingPos = { r, c };
        break;
      }
    }
    if (kingPos) break;
  }
  
  if (!kingPos) return false;
  
  // Vérifier si une pièce adverse peut attaquer le roi
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      
      const pieceColor = piece === piece.toUpperCase() ? 'white' : 'black';
      if (pieceColor === color) continue;
      
      if (canPieceAttackSquare(board, r, c, kingPos.r, kingPos.c, false)) {
        return true;
      }
    }
  }
  
  return false;
};

const canPieceAttackSquare = (board, fromR, fromC, toR, toC, checkKingSafety = true) => {
  const piece = board[fromR][fromC];
  if (!piece) return false;
  
  const type = piece.toUpperCase();
  const isWhite = piece === piece.toUpperCase();
  
  const dr = toR - fromR;
  const dc = toC - fromC;
  
  switch (type) {
    case 'P': {
      const direction = isWhite ? -1 : 1;
      return dr === direction && Math.abs(dc) === 1;
    }
    case 'N': {
      return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
    }
    case 'B': {
      if (Math.abs(dr) !== Math.abs(dc)) return false;
      return isPathClear(board, fromR, fromC, toR, toC);
    }
    case 'R': {
      if (dr !== 0 && dc !== 0) return false;
      return isPathClear(board, fromR, fromC, toR, toC);
    }
    case 'Q': {
      if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return false;
      return isPathClear(board, fromR, fromC, toR, toC);
    }
    case 'K': {
      return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
    }
    default:
      return false;
  }
};

const isPathClear = (board, fromR, fromC, toR, toC) => {
  const dr = toR === fromR ? 0 : (toR > fromR ? 1 : -1);
  const dc = toC === fromC ? 0 : (toC > fromC ? 1 : -1);
  
  let r = fromR + dr;
  let c = fromC + dc;
  
  while (r !== toR || c !== toC) {
    if (board[r][c]) return false;
    r += dr;
    c += dc;
  }
  
  return true;
};

export const getValidMoves = (board, fromR, fromC, gameState = {}) => {
  const piece = board[fromR][fromC];
  if (!piece) return [];
  
  const moves = [];
  const type = piece.toUpperCase();
  const isWhite = piece === piece.toUpperCase();
  const color = isWhite ? 'white' : 'black';
  
  // Générer tous les coups possibles selon la pièce
  switch (type) {
    case 'P':
      moves.push(...getPawnMoves(board, fromR, fromC, isWhite, gameState));
      break;
    case 'N':
      moves.push(...getKnightMoves(board, fromR, fromC, isWhite));
      break;
    case 'B':
      moves.push(...getBishopMoves(board, fromR, fromC, isWhite));
      break;
    case 'R':
      moves.push(...getRookMoves(board, fromR, fromC, isWhite));
      break;
    case 'Q':
      moves.push(...getQueenMoves(board, fromR, fromC, isWhite));
      break;
    case 'K':
      moves.push(...getKingMoves(board, fromR, fromC, isWhite, gameState));
      break;
  }
  
  // Filtrer les coups qui mettent le roi en échec
  return moves.filter(move => {
    const testBoard = board.map(row => [...row]);
    testBoard[move.to.r][move.to.c] = testBoard[fromR][fromC];
    testBoard[fromR][fromC] = null;
    
    // En passant
    if (move.enPassant) {
      testBoard[fromR][move.to.c] = null;
    }
    
    return !isInCheck(testBoard, color);
  });
};

const getPawnMoves = (board, r, c, isWhite, gameState) => {
  const moves = [];
  const direction = isWhite ? -1 : 1;
  const startRow = isWhite ? 6 : 1;
  const promotionRow = isWhite ? 0 : 7;
  
  // Avancer d'une case
  if (!board[r + direction]?.[c]) {
    const isPromotion = (r + direction) === promotionRow;
    moves.push({ 
      to: { r: r + direction, c },
      promotion: isPromotion
    });
    
    // Avancer de deux cases depuis la position initiale
    if (r === startRow && !board[r + 2 * direction]?.[c]) {
      moves.push({ 
        to: { r: r + 2 * direction, c },
        pawnDoubleMove: true
      });
    }
  }
  
  // Captures diagonales
  [-1, 1].forEach(dc => {
    const targetR = r + direction;
    const targetC = c + dc;
    const target = board[targetR]?.[targetC];
    
    if (target && (target === target.toUpperCase()) !== isWhite) {
      const isPromotion = targetR === promotionRow;
      moves.push({ 
        to: { r: targetR, c: targetC },
        promotion: isPromotion
      });
    }
    
    // En passant
    if (gameState.lastMove?.pawnDoubleMove && 
        gameState.lastMove.to.r === r && 
        gameState.lastMove.to.c === targetC) {
      moves.push({ 
        to: { r: targetR, c: targetC },
        enPassant: true
      });
    }
  });
  
  return moves;
};

const getKnightMoves = (board, r, c, isWhite) => {
  const moves = [];
  const knightMoves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  
  knightMoves.forEach(([dr, dc]) => {
    const newR = r + dr;
    const newC = c + dc;
    
    if (newR >= 0 && newR < 8 && newC >= 0 && newC < 8) {
      const target = board[newR][newC];
      if (!target || (target === target.toUpperCase()) !== isWhite) {
        moves.push({ to: { r: newR, c: newC } });
      }
    }
  });
  
  return moves;
};

const getBishopMoves = (board, r, c, isWhite) => {
  return getSlidingMoves(board, r, c, isWhite, [[-1,-1],[-1,1],[1,-1],[1,1]]);
};

const getRookMoves = (board, r, c, isWhite) => {
  return getSlidingMoves(board, r, c, isWhite, [[-1,0],[1,0],[0,-1],[0,1]]);
};

const getQueenMoves = (board, r, c, isWhite) => {
  return getSlidingMoves(board, r, c, isWhite, [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]);
};

const getSlidingMoves = (board, r, c, isWhite, directions) => {
  const moves = [];
  
  directions.forEach(([dr, dc]) => {
    for (let i = 1; i < 8; i++) {
      const newR = r + dr * i;
      const newC = c + dc * i;
      
      if (newR < 0 || newR >= 8 || newC < 0 || newC >= 8) break;
      
      const target = board[newR][newC];
      if (!target) {
        moves.push({ to: { r: newR, c: newC } });
      } else {
        if ((target === target.toUpperCase()) !== isWhite) {
          moves.push({ to: { r: newR, c: newC } });
        }
        break;
      }
    }
  });
  
  return moves;
};

const getKingMoves = (board, r, c, isWhite, gameState = {}) => {
  const moves = [];
  
  // Mouvements normaux
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      
      const newR = r + dr;
      const newC = c + dc;
      
      if (newR >= 0 && newR < 8 && newC >= 0 && newC < 8) {
        const target = board[newR][newC];
        if (!target || (target === target.toUpperCase()) !== isWhite) {
          moves.push({ to: { r: newR, c: newC } });
        }
      }
    }
  }
  
  // Roque
  const color = isWhite ? 'white' : 'black';
  const castlingRights = gameState.castlingRights || {
    white: { kingside: true, queenside: true },
    black: { kingside: true, queenside: true }
  };
  
  if (!isInCheck(board, color)) {
    // Petit roque (kingside)
    if (castlingRights[color].kingside) {
      if (!board[r][c + 1] && !board[r][c + 2] && board[r][c + 3]) {
        const testBoard1 = board.map(row => [...row]);
        testBoard1[r][c + 1] = testBoard1[r][c];
        testBoard1[r][c] = null;
        
        if (!isInCheck(testBoard1, color)) {
          const testBoard2 = board.map(row => [...row]);
          testBoard2[r][c + 2] = testBoard2[r][c];
          testBoard2[r][c] = null;
          
          if (!isInCheck(testBoard2, color)) {
            moves.push({ 
              to: { r, c: c + 2 },
              castling: 'kingside'
            });
          }
        }
      }
    }
    
    // Grand roque (queenside)
    if (castlingRights[color].queenside) {
      if (!board[r][c - 1] && !board[r][c - 2] && !board[r][c - 3] && board[r][c - 4]) {
        const testBoard1 = board.map(row => [...row]);
        testBoard1[r][c - 1] = testBoard1[r][c];
        testBoard1[r][c] = null;
        
        if (!isInCheck(testBoard1, color)) {
          const testBoard2 = board.map(row => [...row]);
          testBoard2[r][c - 2] = testBoard2[r][c];
          testBoard2[r][c] = null;
          
          if (!isInCheck(testBoard2, color)) {
            moves.push({ 
              to: { r, c: c - 2 },
              castling: 'queenside'
            });
          }
        }
      }
    }
  }
  
  return moves;
};

export const isCheckmate = (board, color, gameState) => {
  if (!isInCheck(board, color)) return false;
  
  // Vérifier si le roi peut bouger ou si une pièce peut bloquer/capturer
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      
      const pieceColor = piece === piece.toUpperCase() ? 'white' : 'black';
      if (pieceColor !== color) continue;
      
      const moves = getValidMoves(board, r, c, gameState);
      if (moves.length > 0) return false;
    }
  }
  
  return true;
};

export const isStalemate = (board, color, gameState) => {
  if (isInCheck(board, color)) return false;
  
  // Vérifier si le joueur a des coups légaux
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      
      const pieceColor = piece === piece.toUpperCase() ? 'white' : 'black';
      if (pieceColor !== color) continue;
      
      const moves = getValidMoves(board, r, c, gameState);
      if (moves.length > 0) return false;
    }
  }
  
  return true;
};