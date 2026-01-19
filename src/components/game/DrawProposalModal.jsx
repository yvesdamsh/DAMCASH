import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function DrawProposalModal({ open, onConfirm, onCancel, isLoading }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Fond transparent */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal centrée */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 flex items-center justify-center z-50"
          >
            <div className="bg-gradient-to-br from-[#3E2723] to-[#2C1810] border-2 border-[#D4A574]/60 rounded-2xl shadow-2xl p-8 max-w-sm w-[90%] max-h-[90vh] overflow-y-auto"
              style={{
                boxShadow: '0 0 50px rgba(212, 165, 116, 0.2), 0 0 30px rgba(0, 0, 0, 0.8)'
              }}>
              <h2 className="text-2xl font-bold text-[#F5E6D3] mb-4 text-center">
                🤝 Proposition de nulle
              </h2>

              <p className="text-[#D4A574] text-center mb-8 leading-relaxed">
                Voulez-vous proposer une partie nulle à votre adversaire?
              </p>

              <div className="flex gap-3">
                <Button
                  onClick={onCancel}
                  disabled={isLoading}
                  variant="outline"
                  className="flex-1 border-[#D4A574]/50 text-[#F5E6D3] hover:bg-white/5"
                >
                  Annuler
                </Button>
                <Button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="flex-1 bg-green-700 hover:bg-green-800 text-white font-semibold"
                >
                  {isLoading ? '⏳ En cours...' : 'Oui, proposer'}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}