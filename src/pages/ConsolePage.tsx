import React, { useCallback, useEffect, useState } from 'react';
import './ConsolePage.scss';

// Hooks
import { useConversation } from '../hooks/useConversation';
import { useAudio } from '../hooks/useAudio';
import { useVisualization } from '../hooks/useVisualization';
import { useWebcam } from '../hooks/useWebcam';

// Components
import { ControlPanel } from '../components/console/ControlPanel';
import { Visualization } from '../components/console/Visualization';
import { ActionControls } from '../components/console/ActionControls';
import { WebcamComponent } from '../components/console/Webcam';
import { ChatInput } from '../components/console/ChatWindow';

const LOCAL_RELAY_SERVER_URL = process.env.REACT_APP_LOCAL_RELAY_SERVER_URL || '';

export const ConsolePage: React.FC = () => {
  // State for user message
  const [userMessage, setUserMessage] = useState('');

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
    changeTurnEndType,
  } = useConversation(apiKey, LOCAL_RELAY_SERVER_URL);

  const { initializeAudio, handleStartPause } = useAudio();
  const { shaderMaterialRef } = useVisualization(uiRefs.mount, state.animationColor);
  const { isWebcamEnabled, webcamError, checkWebcamPermissions } = useWebcam();

  // Handle message changes
  const handleMessageChange = useCallback((message: string) => {
    setUserMessage(message);
  }, []);

  // Handle message sending
  const handleMessageSend = useCallback(() => {
    console.log('Message Sent:', userMessage);
    setUserMessage(''); // Clear the input field after sending
  }, [userMessage]);

  // Reset API Key
  const handleResetApiKey = useCallback(() => {
    const newApiKey = prompt('OpenAI API Key');
    if (newApiKey) {
      localStorage.clear();
      localStorage.setItem('tmp::voice_api_key', newApiKey);
      window.location.reload();
    }
  }, []);

  // Toggle visibility of content top
  const handleContentTopToggle = useCallback(() => {
    if (uiRefs.contentTop.current) {
      const currentDisplay = window.getComputedStyle(uiRefs.contentTop.current).display;
      uiRefs.contentTop.current.style.display = currentDisplay === 'none' ? 'flex' : 'none';
    }
  }, [uiRefs.contentTop]);

  // Keyboard Event Handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleContentTopToggle();
        setState((prev) => ({
          ...prev,
          isColorControlVisible: !prev.isColorControlVisible,
        }));
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
        <WebcamComponent />
        <Visualization mountRef={uiRefs.mount} items={state.items} />
        <ChatInput
          userMessage={userMessage}
          onMessageChange={handleMessageChange}
          onMessageSend={handleMessageSend}
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
  );
};

export default ConsolePage;
