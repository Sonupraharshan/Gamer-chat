import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { SocketContext } from './SocketContext';
import { AuthContext } from './AuthContext';
import { API_URL } from '../config';

export const VoiceContext = createContext();

export const VoiceProvider = ({ children }) => {
  const { socket, connected } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  
  const [localStream, setLocalStream] = useState(null);
  const [localScreenStream, setLocalScreenStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { userId: audioStream }
  const [remoteCameraStreams, setRemoteCameraStreams] = useState({}); // { userId: cameraStream }
  const [remoteScreenStreams, setRemoteScreenStreams] = useState({}); // { userId: screenStream }
  const [isInVoice, setIsInVoice] = useState(false);
  const [voiceParticipants, setVoiceParticipants] = useState([]); // Array of userIds or {userId, username}
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState(null);
  const [isWhispering, setIsWhispering] = useState(false);
  const [whisperTarget, setWhisperTarget] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [highlights, setHighlights] = useState([]);
  const [privateCall, setPrivateCall] = useState({ status: 'idle', targetUser: null, isVideo: false, incomingOffer: null });

  const peerConnections = useRef({}); // { userId: RTCPeerConnection }
  const candidateQueues = useRef({}); // { userId: [RTCIceCandidate] }
  const mediaRecorder = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioChunks = useRef([]);

  // 1. Get User Media
  const startLocalStream = async (video = false) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: video 
      });
      setLocalStream(stream);

      // --- Setup Audio Analyser for Emotion Detection ---
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      return stream;
    } catch (error) {
      console.error('Error accessing microphone/camera:', error);
      return null;
    }
  };

  // 2. Join Voice Channel
  const joinVoice = async (groupId) => {
    if (!connected) return;
    
    // Guard: If already in THIS voice channel, do nothing
    if (isInVoice && currentGroupId === groupId) return;
    
    // Guard: If in a DIFFERENT voice channel, leave it first
    if (isInVoice) {
      leaveVoice();
    }

    const stream = await startLocalStream();
    if (!stream) return;

    setCurrentGroupId(groupId);
    setIsInVoice(true);
    setVoiceParticipants([{ _id: user.id || user._id, username: user.username }]);
    localStorage.setItem('lastVoiceGroupId', groupId);
    socket.emit('join-voice', { groupId });
  };

  // 3. Leave Voice Channel
  const leaveVoice = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    // Close all peer connections
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
    setRemoteStreams({});
    setRemoteCameraStreams({});
    setRemoteScreenStreams({});
    
    if (currentGroupId) {
      socket.emit('leave-voice', { groupId: currentGroupId });
    }
    
    if (isSharingScreen) {
      stopScreenShare();
    }

    setIsInVoice(false);
    setVoiceParticipants([]);
    setCurrentGroupId(null);
    localStorage.removeItem('lastVoiceGroupId');
  };

  // Screen Sharing
  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setLocalScreenStream(stream);
      setIsSharingScreen(true);

      // Re-negotiate with all peers to add screen track
      Object.entries(peerConnections.current).forEach(async ([userId, pc]) => {
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc-offer', { targetId: userId, offer, groupId: currentGroupId });
      });

      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  const stopScreenShare = () => {
    if (localScreenStream) {
      localScreenStream.getTracks().forEach(track => {
        track.stop();
        // Remove track from all peer connections
        Object.values(peerConnections.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track === track);
          if (sender) pc.removeTrack(sender);
        });
      });
      setLocalScreenStream(null);
    }
    setIsSharingScreen(false);
    
    // Renegotiate to signal track removal
    Object.entries(peerConnections.current).forEach(async ([userId, pc]) => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc-offer', { targetId: userId, offer, groupId: currentGroupId });
      } catch (e) {
        console.error("Renegotiation error after screen share stop", e);
      }
    });
  };

  // Camera Toggling
  const toggleCamera = async () => {
    try {
      if (isCameraOn) {
        // Stop camera tracks
        localStream.getVideoTracks().forEach(track => {
          track.stop();
          Object.values(peerConnections.current).forEach(pc => {
            const sender = pc.getSenders().find(s => s.track === track);
            if (sender) pc.removeTrack(sender);
          });
        });
        setIsCameraOn(false);
      } else {
        // Start camera tracks
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = cameraStream.getVideoTracks()[0];
        
        // Add to localStream
        localStream.addTrack(videoTrack);
        
        // Add to all peer connections
        Object.values(peerConnections.current).forEach(pc => {
          pc.addTrack(videoTrack, localStream);
        });
        
        setIsCameraOn(true);
      }
      
      // Renegotiate
      Object.entries(peerConnections.current).forEach(async ([userId, pc]) => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc-offer', { targetId: userId, offer, groupId: currentGroupId });
      });
    } catch (error) {
      console.error('Error toggling camera:', error);
    }
  };

  // 4. Create Peer Connection
  const createPeerConnection = (targetUserId, stream, isPrivate = false) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        if (isPrivate) {
          socket.emit('private-call-ice-candidate', {
            targetUserId: targetUserId,
            candidate: event.candidate
          });
        } else {
          socket.emit('webrtc-ice-candidate', {
            targetId: targetUserId,
            candidate: event.candidate
          });
        }
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      const track = event.track;
      
      console.log(`Received track: ${track.kind} from ${targetUserId}`);

      if (track.kind === 'audio') {
        setRemoteStreams(prev => ({ ...prev, [targetUserId]: stream }));
      } else if (track.kind === 'video') {
        // Try to distinguish based on stream ID or track label (very basic)
        const isScreen = stream.id.includes('screen') || track.label.toLowerCase().includes('screen');
        if (isScreen) {
          setRemoteScreenStreams(prev => ({ ...prev, [targetUserId]: stream }));
        } else {
          setRemoteCameraStreams(prev => ({ ...prev, [targetUserId]: stream }));
        }
      }
    };

    if (stream) {
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
    }

    return pc;
  };

  // Helper to add ICE candidate with queuing logic
  const addCandidate = async (targetUserId, candidate) => {
    const pc = peerConnections.current[targetUserId];
    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error("Error adding received ice candidate", e);
      }
    } else {
      if (!candidateQueues.current[targetUserId]) {
        candidateQueues.current[targetUserId] = [];
      }
      candidateQueues.current[targetUserId].push(candidate);
    }
  };

  // Helper to process queued candidates after remote description is set
  const processQueuedCandidates = (targetUserId) => {
    const queue = candidateQueues.current[targetUserId];
    if (queue && queue.length > 0) {
      queue.forEach(candidate => addCandidate(targetUserId, candidate));
      candidateQueues.current[targetUserId] = [];
    }
  };

  // --- AI EMOTION DETECTION LOOP ---
  useEffect(() => {
    if (!isInVoice || !analyserRef.current || isRecording) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const checkEnergy = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      
      // Threshold for "Hype" (roughly shouting/cheering)
      if (average > 120 && !isRecording) {
        console.log("🔥 High Energy Detected! Starting Auto-Highlight...");
        startRecording();
        
        // Record for 8 seconds
        setTimeout(() => {
          stopRecording();
        }, 8000);
      }
      
      animationFrameRef.current = requestAnimationFrame(checkEnergy);
    };

    animationFrameRef.current = requestAnimationFrame(checkEnergy);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isInVoice, isRecording]);

  const startRecording = () => {
    if (!localStream) return;
    
    audioChunks.current = [];
    mediaRecorder.current = new MediaRecorder(localStream);
    
    mediaRecorder.current.ondataavailable = (event) => {
      audioChunks.current.push(event.data);
    };

    mediaRecorder.current.onstop = uploadAudioSession;

    mediaRecorder.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const uploadAudioSession = async () => {
    const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', audioBlob, 'session.webm');
    formData.append('groupId', currentGroupId);

    try {
      const response = await fetch(`${API_URL}/api/ai/upload-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.highlights) {
        setHighlights(data.highlights);
        alert(`Found ${data.highlights.length} highlights! Check the sidebar.`);
      }
    } catch (error) {
      console.error('Error uploading audio session:', error);
    }
  };

  // Auto-join on mount if saved in localStorage
  useEffect(() => {
    if (connected && user) {
      const savedGroupId = localStorage.getItem('lastVoiceGroupId');
      if (savedGroupId && !isInVoice) {
        console.log("Auto-rejoining voice channel:", savedGroupId);
        joinVoice(savedGroupId);
      }
    }
  }, [connected, !!user]);

  // Handle Socket Events
  useEffect(() => {
    if (!socket) return;

    // A new user joined voice - we (as an existing user) send an offer
    socket.on('user-joined-voice', async (data) => {
      const { userId, username } = data;
      if (!isInVoice || !localStream) return;
      
      console.log(`User ${username} joined voice. Sending offer...`);
      
      setVoiceParticipants(prev => {
        if (!prev.find(p => p._id === userId)) {
          return [...prev, { _id: userId, username }];
        }
        return prev;
      });

      const pc = createPeerConnection(userId, localStream);
      peerConnections.current[userId] = pc;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc-offer', { targetId: userId, offer, groupId: currentGroupId });
    });

    socket.on('voice-channel-users', (data) => {
      // Received list of users already in voice when joining
      setVoiceParticipants(data.users);
    });

    socket.on('webrtc-offer', async (data) => {
      const { offer, senderId, senderUsername } = data;
      if (!isInVoice || !localStream) return;
      
      const pc = createPeerConnection(senderId, localStream);
      peerConnections.current[senderId] = pc;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc-answer', { targetId: senderId, answer });
      processQueuedCandidates(senderId);
    });

    socket.on('webrtc-answer', async (data) => {
      const { answer, senderId } = data;
      const pc = peerConnections.current[senderId];
      if (pc && pc.signalingState === "have-local-offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        processQueuedCandidates(senderId);
      }
    });

    socket.on('webrtc-ice-candidate', async (data) => {
      const { candidate, senderId } = data;
      addCandidate(senderId, candidate);
    });

    socket.on('user-left-voice', (data) => {
      const { userId } = data;
      if (peerConnections.current[userId]) {
        peerConnections.current[userId].close();
        delete peerConnections.current[userId];
      }
      setVoiceParticipants(prev => prev.filter(p => p._id !== userId));
      setRemoteStreams(prev => { const n = { ...prev }; delete n[userId]; return n; });
    });

    // --- Private Call Handlers ---
    socket.on('private-call-request', (data) => {
      const { fromUserId, fromUsername, offer, isVideo } = data;
      setPrivateCall({
        status: 'receiving',
        targetUser: { _id: fromUserId, username: fromUsername },
        isVideo,
        incomingOffer: offer
      });
    });

    socket.on('private-call-accepted', async (data) => {
      const { fromUserId, answer } = data;
      const pc = peerConnections.current[fromUserId];
      if (pc && pc.signalingState === "have-local-offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        setPrivateCall(prev => ({ ...prev, status: 'in-call' }));
        processQueuedCandidates(fromUserId);
      }
    });

    socket.on('private-call-declined', () => {
      alert('Call declined');
      cleanupPrivateCall();
    });

    socket.on('private-call-ended', () => {
      cleanupPrivateCall();
    });

    socket.on('private-call-ice-candidate', async (data) => {
      const { fromUserId, candidate } = data;
      addCandidate(fromUserId, candidate);
    });

    return () => {
      socket.off('user-joined-voice');
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('webrtc-ice-candidate');
      socket.off('user-left-voice');
      socket.off('private-call-request');
      socket.off('private-call-accepted');
      socket.off('private-call-declined');
      socket.off('private-call-ended');
      socket.off('private-call-ice-candidate');
    };
  }, [socket, localStream, isInVoice]);

  const initiatePrivateCall = async (targetUser, isVideo = false) => {
    const stream = await startLocalStream(isVideo); 
    if (!stream) return;
    
    setPrivateCall({ status: 'calling', targetUser, isVideo });
    
    const pc = createPeerConnection(targetUser._id, stream, true);
    peerConnections.current[targetUser._id] = pc;
    
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    socket.emit('private-call-start', {
      targetUserId: targetUser._id,
      offer,
      isVideo
    });
  };

  const acceptPrivateCall = async () => {
    if (!privateCall.incomingOffer) return;
    
    const stream = await startLocalStream(privateCall.isVideo);
    if (!stream) return;
    
    const pc = createPeerConnection(privateCall.targetUser._id, stream, true);
    peerConnections.current[privateCall.targetUser._id] = pc;
    
    await pc.setRemoteDescription(new RTCSessionDescription(privateCall.incomingOffer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    socket.emit('private-call-accept', {
      targetUserId: privateCall.targetUser._id,
      answer
    });
    
    setPrivateCall(prev => ({ ...prev, status: 'in-call', incomingOffer: null }));
    processQueuedCandidates(privateCall.targetUser._id);
  };

  const declinePrivateCall = () => {
    if (privateCall.targetUser) {
      socket.emit('private-call-decline', { targetUserId: privateCall.targetUser._id });
    }
    cleanupPrivateCall();
  };

  const endPrivateCall = () => {
    if (privateCall.targetUser) {
      socket.emit('private-call-end', { targetUserId: privateCall.targetUser._id });
    }
    cleanupPrivateCall();
  };

  const cleanupPrivateCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
    candidateQueues.current = {};
    setRemoteStreams({});
    setPrivateCall({ status: 'idle', targetUser: null, isVideo: false, incomingOffer: null });
  };

  // 6. Whisper Mode Logic
  const startWhisper = (targetUserId) => {
    if (!isInVoice) return;
    setIsWhispering(true);
    setWhisperTarget(targetUserId);
    
    // In a real implementation, we would either:
    // a) Lower the volume of other remote streams local-only
    // b) Or use a separate WebRTC data channel/stream
    // For now, let's signal the intent
    socket.emit('whisper-start', { targetUserId, groupId: currentGroupId });
  };

  const stopWhisper = () => {
    setIsWhispering(false);
    setWhisperTarget(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Use clean-up logic here if needed
    };
  }, []);

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleDeafen = () => {
    const newState = !isDeafened;
    setIsDeafened(newState);
    // If we deafen, we should also mute
    if (newState && !isMuted) {
      toggleMute();
    } else if (!newState && isMuted) {
      toggleMute();
    }
  };

  return (
    <VoiceContext.Provider value={{
      isInVoice,
      voiceParticipants,
      currentGroupId,
      isMuted,
      localStream,
      remoteStreams,
      remoteCameraStreams,
      remoteScreenStreams,
      joinVoice,
      leaveVoice,
      toggleMute,
      isDeafened,
      toggleDeafen,
      isCameraOn,
      toggleCamera,
      startWhisper,
      stopWhisper,
      isWhispering,
      whisperTarget,
      isSharingScreen,
      startScreenShare,
      stopScreenShare,
      localScreenStream,
      privateCall,
      initiatePrivateCall,
      acceptPrivateCall,
      declinePrivateCall,
      endPrivateCall
    }}>
      {children}
      {/* Recording Logic */}
      {isInVoice && (
        <div style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 1000 }}>
          {!isRecording ? (
            <button 
              onClick={() => startRecording()} 
              style={{ padding: '10px', borderRadius: '50%', backgroundColor: '#556158ff', color: '#fff', border: 'none', cursor: 'pointer' }}
              title="Start AI Highlight Recording"
            >
              ⏺️
            </button>
          ) : (
            <button 
              onClick={() => stopRecording()} 
              style={{ padding: '10px', borderRadius: '50%', backgroundColor: '#dc3545', color: '#fff', border: 'none', cursor: 'pointer' }}
              title="Stop and Analyze Highlights"
            >
              ⏹️
            </button>
          )}
        </div>
      )}
    </VoiceContext.Provider>
  );
};
