import React, { useEffect, useState } from 'react';

interface ChatInputProps {
  userMessage: string;
  onMessageChange: (message: string) => void;
  onMessageSend: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  userMessage,
  onMessageChange,
  onMessageSend,
}) => {
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Handle responsiveness for the input field
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
  );
};
