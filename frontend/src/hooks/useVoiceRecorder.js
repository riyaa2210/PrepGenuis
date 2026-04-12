import { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

export function useVoiceRecorder({ onTranscript, onChunk } = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recognitionRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start(1000);
      setIsRecording(true);

      // Web Speech API for live transcript
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;

        let finalTranscript = '';
        recognition.onresult = (event) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const t = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += t + ' ';
              if (onChunk) onChunk(t);
            } else {
              interim += t;
            }
          }
          const full = finalTranscript + interim;
          setTranscript(full);
          if (onTranscript) onTranscript(full);
        };

        recognition.onerror = (e) => {
          if (e.error !== 'no-speech') console.warn('Speech recognition error:', e.error);
        };

        recognition.start();
      }
    } catch (err) {
      toast.error('Microphone access denied. Please allow microphone access.');
      console.error(err);
    }
  }, [onTranscript, onChunk]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const resetRecording = useCallback(() => {
    setTranscript('');
    setAudioBlob(null);
  }, []);

  return { isRecording, transcript, audioBlob, startRecording, stopRecording, resetRecording };
}
