import React, { useEffect, useState } from 'react';
import { X } from 'react-feather';
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';
import chatIcon from '../../assets/topic.svg';
import sendIcon from '../../assets/send.svg';
import micIcon from '../../assets/mic.svg';

interface ChatInputProps {
  items: ItemType[];
  userMessage: string;
  onMessageChange: (message: string) => void;
  onMessageSend: () => void;
  onDeleteItem: (id: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isConnected: boolean;
  canPushToTalk: boolean;
  isRecording: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  items,
  userMessage,
  onMessageChange,
  onMessageSend,
  onStartRecording,
  onStopRecording,
  isConnected,
  canPushToTalk,
  isRecording,
}) => {
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const userItems = items.filter(item => item.role !== 'assistant');
  const assistantItems = items.filter(item => item.role === 'assistant');

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth >= 426 && window.innerWidth <= 785);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`chat-input ${isSmallScreen ? 'small-screen' : ''}`}>
      <textarea
        placeholder="Apa itu pendigitalan?"
        value={userMessage}
        onChange={(e) => onMessageChange(e.target.value)}
        onFocus={(e) => e.target.classList.add('focused')}
        onBlur={(e) => e.target.classList.remove('focused')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onMessageSend();
          }
        }}
        className={`input-field`}
        rows={4}
      />
      <button
        onClick={onMessageSend}
        className={`send-button ${isSmallScreen ? 'button-small' : ''}`}
      >
        <img src={sendIcon} alt="Send" style={{ width: '24px', height: '24px' }} />
      </button>
      {isConnected && canPushToTalk && (
        <button
          className="push-to-talk"
          onMouseDown={onStartRecording}
          onMouseUp={onStopRecording}
          disabled={!isConnected || !canPushToTalk}
        >
          <img src={micIcon} alt="Mic" style={{ width: '24px', height: '24px' }} />
        </button>
      )}
    </div>
  );
};




  
  