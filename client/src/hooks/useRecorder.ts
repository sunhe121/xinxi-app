import { useState, useRef, useCallback } from 'react';
import { appLogger } from '@client/src/utils/logger';

interface UseRecorderOptions {
  onRecordingStart?: () => void;
  onRecordingStop?: (blob: Blob, duration: number) => void;
}

export function useRecorder(options: UseRecorderOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isSupported, setIsSupported] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioUrlRef = useRef<string>('');

  const start = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        setIsSupported(false);
        appLogger.warn('MediaRecorder not supported');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
        }
        audioUrlRef.current = URL.createObjectURL(blob);
        options.onRecordingStop?.(blob, duration);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      options.onRecordingStart?.();

      timerRef.current = window.setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (error) {
      appLogger.error('Start recording failed', error);
      setIsSupported(false);
    }
  }, [options, duration]);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  }, [isRecording]);

  const getAudioUrl = useCallback(() => audioUrlRef.current, []);

  const reset = useCallback(() => {
    stop();
    setDuration(0);
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = '';
    }
  }, [stop]);

  return {
    start,
    stop,
    reset,
    isRecording,
    duration,
    isSupported,
    getAudioUrl,
  };
}
