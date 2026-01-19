// Helper function to check if a king is in check
export const isInCheck = (board, color) => {
  // Find the king position
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
  
  // Check if any opponent piece can attack the king
  const opponentColor = color === 'white' ? 'black' : 'white';
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      
      const pieceColor = piece === piece.toUpperCase() ? 'white' : 'black';
      if (pieceColor !== opponentColor) continue;
      
      // Check if this piece can attack the king
      if (canPieceAttack(board, r, c, kingPos.r, kingPos.c)) {
        return true;
      }
    }
  }
  
  return false;
};

const canPieceAttack = (board, fromR, fromC, toR, toC) => {
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