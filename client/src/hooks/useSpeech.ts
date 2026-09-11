import { useState, useRef, useCallback, useEffect } from 'react';
import { appLogger } from '@client/src/utils/logger';

interface UseSpeechOptions {
  rate?: number;
  pitch?: number;
  lang?: string;
}

export function useSpeech(options: UseSpeechOptions = {}) {
  const { rate = 1, pitch = 1, lang = 'zh-CN' } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
    }
  }, []);

  const speak = useCallback(
    (text: string, opts: UseSpeechOptions = {}) => {
      if (!isSupported) {
        appLogger.warn('Speech synthesis not supported');
        return;
      }
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = opts.lang || lang;
      utterance.rate = opts.rate || rate;
      utterance.pitch = opts.pitch || pitch;

      const voices = window.speechSynthesis.getVoices();
      const chineseVoice =
        voices.find((v) => v.lang.startsWith('zh') && v.name.includes('女')) ||
        voices.find((v) => v.lang.startsWith('zh')) ||
        voices[0];
      if (chineseVoice) {
        utterance.voice = chineseVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      utterance.onerror = (e) => {
        appLogger.error('Speech synthesis error', e);
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, lang, rate, pitch]
  );

  const pause = useCallback(() => {
    if (isSupported && isSpeaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSupported, isSpeaking]);

  const resume = useCallback(() => {
    if (isSupported && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isSupported, isPaused]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, [isSupported]);

  return {
    speak,
    pause,
    resume,
    stop,
    isSpeaking,
    isPaused,
    isSupported,
  };
}
