import { useState, useEffect, useCallback } from 'react';

export const useWebcam = () => {
  const [isWebcamEnabled, setIsWebcamEnabled] = useState(false);
  const [webcamError, setWebcamError] = useState('');

  const checkWebcamPermissions = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setIsWebcamEnabled(true);
      setWebcamError(''); // Clear any previous error
    } catch (error) {
      setIsWebcamEnabled(false);
      setWebcamError('Unable to access webcam. Please check your permissions.');
    }
  }, []);

  useEffect(() => {
    checkWebcamPermissions();
  }, [checkWebcamPermissions]);

  return { isWebcamEnabled, webcamError, checkWebcamPermissions };
};