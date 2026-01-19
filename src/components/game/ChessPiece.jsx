import React from 'react';
import { motion } from 'framer-motion';

const pieceSymbols = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

const ChessPiece = ({ type, isSelected, set = 'standard', onDragEnd, dragConstraints, canDrag, animateFrom }) => {
  const isWhite = type === type.toUpperCase();
  const symbol = pieceSymbols[type] || '';

  return (
    <motion.div
      drag={canDrag}
      dragMomentum={false}
      dragElastic={0}
      onDragEnd={onDragEnd}
      dragConstraints={dragConstraints}
      initial={animateFrom ? { x: animateFrom.x, y: animateFrom.y } : false}
      animate={{ x: 0, y: 0 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`
        absolute inset-0 flex items-center justify-center
        text-4xl md:text-5xl
        ${canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
        ${isSelected ? 'z-50' : 'z-10'}
      `}
      style={{
        color: isWhite ? '#FFFFFF' : '#000000',
        WebkitTextStroke: isWhite ? '2px #000000' : '2px #FFFFFF',
        filter: isWhite 
          ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' 
          : 'drop-shadow(0 2px 4px rgba(255,255,255,0.6))',
        fontWeight: 'bold',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none'
      }}
    >
      {symbol}
    </motion.div>
  );
};

export default ChessPiece;