import React, { useEffect, useState } from 'react';
import { X } from 'react-feather';
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';
import chatIcon from '../../assets/topic.svg';

interface ChatInputProps {
  items: ItemType[];
  userMessage: string;
  onMessageChange: (message: string) => void;
  onMessageSend: () => void;
  onDeleteItem: (id: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  items,
  userMessage,
  onMessageChange,
  onMessageSend,

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
  
      <div className={`chat-input ${isSmallScreen ? 'small-screen' : ''}`} style={{ position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)' }}>
        <input
          type="text"
          placeholder="Apa itu pendigitalan?"
          value={userMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onMessageSend();
          }}
          className={`input-field ${isSmallScreen ? 'input-small' : ''}`}
        />
        <button
          onClick={onMessageSend}
          className={`send-button ${isSmallScreen ? 'button-small' : ''}`}
        >
          Hantar
        </button>
      </div>
  );
};




  
  