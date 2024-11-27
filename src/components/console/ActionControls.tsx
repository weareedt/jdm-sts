import React from 'react';
import { Button } from '../button/Button';
import { Toggle } from '../toggle/Toggle';

interface ActionControlsProps {
  isConnected: boolean;
  canPushToTalk: boolean;
  isRecording: boolean;
  isColorControlVisible?: boolean;
  onTurnEndTypeChange: (value: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export const ActionControls: React.FC<ActionControlsProps> = ({
  isConnected,
  canPushToTalk,
  isRecording,
  isColorControlVisible = true,
  onTurnEndTypeChange,
  onStartRecording,
  onStopRecording
}) => {
  return (
    <div className="content-actions">
      <div className="toggle-container">
        {isColorControlVisible && (
          <Toggle
            defaultValue={false}
            labels={['manual', 'vad']}
            values={['none', 'server_vad']}
            onChange={(_, value) => onTurnEndTypeChange(value)}
          />
        )}
      </div>
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
