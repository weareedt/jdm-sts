import { useCallback, useRef, useState, useEffect } from 'react';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { WavRecorder, WavStreamPlayer } from '../lib/wavtools/index.js';
import { instructions } from '../utils/conversation_config.js';
import { ConsoleState, UseConversationReturn } from '../types/console';
import * as THREE from 'three';
import { sendMessage } from '../utils/api';

export const useConversation = (apiKey: string, LOCAL_RELAY_SERVER_URL: string): UseConversationReturn => {
  // UI State
  const [state, setState] = useState<ConsoleState>({
    userMessage: '',
    items: [],
    realtimeEvents: [],
    expandedEvents: {},
    isConnected: false,
    canPushToTalk: true,
    isRecording: false,
    memoryKv: {},
    coords: {
      lat: 37.775593,
      lng: -122.418137,
    },
    marker: null,
    audioData: new Uint8Array(0),
    isMinimized: true,
    isColorControlVisible: true,
    animationColor: '#ffff00',
    startTime: new Date().toISOString(),
    eventsScrollHeight: 0,
    audioContext: null,
    sound: null,
    analyser: null,
    isPlaying: false,
    isAudioInitialized: false
  });

  const isFirefox = navigator.userAgent.match(/Firefox\/([1]{1}[7-9]{1}|[2-9]{1}[0-9]{1})/);
  const sampleRate = 24000;

  // Audio instances
  const recorder = useRef<WavRecorder | null>(null);
  const streamPlayer = useRef<WavStreamPlayer>(new WavStreamPlayer({ sampleRate: sampleRate }));
  const client = useRef<RealtimeClient>(
    new RealtimeClient(
      LOCAL_RELAY_SERVER_URL
        ? { url: LOCAL_RELAY_SERVER_URL }
        : {
            apiKey: apiKey,
            dangerouslyAllowAPIKeyInBrowser: true,
          }
    )
  );

  // UI refs
  const uiRefs = {
    contentTop: useRef<HTMLDivElement>(null),
    clientCanvas: useRef<HTMLCanvasElement>(null),
    serverCanvas: useRef<HTMLCanvasElement>(null),
    eventsScroll: useRef<HTMLDivElement>(null),
    mount: useRef<HTMLDivElement>(null),
    shaderMaterial: useRef<THREE.ShaderMaterial>(null)
  };

  // Set up event listeners
  useEffect(() => {
    const currentClient = client.current;
    if (!currentClient) return;

    // Set instructions and transcription
    currentClient.updateSession({ 
      instructions,
      input_audio_transcription: { model: 'whisper-1' }
    });

    // Handle realtime events
    currentClient.on('realtime.event', (realtimeEvent: any) => {
      setState(prev => {
        const lastEvent = prev.realtimeEvents[prev.realtimeEvents.length - 1];
        if (lastEvent?.event.type === realtimeEvent.event.type) {
          lastEvent.count = (lastEvent.count || 0) + 1;
          return {
            ...prev,
            realtimeEvents: [...prev.realtimeEvents.slice(0, -1), lastEvent]
          };
        }
        return {
          ...prev,
          realtimeEvents: [...prev.realtimeEvents, realtimeEvent]
        };
      });
    });

    // Handle errors
    currentClient.on('error', (error: any) => console.error('Client error:', error));

    // Handle conversation interruption
    currentClient.on('conversation.interrupted', async () => {
      if (!streamPlayer.current) return;
      const trackSampleOffset = await streamPlayer.current.interrupt();
      if (trackSampleOffset?.trackId) {
        const { trackId, offset } = trackSampleOffset;
        await currentClient.cancelResponse(trackId, offset);
      }
    });

    // Handle conversation updates
    currentClient.on('conversation.updated', async ({ item, delta }: any) => {
      if (!streamPlayer.current) return;
      const items = currentClient.conversation.getItems();
      
      if (delta?.audio) {
        streamPlayer.current.add16BitPCM(delta.audio, item.id);
      }
      
      if (item.status === 'completed' && item.formatted.audio?.length) {
        const wavFile = await WavRecorder.decode(
          item.formatted.audio,
          sampleRate,
          sampleRate
        );
        item.formatted.file = wavFile;
      }
      
      setState(prev => ({ ...prev, items }));
    });

    return () => {
      currentClient.reset();
    };
  }, []);

  // Connect to conversation
  const connectConversation = useCallback(async () => {
    if (!client.current || !streamPlayer.current) return;

    // Create new recorder
    const newRecorder = new WavRecorder({ sampleRate: 24000 });
    recorder.current = newRecorder;

    try {
      await newRecorder.begin();
      await streamPlayer.current.connect();
      await client.current.connect();

      setState(prev => ({
        ...prev,
        startTime: new Date().toISOString(),
        isConnected: true,
        realtimeEvents: [],
        items: client.current.conversation.getItems()
      }));

      client.current.sendUserMessageContent([
        {
          type: 'input_text',
          text: 'Hello!',
        },
      ]);

      // Send a POST request to webhook URL
      await fetch('https://hooks.spline.design/0AmP-aHvvxs', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `qZz4w4WlZgUqvmN8LvuFHtCdYRuxM8pUrPFuI_Woetk`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          "WebhookTest": "Hello, successsssla"
        })
      }).then(response => {
        if (!response.ok) {
          console.error("Webhook request failed:", response.statusText);
        } else {
          console.log("Webhook request successful!");
        }
      }).catch(error => {
        console.error("Error sending webhook request:", error);
      });

      if (client.current.getTurnDetectionType() === 'server_vad') {
        await newRecorder.record((data) => client.current.appendInputAudio(data.mono));
      }
    } catch (error) {
      console.error("Error connecting:", error);
      setState(prev => ({ ...prev, isConnected: false }));
    }
  }, []);

  // Disconnect conversation
  const disconnectConversation = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isConnected: false,
      realtimeEvents: [],
      items: [],
      memoryKv: {},
      coords: {
        lat: 37.775593,
        lng: -122.418137,
      },
      marker: null
    }));

    const currentClient = client.current;
    if (currentClient) {
      currentClient.disconnect();
    }

    const currentRecorder = recorder.current;
    if (currentRecorder?.getStatus() === 'recording') {
      await currentRecorder.end();
    }

    const currentStreamPlayer = streamPlayer.current;
    if (currentStreamPlayer) {
      await currentStreamPlayer.interrupt();
    }
  }, []);

  // Delete conversation item
  const deleteConversationItem = useCallback(async (id: string) => {
    if (!client.current) return;
    client.current.deleteItem(id);
  }, []);

  // Toggle content top display
  const toggleContentTopDisplay = useCallback(() => {
    if (uiRefs.contentTop.current) {
      const currentDisplay = window.getComputedStyle(uiRefs.contentTop.current).display;
      uiRefs.contentTop.current.style.display = currentDisplay === 'none' ? 'flex' : 'none';
    }
  }, []);

  // Toggle minimize
  const toggleMinimize = useCallback(() => {
    setState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
  }, []);

  // Toggle color control
  const toggleColorControl = useCallback(() => {
    setState(prev => ({ ...prev, isColorControlVisible: !prev.isColorControlVisible }));
  }, []);

  // Handle color change
  const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedColor = e.target.value;
    setState(prev => ({ ...prev, animationColor: selectedColor }));

    const rgbColor = new THREE.Color(selectedColor);
    if (uiRefs.shaderMaterial.current) {
      uiRefs.shaderMaterial.current.uniforms.u_color1.value.setRGB(
        rgbColor.r,
        rgbColor.g,
        rgbColor.b
      );
      uiRefs.shaderMaterial.current.uniforms.u_color2.value.setRGB(
        rgbColor.r,
        rgbColor.g,
        rgbColor.b
      );
    }
  }, []);

  // Handle sphere click
  const handleSphereClick = useCallback(async () => {
    if (!state.isAudioInitialized) {
      try {
        const newAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const listener = new THREE.AudioListener();
        const sound = new THREE.Audio(listener);
        const analyser = new THREE.AudioAnalyser(sound, 32);
        
        setState(prev => ({ 
          ...prev, 
          isAudioInitialized: true,
          audioContext: newAudioContext,
          sound,
          analyser
        }));
      } catch (error) {
        console.error("Error initializing audio:", error);
      }
    }
  }, [state.isAudioInitialized]);

  // Initialize audio
  const initializeAudio = useCallback(() => {
    if (!state.audioContext) {
      const newAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const listener = new THREE.AudioListener();
      const newSound = new THREE.Audio(listener);
      const newAnalyser = new THREE.AudioAnalyser(newSound, 32);

      setState(prev => ({
        ...prev,
        audioContext: newAudioContext,
        sound: newSound,
        analyser: newAnalyser
      }));

      const audioLoader = new THREE.AudioLoader();
      audioLoader.load('/static/Beats.mp3', (buffer) => {
        newSound.setBuffer(buffer);
        newSound.setLoop(true);
        newSound.setVolume(0.5);
      });
    }
  }, [state.audioContext]);

  // Handle start/pause
  const handleStartPause = useCallback(() => {
    initializeAudio();
    if (state.isPlaying && state.sound) {
      state.sound.pause();
    } else if (state.sound) {
      state.sound.play();
    }
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, [state.isPlaying, state.sound, initializeAudio]);

  // Handle message sending
  const handleSendMessage = useCallback(async () => {
    if (!client.current || !state.isConnected) {
      console.warn("Client is not connected. Message not sent.");
      return;
    }
  
    if (state.userMessage.trim() === '') return;

    try {
      // First send message to AI server
      const aiResponse = await sendMessage({
        message: state.userMessage,
        session_id: '123456789'
      });

      console.log("AI Server Response:", aiResponse);

      // Then send both the original message and AI response to OpenAI
      client.current.sendUserMessageContent([
        {
          type: 'input_text',
          text: state.userMessage,
        },
        {
          type: 'input_text',
          text: `AI Server Response: ${aiResponse.response.text} (Emotion: ${aiResponse.response.emotion})`,
        },
      ]);
  
      setState(prev => ({ ...prev, userMessage: '' }));
    } catch (error) {
      console.error("Error sending message:", error);
      // If AI server fails, still send original message to OpenAI
      client.current.sendUserMessageContent([
        {
          type: 'input_text',
          text: state.userMessage,
        },
      ]);
      setState(prev => ({ ...prev, userMessage: '' }));
    }
  }, [state.isConnected, state.userMessage]);

  /**
   * In push-to-talk mode, start recording
   * .appendInputAudio() for each sample
   */
  const startRecording = useCallback(async () => {
    setState(prev => ({ ...prev, isRecording: true }));
    
    const currentClient = client.current;
    const currentRecorder = recorder.current;
    const currentStreamPlayer = streamPlayer.current;

    if (!currentClient || !currentRecorder || !currentStreamPlayer) return;

    const trackSampleOffset = await currentStreamPlayer.interrupt();
    if (trackSampleOffset?.trackId) {
      const { trackId, offset } = trackSampleOffset;
      await currentClient.cancelResponse(trackId, offset);
    }
    
    await currentRecorder.record((data) => currentClient.appendInputAudio(data.mono));
  }, []);

  /**
   * In push-to-talk mode, stop recording
   */
  const stopRecording = useCallback(async () => {
    setState(prev => ({ ...prev, isRecording: false }));

    const currentClient = client.current;
    const currentRecorder = recorder.current;

    if (!currentClient || !currentRecorder) return;

    await currentRecorder.pause();
    currentClient.createResponse();
  }, []);

  // Handle turn end type change
  const changeTurnEndType = useCallback(async (value: string) => {
    if (!client.current || !recorder.current) return;
    
    if (value === 'none' && recorder.current.getStatus() === 'recording') {
      await recorder.current.pause();
    }
    
    client.current.updateSession({
      turn_detection: value === 'none' ? null : { type: 'server_vad' },
    });
    
    if (value === 'server_vad' && client.current.isConnected()) {
      await recorder.current.record((data) => client.current.appendInputAudio(data.mono));
    }
    
    setState(prev => ({ ...prev, canPushToTalk: value === 'none' }));
  }, []);

  return {
    state,
    setState,
    uiRefs,
    connectConversation,
    disconnectConversation,
    deleteConversationItem,
    toggleContentTopDisplay,
    toggleMinimize,
    toggleColorControl,
    handleColorChange,
    handleSphereClick,
    initializeAudio,
    handleStartPause,
    handleSendMessage,
    startRecording,
    stopRecording,
    changeTurnEndType
  };
};
