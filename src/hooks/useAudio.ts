import { useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { AudioState } from '../types/console';
import { initializeAudioContext, initializeAudioForMusic } from '../utils/audio/audioProcessor';

export const useAudio = () => {
  const [audioState, setAudioState] = useState<AudioState>({
    audioContext: null,
    sound: null,
    analyser: null,
    isPlaying: false,
    isAudioInitialized: false
  });

  const initializeAudio = useCallback(async () => {
    if (!audioState.audioContext) {
      try {
        const { audioContext, analyser } = await initializeAudioContext();
        const listener = new THREE.AudioListener();
        const { sound, analyser: musicAnalyser } = initializeAudioForMusic(audioContext, listener);

        setAudioState(prev => ({
          ...prev,
          audioContext,
          sound,
          analyser: musicAnalyser,
          isAudioInitialized: true
        }));
      } catch (error) {
        console.error("Error initializing audio:", error);
      }
    }
  }, [audioState.audioContext]);

  const handleStartPause = useCallback(() => {
    if (!audioState.isAudioInitialized) {
      initializeAudio();
      return;
    }

    if (audioState.sound) {
      if (audioState.isPlaying) {
        audioState.sound.pause();
      } else {
        audioState.sound.play();
      }
      setAudioState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    }
  }, [audioState, initializeAudio]);

  useEffect(() => {
    return () => {
      if (audioState.audioContext) {
        audioState.audioContext.close();
      }
    };
  }, []);

  return {
    ...audioState,
    initializeAudio,
    handleStartPause
  };
};
