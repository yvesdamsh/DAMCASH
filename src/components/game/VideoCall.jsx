import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VideoCall({ 
  roomId, 
  currentUserId, 
  currentUserName, 
  opponentId, 
  opponentName, 
  gameStarted,
  isSpectator 
}) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCameraActivated, setIsCameraActivated] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const signalCheckIntervalRef = useRef(null);

  // Initialiser la connexion WebRTC mais SANS demander les permissions
  useEffect(() => {
    if (!gameStarted || isSpectator || !opponentId) return;

    const initWebRTC = async () => {
      try {
        // Créer RTCPeerConnection SANS activer la caméra
        const peerConnection = new RTCPeerConnection({
          iceServers: [
            { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
          ]
        });

        peerConnectionRef.current = peerConnection;

        // Gérer les streams distants quand l'adversaire active sa caméra
        peerConnection.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            setRemoteStream(event.streams[0]);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = event.streams[0];
            }
          }
        };

        // Gérer les ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            sendSignal('ice_candidate', event.candidate);
          }
        };

        // Vérifier les signaux reçus
        checkForSignals(peerConnection);
      } catch (error) {
        console.log('Erreur initialisation WebRTC:', error);
      }
    };

    initWebRTC();

    return () => {
      if (signalCheckIntervalRef.current) {
        clearInterval(signalCheckIntervalRef.current);
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [gameStarted, isSpectator, opponentId]);

  const sendSignal = async (type, data) => {
    if (!roomId || !currentUserId || !opponentId) return;

    try {
      await base44.entities.WebRTCSignal.create({
        room_id: roomId,
        from_user_id: currentUserId,
        to_user_id: opponentId,
        signal_type: type,
        signal_data: JSON.stringify(data)
      });
    } catch (error) {
      console.log('Erreur envoi signal:', error);
    }
  };

  const checkForSignals = (peerConnection) => {
    signalCheckIntervalRef.current = setInterval(async () => {
      try {
        const signals = await base44.entities.WebRTCSignal.filter({
          room_id: roomId,
          to_user_id: currentUserId,
          processed: false
        });

        for (const signal of signals) {
          await processSignal(signal, peerConnection);
          await base44.entities.WebRTCSignal.update(signal.id, { processed: true });
        }
      } catch (error) {
        console.log('Erreur vérification signaux:', error);
      }
    }, 1000);
  };

  const processSignal = async (signal, peerConnection) => {
    try {
      const data = JSON.parse(signal.signal_data);

      if (signal.signal_type === 'offer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        sendSignal('answer', answer);
      } else if (signal.signal_type === 'answer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data));
      } else if (signal.signal_type === 'ice_candidate') {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(data));
        } catch (e) {
          console.log('Erreur ajout ICE candidate');
        }
      }
    } catch (error) {
      console.log('Erreur traitement signal:', error);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  if (isMinimized) {
    return (
      <motion.button
        onClick={() => setIsMinimized(false)}
        className="absolute top-20 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-amber-500/80 hover:bg-amber-600 shadow-lg z-30 flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Video className="w-4 h-4 text-white" />
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <div className="flex gap-2 justify-center px-4 py-2 bg-[#2C1810]/50 border-b border-[#D4A574]/20">
        {/* Vidéo Adversaire */}
        <div className="relative w-20 h-16 rounded-lg overflow-hidden bg-black shadow-lg border border-[#D4A574]/50 group flex-shrink-0">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-700">
              <span className="text-white/40 text-xs">🚫</span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-1 py-0.5">
            <p className="text-white text-xs font-semibold truncate">{opponentName}</p>
          </div>
          
          {/* Boutons overlay */}
          <div className="absolute inset-0 flex items-center justify-center gap-0.5 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={toggleCamera}
              className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                isCameraOn
                  ? 'bg-green-500/90 text-white'
                  : 'bg-red-500/90 text-white'
              }`}
            >
              {isCameraOn ? '📹' : '✕'}
            </button>
          </div>
        </div>

        {/* Vidéo Utilisateur */}
        <div className="relative w-20 h-16 rounded-lg overflow-hidden bg-black shadow-lg border border-[#D4A574]/50 group flex-shrink-0">
          {localStream && !cameraError ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scaleX-[-1]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-700">
              <span className="text-white/40 text-xs">🚫</span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-1 py-0.5">
            <p className="text-white text-xs font-semibold">Vous</p>
          </div>

          {/* Boutons overlay */}
          <div className="absolute inset-0 flex items-center justify-center gap-0.5 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={toggleMic}
              className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                isMicOn
                  ? 'bg-green-500/90 text-white'
                  : 'bg-red-500/90 text-white'
              }`}
            >
              {isMicOn ? '🎤' : '✕'}
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="w-5 h-5 rounded bg-gray-700/90 flex items-center justify-center text-xs text-white hover:bg-gray-600/90 font-bold"
            >
              −
            </button>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}