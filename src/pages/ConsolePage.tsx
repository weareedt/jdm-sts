import React, { useCallback, useEffect, useRef } from 'react';
import './ConsolePage.scss';

// Hooks
import { useConversation } from '../hooks/useConversation';
import { useAudio } from '../hooks/useAudio';
import { useVisualization } from '../hooks/useVisualization';
import { WavRecorder, WavStreamPlayer } from '../lib/wavtools/index.js';

// Components
import { ControlPanel } from '../components/console/ControlPanel';
import { Visualization } from '../components/console/Visualization';
import { ChatWindow } from '../components/console/ChatWindow';
import { ActionControls } from '../components/console/ActionControls';

const LOCAL_RELAY_SERVER_URL = process.env.REACT_APP_LOCAL_RELAY_SERVER_URL || '';

export function ConsolePage() {
  // Audio refs
  const recorder = useRef<WavRecorder | null>(null);
  const streamPlayer = useRef<WavStreamPlayer>(new WavStreamPlayer({ sampleRate: 24000 }));

  // API Key Management
  const getApiKey = useCallback(() => {
    if (LOCAL_RELAY_SERVER_URL) return '';
    
    const storedKey = localStorage.getItem('tmp::voice_api_key');
    if (storedKey) return storedKey;
    
    const promptedKey = prompt('OpenAI API Key');
    if (promptedKey) {
      localStorage.setItem('tmp::voice_api_key', promptedKey);
      return promptedKey;
    }
    
    return '';
  }, []);

  const apiKey = getApiKey();

  // Initialize hooks
  const {
    state,
    setState,
    uiRefs,
    connectConversation,
    disconnectConversation,
    handleSendMessage,
    startRecording,
    stopRecording,
    changeTurnEndType
  } = useConversation(apiKey, LOCAL_RELAY_SERVER_URL);

  const { initializeAudio, handleStartPause } = useAudio();
  const { shaderMaterialRef } = useVisualization(uiRefs.mount, state.animationColor);

  // Event Handlers
  const handleResetApiKey = useCallback(() => {
    const newApiKey = prompt('OpenAI API Key');
    if (newApiKey) {
      localStorage.clear();
      localStorage.setItem('tmp::voice_api_key', newApiKey);
      window.location.reload();
    }
  }, []);

  const handleMinimizeToggle = useCallback(() => {
    setState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
  }, [setState]);

  const handleContentTopToggle = useCallback(() => {
    if (uiRefs.contentTop.current) {
      const currentDisplay = window.getComputedStyle(uiRefs.contentTop.current).display;
      uiRefs.contentTop.current.style.display = currentDisplay === 'none' ? 'flex' : 'none';
    }
  }, [uiRefs.contentTop]);

  const handleMessageChange = useCallback((message: string) => {
    setState(prev => ({ ...prev, userMessage: message }));
  }, [setState]);

  const handleDeleteItem = useCallback((id: string) => {
    if (state.isConnected) {
      setState(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id)
      }));
    }
  }, [state.isConnected, setState]);

  // Keyboard Event Handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleContentTopToggle();
        setState(prev => ({ ...prev, isColorControlVisible: !prev.isColorControlVisible }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleContentTopToggle, setState]);

  return (
    <div data-component="ConsolePage">
      <ControlPanel
        apiKey={apiKey}
        isLocalRelay={!!LOCAL_RELAY_SERVER_URL}
        isConnected={state.isConnected}
        onResetApiKey={handleResetApiKey}
        onConnect={connectConversation}
        onDisconnect={disconnectConversation}
        contentTopRef={uiRefs.contentTop}
      />

      <div className="content-main">
        <div className="content-logs">
          <Visualization
            mountRef={uiRefs.mount}
            items={state.items}
            wavRecorder={recorder.current}
            wavStreamPlayer={streamPlayer.current}
          />

          <ChatWindow
            isMinimized={state.isMinimized}
            items={state.items}
            userMessage={state.userMessage}
            onMinimizeToggle={handleMinimizeToggle}
            onMessageChange={handleMessageChange}
            onMessageSend={handleSendMessage}
            onDeleteItem={handleDeleteItem}
          />

          <ActionControls
            isConnected={state.isConnected}
            canPushToTalk={state.canPushToTalk}
            isRecording={state.isRecording}
            onTurnEndTypeChange={changeTurnEndType}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
          />
        </div>
      </div>
    </div>
  );
}
