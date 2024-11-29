import React from 'react';
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
  isRecording,
  isColorControlVisible = true,
  onTurnEndTypeChange,
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
    </div>
  );
};
