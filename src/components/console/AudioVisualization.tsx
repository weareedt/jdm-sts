import React, { useEffect, useRef } from 'react';
import { WavRenderer } from '../../utils/wav_renderer';

interface AudioVisualizationProps {
  wavRecorder: any;
  wavStreamPlayer: any;
}

export const AudioVisualization: React.FC<AudioVisualizationProps> = ({
  wavRecorder,
  wavStreamPlayer,
}) => {
  const clientCanvasRef = useRef<HTMLCanvasElement>(null);
  const serverCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let isLoaded = true;

    const clientCanvas = clientCanvasRef.current;
    let clientCtx: CanvasRenderingContext2D | null = null;

    const serverCanvas = serverCanvasRef.current;
    let serverCtx: CanvasRenderingContext2D | null = null;

    const render = () => {
      if (isLoaded) {
        if (clientCanvas) {
          if (!clientCanvas.width || !clientCanvas.height) {
            clientCanvas.width = clientCanvas.offsetWidth;
            clientCanvas.height = clientCanvas.offsetHeight;
          }
          clientCtx = clientCtx || clientCanvas.getContext('2d');
          if (clientCtx) {
            clientCtx.clearRect(0, 0, clientCanvas.width, clientCanvas.height);
            const result = wavRecorder.recording
              ? wavRecorder.getFrequencies('voice')
              : { values: new Float32Array([0]) };
            WavRenderer.drawBars(
              clientCanvas,
              clientCtx,
              result.values,
              '#00000000',
              0,
              0,
              0
            );
          }
        }
        if (serverCanvas) {
          if (!serverCanvas.width || !serverCanvas.height) {
            serverCanvas.width = serverCanvas.offsetWidth;
            serverCanvas.height = serverCanvas.offsetHeight;
          }
          serverCtx = serverCtx || serverCanvas.getContext('2d');
          if (serverCtx) {
            serverCtx.clearRect(0, 0, serverCanvas.width, serverCanvas.height);
            const result = wavStreamPlayer.analyser
              ? wavStreamPlayer.getFrequencies('voice')
              : { values: new Float32Array([0]) };
            WavRenderer.drawBars(
              serverCanvas,
              serverCtx,
              result.values,
              '#00000000',
              0,
              0,
              0
            );
          }
        }
        window.requestAnimationFrame(render);
      }
    };
    render();

    return () => {
      isLoaded = false;
    };
  }, [wavRecorder, wavStreamPlayer]);

  return (
    <div className="audio-visualization">
      <canvas
        ref={clientCanvasRef}
        className="client-canvas"
        style={{
          width: '100%',
          height: '50px',
          marginBottom: '10px'
        }}
      />
      <canvas
        ref={serverCanvasRef}
        className="server-canvas"
        style={{
          width: '100%',
          height: '50px'
        }}
      />
    </div>
  );
};
