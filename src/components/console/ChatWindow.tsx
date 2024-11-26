import React, { useEffect, useState } from 'react';
import { X } from 'react-feather';
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';
import chatIcon from '../../assets/topic.svg';

interface ChatInputProps {
  isMinimized: boolean;
  items: ItemType[];
  userMessage: string;
  onMinimizeToggle: () => void;
  onMessageChange: (message: string) => void;
  onMessageSend: () => void;
  onDeleteItem: (id: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  isMinimized,
  items,
  userMessage,
  onMinimizeToggle,
  onMessageChange,
  onMessageSend,
  onDeleteItem
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
    <div className={`chat-window ${isMinimized ? 'minimized' : ''}`}>
      <div className="chat-header" onClick={onMinimizeToggle}>
        <img src={chatIcon} alt="Topic Icon" className="topic-icon"/>
        {!isMinimized && <div className="header-title">Chat</div>}
        <div className="header-controls">
          <button className="triangle-button">
            {isMinimized ? '' : 'Min'}
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <div className="chat-content">
          <div className="content-block-title">Conversation</div>
          <div className="content-block-body" data-conversation-content>
            {!items.length && `awaiting connection..`}
            {userItems.map((conversationItem) => (
              <div className="conversation-item" key={conversationItem.id}>
                <div className={`speaker ${conversationItem.role || ''}`}>
                  <div>
                    {(conversationItem.role || conversationItem.type).replaceAll('_', ' ')}
                  </div>
                  <div
                    className="close"
                    onClick={() => onDeleteItem(conversationItem.id)}
                  >
                    <X />
                  </div>
                </div>
                <div className={`speaker-content`} style={{ color: 'white' }}>
                  {conversationItem.type === 'function_call_output' && (
                    <div>{conversationItem.formatted.output}</div>
                  )}
                  {!!conversationItem.formatted.tool && (
                    <div>
                      {conversationItem.formatted.tool.name}(
                      {conversationItem.formatted.tool.arguments})
                    </div>
                  )}
                  {!conversationItem.formatted.tool &&
                    conversationItem.role === 'user' && (
                      <div>
                        {conversationItem.formatted.transcript ||
                          (conversationItem.formatted.audio?.length
                            ? '(awaiting transcript)'
                            : conversationItem.formatted.text || '(item sent)')}
                      </div>
                    )}
                </div>
              </div>
            ))}
            {assistantItems.map((conversationItem) => (
              <div className="conversation-item" key={conversationItem.id}>
                <div className={`speaker ${conversationItem.role}`}>
                  <div>
                    {conversationItem.role}
                  </div>
                  <div
                    className="close"
                    onClick={() => onDeleteItem(conversationItem.id)}
                  >
                    <X />
                  </div>
                </div>
                <div className={`speaker-content`} style={{ color: 'white' }}>
                  <div>
                    {conversationItem.formatted.transcript ||
                      conversationItem.formatted.text || '(truncated)'}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className={`chat-input ${isSmallScreen ? 'small-screen' : ''}`}>
      <input
        type="text"
        placeholder="Type your message..."
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
        Send
      </button>
    </div>
    </div>
      )}
    </div>
  );
};




  
  