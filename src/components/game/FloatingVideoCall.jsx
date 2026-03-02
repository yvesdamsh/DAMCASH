import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, VideoOff, Mic, MicOff, Minimize2, Maximize2, X } from 'lucide-react';

export default function FloatingVideoCall({
  roomId,
  currentUserId,
  opponentId,
  opponentName,
  gameStarted,
  isSpectator
}) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [cameraError, setCameraError] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const signalIntervalRef = useRef(null);

  // Init WebRTC
  useEffect(() => {
    if (!gameStarted || isSpectator || !opponentId || !roomId) return;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }]
    });
    peerConnectionRef.current = pc;

    pc.ontrack = (e) => {
      if (e.streams?.[0]) {
        setRemoteStream(e.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = e.streams[0];
          remoteVideoRef.current.play().catch(() => {});
        }
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) sendSignal('ice_candidate', e.candidate);
    };

    // Poll for signals
    signalIntervalRef.current = setInterval(async () => {
      try {
        const signals = await base44.entities.WebRTCSignal.filter({ room_id: roomId, to_user_id: currentUserId, processed: false });
        for (const sig of signals) {
          const data = JSON.parse(sig.signal_data);
          if (sig.signal_type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data));
            const ans = await pc.createAnswer();
            await pc.setLocalDescription(ans);
            sendSignal('answer', ans);
          } else if (sig.signal_type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data));
          } else if (sig.signal_type === 'ice_candidate') {
            try { await pc.addIceCandidate(new RTCIceCandidate(data)); } catch {}
          }
          await base44.entities.WebRTCSignal.update(sig.id, { processed: true });
        }
      } catch {}
    }, 1000);

    return () => {
      clearInterval(signalIntervalRef.current);
      pc.close();
    };
  }, [gameStarted, isSpectator, opponentId, roomId, currentUserId]);

  const sendSignal = async (type, data) => {
    if (!roomId || !currentUserId || !opponentId) return;
    try {
      await base44.entities.WebRTCSignal.create({
        room_id: roomId, from_user_id: currentUserId, to_user_id: opponentId,
        signal_type: type, signal_data: JSON.stringify(data)
      });
    } catch {}
  };

  const activateCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: true });
      setLocalStream(stream);
      setIsCameraOn(true);
      setIsMicOn(true);
      setCameraError(false);
      if (localVideoRef.current) { localVideoRef.current.srcObject = stream; localVideoRef.current.muted = true; localVideoRef.current.play().catch(() => {}); }
      if (peerConnectionRef.current && opponentId) {
        stream.getTracks().forEach(t => peerConnectionRef.current.addTrack(t, stream));
        const offer = await peerConnectionRef.current.createOffer({ iceRestart: true });
        await peerConnectionRef.current.setLocalDescription(offer);
        sendSignal('offer', offer);
      }
    } catch { setCameraError(true); }
  };

  const toggleCamera = () => {
    if (!localStream) return;
    const vt = localStream.getVideoTracks()[0];
    if (vt) { vt.enabled = !vt.enabled; setIsCameraOn(vt.enabled); }
  };

  const toggleMic = () => {
    if (!localStream) return;
    const at = localStream.getAudioTracks()[0];
    if (at) { at.enabled = !at.enabled; setIsMicOn(at.enabled); }
  };

  const stopAll = () => {
    if (localStream) { localStream.getTracks().forEach(t => t.stop()); setLocalStream(null); }
    setIsCameraOn(false);
    setIsHidden(true);
  };

  if (isSpectator || isHidden) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="fixed bottom-24 right-3 z-40 select-none"
      style={{ width: isMinimized ? 56 : 200 }}
    >
      <AnimatePresence mode="wait">
        {isMinimized ? (
          <motion.button
            key="mini"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsMinimized(false)}
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border border-[#D4A574]/40"
            style={{ background: 'linear-gradient(135deg, #3E2723, #2C1810)' }}
          >
            <Video className="w-6 h-6 text-[#D4A574]" />
          </motion.button>
        ) : (
          <motion.div
            key="full"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="rounded-2xl overflow-hidden shadow-2xl border border-[#D4A574]/25"
            style={{ background: 'linear-gradient(160deg, #1a0c06, #2C1810)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#D4A574]/15">
              <div className="flex items-center gap-1.5">
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className={`w-1.5 h-1.5 rounded-full ${localStream ? 'bg-green-400' : 'bg-gray-500'}`}
                />
                <span className="text-[10px] font-bold text-[#D4A574]/70 uppercase tracking-wider">Vidéo</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setIsMinimized(true)} className="w-5 h-5 rounded flex items-center justify-center text-[#D4A574]/50 hover:text-[#D4A574] hover:bg-white/5 transition-all">
                  <Minimize2 className="w-3 h-3" />
                </button>
                <button onClick={stopAll} className="w-5 h-5 rounded flex items-center justify-center text-[#D4A574]/50 hover:text-red-400 hover:bg-red-900/20 transition-all">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Remote video (opponent — top, bigger) */}
            <div className="relative" style={{ height: 112 }}>
              {remoteStream ? (
                <video ref={remoteVideoRef} autoPlay playsInline muted={false} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1"
                  style={{ background: 'linear-gradient(135deg, #0d0503, #1a0c06)' }}>
                  <div className="w-10 h-10 rounded-full bg-[#3E2723] border border-[#D4A574]/20 flex items-center justify-center text-xl">
                    {opponentName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <p className="text-[10px] text-[#D4A574]/50 font-medium">{opponentName || 'Adversaire'}</p>
                  <p className="text-[9px] text-[#D4A574]/30">caméra non connectée</p>
                </div>
              )}
              {/* Opponent name overlay */}
              <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/70 to-transparent">
                <p className="text-[10px] font-bold text-white/80 truncate">{opponentName}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-[#D4A574]/10" />

            {/* Local video (you — bottom, smaller) */}
            <div className="relative" style={{ height: 80 }}>
              {localStream && isCameraOn ? (
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1"
                  style={{ background: 'linear-gradient(135deg, #0f0604, #1a0c06)' }}>
                  {cameraError ? (
                    <p className="text-[9px] text-red-400/70">Caméra indisponible</p>
                  ) : !localStream ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={activateCamera}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border border-[#D4A574]/30 text-[#D4A574] hover:bg-[#D4A574]/10 transition-all"
                    >
                      <Video className="w-3 h-3" /> Activer
                    </motion.button>
                  ) : (
                    <VideoOff className="w-5 h-5 text-[#D4A574]/30" />
                  )}
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-[10px] font-bold text-white/60">Vous</p>
              </div>
            </div>

            {/* Controls */}
            {localStream && (
              <div className="flex items-center justify-center gap-2 px-3 py-2 border-t border-[#D4A574]/10">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleMic}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border ${
                    isMicOn
                      ? 'bg-[#D4A574]/15 border-[#D4A574]/30 text-[#D4A574]'
                      : 'bg-red-900/30 border-red-500/30 text-red-400'
                  }`}
                >
                  {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleCamera}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border ${
                    isCameraOn
                      ? 'bg-[#D4A574]/15 border-[#D4A574]/30 text-[#D4A574]'
                      : 'bg-red-900/30 border-red-500/30 text-red-400'
                  }`}
                >
                  {isCameraOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}