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
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const signalCheckIntervalRef = useRef(null);

  // Initialiser la connexion WebRTC
  useEffect(() => {
    if (!gameStarted || isSpectator || !opponentId) return;

    const initWebRTC = async () => {
      try {
        // Demander accès caméra/micro
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 } },
          audio: true
        });

        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);
        setIsMicOn(true);

        // Créer RTCPeerConnection
        const peerConnection = new RTCPeerConnection({
          iceServers: [
            { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
          ]
        });

        peerConnectionRef.current = peerConnection;

        // Ajouter les tracks locaux
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });

        // Gérer les streams distants
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

        // Faire une offre
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        sendSignal('offer', offer);

        // Vérifier les signaux reçus
        checkForSignals(peerConnection);
      } catch (error) {
        console.log('Erreur caméra:', error);
        setCameraError(true);
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
        className="fixed bottom-24 right-6 w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg hover:shadow-xl z-40 flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Video className="w-6 h-6 text-white" />
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed top-24 right-6 z-40 space-y-3"
      >
        {/* Conteneur vidéos */}
        <div className="bg-[#2C1810]/80 backdrop-blur-md p-3 rounded-2xl border border-[#D4A574]/30 shadow-xl space-y-3">
          {/* Vidéo Adversaire */}
          <div className="relative w-40 h-40 rounded-xl overflow-hidden bg-black shadow-lg border border-[#D4A574]/50">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-700">
                <span className="text-white/50 text-center text-xs">
                  {cameraError ? '🚫 Caméra\ndésactivée' : 'En attente...'}
                </span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1">
              <p className="text-white text-xs font-semibold truncate">{opponentName}</p>
            </div>
          </div>

          {/* Vidéo Utilisateur */}
          <div className="relative w-40 h-40 rounded-xl overflow-hidden bg-black shadow-lg border border-[#D4A574]/50">
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
                <span className="text-white/50 text-center text-xs">
                  {cameraError ? '🚫 Caméra\ndésactivée' : 'Connexion...'}
                </span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1">
              <p className="text-white text-xs font-semibold">Vous</p>
            </div>
          </div>

          {/* Contrôles */}
          <div className="flex gap-2 justify-center pt-2 border-t border-[#D4A574]/20">
            <Button
              onClick={toggleCamera}
              size="icon"
              className={`w-10 h-10 rounded-lg transition-all ${
                isCameraOn
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50'
                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50'
              }`}
            >
              {isCameraOn ? (
                <Video className="w-5 h-5" />
              ) : (
                <VideoOff className="w-5 h-5" />
              )}
            </Button>

            <Button
              onClick={toggleMic}
              size="icon"
              className={`w-10 h-10 rounded-lg transition-all ${
                isMicOn
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50'
                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50'
              }`}
            >
              {isMicOn ? (
                <Mic className="w-5 h-5" />
              ) : (
                <MicOff className="w-5 h-5" />
              )}
            </Button>

            <Button
              onClick={() => setIsMinimized(true)}
              size="icon"
              variant="ghost"
              className="w-10 h-10 text-[#D4A574] hover:bg-white/10"
            >
              <Minimize2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}