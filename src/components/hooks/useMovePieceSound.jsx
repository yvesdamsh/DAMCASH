import { useCallback } from 'react';

export default function useMovePieceSound() {
  const playMoveSound = useCallback(() => {
    // Web Audio API pour un bruit sec de machette
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioContext.currentTime;

      // Oscillator: fréquence descendante rapide (machette/coup sec)
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);

      // Son sec descendant (machette)
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);

      // Enveloppe rapide
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      console.log('Audio context error:', e);
    }
  }, []);

  return { playMoveSound };
}