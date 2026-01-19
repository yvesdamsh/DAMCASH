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

  const activateCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 } },
        audio: true
      });

      setLocalStream(stream);
      setIsCameraActivated(true);
      setIsCameraOn(true);
      setIsMicOn(true);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Ajouter les tracks au peer connection existant
      if (peerConnectionRef.current) {
        stream.getTracks().forEach(track => {
          peerConnectionRef.current.addTrack(track, stream);
        });

        // Faire une offre ou envoyer les tracks existants
        const offer = await peerConnectionRef.current.createOffer({ iceRestart: true });
        await peerConnectionRef.current.setLocalDescription(offer);
        sendSignal('offer', offer);
      }
    } catch (error) {
      console.log('Erreur activation caméra:', error);
      setCameraError(true);
    }
  };

  const deactivateCamera = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
      setIsCameraActivated(false);
      setIsCameraOn(false);
      setIsMicOn(false);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
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
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
              <span className="text-lg">🚫📹</span>
              <p className="text-xs text-white/60 mt-1 text-center px-1">Caméra désactivée</p>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-1 py-0.5">
            <p className="text-white text-xs font-semibold truncate">{opponentName}</p>
          </div>
        </div>

        {/* Vidéo Utilisateur */}
        <div className="relative w-20 h-16 rounded-lg overflow-hidden bg-black shadow-lg border border-[#D4A574]/50 group flex-shrink-0">
          {isCameraActivated && localStream && !cameraError ? (
            <>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scaleX-[-1]"
              />
              {/* Boutons visibles uniquement si caméra activée */}
              <div className="absolute inset-0 flex items-center justify-center gap-0.5 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={toggleMic}
                  className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                    isMicOn
                      ? 'bg-green-500/90 text-white'
                      : 'bg-red-500/90 text-white'
                  }`}
                  title={isMicOn ? 'Couper le micro' : 'Activer le micro'}
                >
                  {isMicOn ? '🎤' : '✕'}
                </button>
                <button
                  onClick={toggleCamera}
                  className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                    isCameraOn
                      ? 'bg-green-500/90 text-white'
                      : 'bg-red-500/90 text-white'
                  }`}
                  title={isCameraOn ? 'Couper la caméra' : 'Activer la caméra'}
                >
                  {isCameraOn ? '📹' : '✕'}
                </button>
                <button
                  onClick={deactivateCamera}
                  className="w-5 h-5 rounded bg-red-600/90 flex items-center justify-center text-xs text-white hover:bg-red-700/90 font-bold"
                  title="Désactiver la caméra"
                >
                  ✕
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="w-5 h-5 rounded bg-gray-700/90 flex items-center justify-center text-xs text-white hover:bg-gray-600/90 font-bold"
                  title="Minimiser"
                >
                  −
                </button>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
              <span className="text-lg">🚫📹</span>
              <p className="text-xs text-white/60 mt-1">Caméra désactivée</p>
              {!cameraError && (
                <button
                  onClick={activateCamera}
                  className="mt-2 px-2 py-1 bg-blue-600/90 hover:bg-blue-700/90 text-white text-xs rounded transition-colors"
                  title="Activer ma caméra"
                >
                  Activer
                </button>
              )}
              {cameraError && (
                <p className="text-xs text-red-400 mt-2">Non disponible</p>
              )}
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-1 py-0.5">
            <p className="text-white text-xs font-semibold">Vous</p>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}