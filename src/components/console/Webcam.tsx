import React from 'react';
import Webcam from 'react-webcam';
import { useWebcam } from '../../hooks/useWebcam';

export const WebcamComponent: React.FC = () => {
  const { isWebcamEnabled, webcamError } = useWebcam();

  return (
    <div className="webcam-container">
      {isWebcamEnabled ? (
        <Webcam
          audio={false}
          style={{ width: "100%", height: "100%" }} // Automatically adjusts to container size
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: 'user',
            width: { ideal: 240 },
            height: { ideal: 320 },
          }}
        />
      ) : (
        <div style={{ color: 'red' }}>
          {webcamError || 'Webcam is not enabled'}
        </div>
      )}
    </div>
  );
};

export default WebcamComponent;
