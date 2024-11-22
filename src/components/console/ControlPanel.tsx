import React, { useState, useEffect } from 'react';
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
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth >= 426 && window.innerWidth <= 785);
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="content-top" ref={contentTopRef} style={{ maxHeight: '60px', overflow: 'hidden' }}>
      <div className="content-api-key">
        {!isLocalRelay && (
          <Button
            icon={Edit}
            iconPosition="end"
            buttonStyle="flush"
            label={isSmallScreen ? '' : `api key: ${apiKey.slice(0, 3)}...`}
            onClick={onResetApiKey}
          />
        )}
      </div>

      <div className="action-button" style={{ position: 'absolute', top: '10px', right: '16px' }}>
        <Button
          icon={Zap}
          iconPosition={'end'}
          buttonStyle={isConnected ? 'regular' : 'action'}
          label={isSmallScreen ? '' : isConnected ? 'Disconnect' : 'Connect'}
          onClick={isConnected ? onDisconnect : onConnect}
        />
      </div>
    </div>
  );
};
