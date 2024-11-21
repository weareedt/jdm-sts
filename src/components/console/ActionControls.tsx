import React, { useState, useEffect } from 'react';
import { Button } from '../button/Button';
import { Toggle } from '../toggle/Toggle';

interface ActionControlsProps {
  isConnected: boolean;
  canPushToTalk: boolean;
  isRecording: boolean;
  onTurnEndTypeChange: (value: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export const ActionControls: React.FC<ActionControlsProps> = ({
  isConnected,
  canPushToTalk,
  isRecording,
  onTurnEndTypeChange,
  onStartRecording,
  onStopRecording
}) => {
  const [isToggleVisible, setIsToggleVisible] = useState(true);

  // Keyboard Event Handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsToggleVisible((prev) => !prev); // Toggle visibility
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="content-actions">
      {isToggleVisible && (
        <div className="toggle-container">
          <Toggle
            defaultValue={false}
            labels={['manual', 'vad']}
            values={['none', 'server_vad']}
            onChange={(_, value) => onTurnEndTypeChange(value)}
          />
        </div>
      )}
      <div className="spacer" />
      {isConnected && canPushToTalk && (
        <Button
          className="push-to-talk"
          label={isRecording ? '' : ''}
          buttonStyle={isRecording ? 'alert' : 'regular'}
          disabled={!isConnected || !canPushToTalk}
          onMouseDown={onStartRecording}
          onMouseUp={onStopRecording}
        />
      )}
      <div className="spacer" />
    </div>
  );
};
