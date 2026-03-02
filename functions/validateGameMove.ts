import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId, from, to, boardState, gameType } = await req.json();

    if (!roomId || !from || !to || !boardState || !gameType) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Charger la session de jeu
    const sessions = await base44.asServiceRole.entities.GameSession.filter({ room_id: roomId });
    if (sessions.length === 0) {
      return Response.json({ error: 'Game not found' }, { status: 404 });
    }

    const session = sessions[0];

    // Vérifier que c'est le tour du joueur
    const playerColor = user.id === session.player1_id ? 'white' : 'black';
    if (session.current_turn !== playerColor) {
      return Response.json({ 
        error: 'Not your turn',
        details: `C'est le tour des ${session.current_turn === 'white' ? 'blancs' : 'noirs'}`
      }, { status: 400 });
    }

    // Parser le board state
    let board;
    try {
      board = JSON.parse(boardState);
    } catch {
      return Response.json({ error: 'Invalid board state' }, { status: 400 });
    }

    // Validation spécifique au type de jeu
    let isLegal = false;

    if (gameType === 'chess') {
      isLegal = validateChessMove(board, from, to, playerColor);
    } else if (gameType === 'checkers') {
      isLegal = validateCheckersMove(board, from, to, playerColor);
    }

    if (!isLegal) {
      return Response.json({ 
        error: 'Illegal move',
        details: 'Ce coup n\'est pas autorisé selon les règles du jeu'
      }, { status: 400 });
    }

    // Le coup est valide
    return Response.json({ 
      valid: true,
      message: 'Coup validé',
      from,
      to
    });
  } catch (error) {
    console.error('Validation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Validation Échecs
function validateChessMove(board, from, to, playerColor) {
  try {
    const fromCol = from.charCodeAt(0) - 97; // a-h = 0-7
    const fromRow = 8 - parseInt(from[1]); // 8-1 = 0-7
    const toCol = to.charCodeAt(0) - 97;
    const toRow = 8 - parseInt(to[1]);

    if (fromCol < 0 || fromCol > 7 || fromRow < 0 || fromRow > 7) return false;
    if (toCol < 0 || toCol > 7 || toRow < 0 || toRow > 7) return false;

    const piece = board[fromRow]?.[fromCol];
    if (!piece) return false;

    // Vérifier la couleur
    const isWhite = piece === piece.toUpperCase();
    if ((playerColor === 'white' && !isWhite) || (playerColor === 'black' && isWhite)) {
      return false;
    }

    const pieceLower = piece.toLowerCase();
    const targetSquare = board[toRow]?.[toCol];

    // Impossible de capturer sa propre pièce
    if (targetSquare) {
      const targetIsWhite = targetSquare === targetSquare.toUpperCase();
      if (isWhite === targetIsWhite) return false;
    }

    // Vérifier les mouvements spécifiques par pièce
    const colDiff = Math.abs(toCol - fromCol);
    const rowDiff = Math.abs(toRow - fromRow);

    switch (pieceLower) {
      case 'p': // Pion
        const direction = isWhite ? -1 : 1;
        const startRow = isWhite ? 6 : 1;
        
        // Avance d'une case
        if (fromCol === toCol && toRow === fromRow + direction && !targetSquare) {
          return true;
        }
        
        // Avance de deux cases depuis la position initiale
        if (fromCol === toCol && fromRow === startRow && 
            toRow === fromRow + 2 * direction && !targetSquare && !board[fromRow + direction]?.[fromCol]) {
          return true;
        }
        
        // Capture diagonale
        if (colDiff === 1 && rowDiff === 1 && toRow === fromRow + direction && targetSquare) {
          return true;
        }
        
        return false;

      case 'n': // Cavalier
        return (colDiff === 2 && rowDiff === 1) || (colDiff === 1 && rowDiff === 2);

      case 'b': // Fou
        if (colDiff === rowDiff) {
          return isPathClear(board, fromRow, fromCol, toRow, toCol);
        }
        return false;

      case 'r': // Tour
        if (fromCol === toCol || fromRow === toRow) {
          return isPathClear(board, fromRow, fromCol, toRow, toCol);
        }
        return false;

      case 'q': // Dame
        if (fromCol === toCol || fromRow === toRow || colDiff === rowDiff) {
          return isPathClear(board, fromRow, fromCol, toRow, toCol);
        }
        return false;

      case 'k': // Roi
        return colDiff <= 1 && rowDiff <= 1;

      default:
        return false;
    }
  } catch {
    return false;
  }
}

// Validation Dames
function validateCheckersMove(board, from, to, playerColor) {
  try {
    const fromCol = from.charCodeAt(0) - 97;
    const fromRow = 8 - parseInt(from[1]);
    const toCol = to.charCodeAt(0) - 97;
    const toRow = 8 - parseInt(to[1]);

    if (fromCol < 0 || fromCol > 7 || fromRow < 0 || fromRow > 7) return false;
    if (toCol < 0 || toCol > 7 || toRow < 0 || toRow > 7) return false;

    const piece = board[fromRow]?.[fromCol];
    if (!piece) return false;

    const isWhite = piece === 'w' || piece === 'W';
    if ((playerColor === 'white' && !isWhite) || (playerColor === 'black' && isWhite)) {
      return false;
    }

    const isKing = piece === piece.toUpperCase();
    const colDiff = Math.abs(toCol - fromCol);
    const rowDiff = Math.abs(toRow - fromRow);

    // Mouvement simple (une case diagonale)
    if (colDiff === 1 && rowDiff === 1) {
      if (!board[toRow]?.[toCol]) {
        // Vérifier direction
        if (isKing) return true;
        if (isWhite && toRow > fromRow) return true;
        if (!isWhite && toRow < fromRow) return true;
      }
    }

    // Capture (deux cases diagonales)
    if (colDiff === 2 && rowDiff === 2) {
      const midCol = (fromCol + toCol) / 2;
      const midRow = (fromRow + toRow) / 2;
      const capturedPiece = board[midRow]?.[midCol];

      if (capturedPiece && !board[toRow]?.[toCol]) {
        const capturedIsWhite = capturedPiece === 'w' || capturedPiece === 'W';
        if (capturedIsWhite !== isWhite) {
          return true;
        }
      }
    }

    return false;
  } catch {
    return false;
  }
}

// Vérifier que le chemin est dégagé
function isPathClear(board, fromRow, fromCol, toRow, toCol) {
  const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;
  const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;

  let currentCol = fromCol + colStep;
  let currentRow = fromRow + rowStep;

  while (currentCol !== toCol || currentRow !== toRow) {
    if (board[currentRow]?.[currentCol]) {
      return false; // Chemin bloqué
    }
    currentCol += colStep;
    currentRow += rowStep;
  }

  return true;
}