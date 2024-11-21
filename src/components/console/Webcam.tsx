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
          height={320}
          width={240}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: 'user',
            width: { ideal: 240 }, // Width for portrait
            height: { ideal: 320 }, // Height for portrait
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
