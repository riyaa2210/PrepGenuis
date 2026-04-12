import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

export function useSocket(interviewId, { onRealtimeFeedback } = {}) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!interviewId) return;

    socketRef.current = io('/', { withCredentials: true });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join_interview', { interviewId });
    });

    if (onRealtimeFeedback) {
      socketRef.current.on('realtime_feedback', onRealtimeFeedback);
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, [interviewId]);

  const sendTranscriptChunk = useCallback((transcript) => {
    socketRef.current?.emit('transcript_chunk', { interviewId, transcript });
  }, [interviewId]);

  return { sendTranscriptChunk };
}
