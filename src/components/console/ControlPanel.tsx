import React from 'react';
import { Edit, X, Zap } from 'react-feather';
import { Button } from '../button/Button';

interface ControlPanelProps {
  apiKey: string;
  isLocalRelay: boolean;
  isConnected: boolean;
  onResetApiKey: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  contentTopRef: React.RefObject<HTMLDivElement>;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  apiKey,
  isLocalRelay,
  isConnected,
  onResetApiKey,
  onConnect,
  onDisconnect,
  contentTopRef
}) => {
  return (
    <div className="content-top" ref={contentTopRef} style={{ maxHeight: '60px', overflow: 'hidden' }}>
      <div className="content-api-key">
        {!isLocalRelay && (
          <Button
            icon={Edit}
            iconPosition="end"
            buttonStyle="flush"
            label={`api key: ${apiKey.slice(0, 3)}...`}
            onClick={onResetApiKey}
          />
        )}
      </div>
      
      <div className="action-button" style={{ position: 'absolute', top: '10px', right: '16px' }}>
        <Button
          icon={isConnected ? X : Zap}
          iconPosition={isConnected ? 'end' : 'start'}
          buttonStyle={isConnected ? 'regular' : 'action'}
          label={isConnected ? 'disconnect' : 'connect'}
          onClick={isConnected ? onDisconnect : onConnect}
        />
      </div>
    </div>
  );
};
