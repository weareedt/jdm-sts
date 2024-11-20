import * as THREE from 'three';
import { WavRecorder, WavStreamPlayer } from '../../lib/wavtools/index.js';

export const initializeAudioContext = async () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    return { audioContext, analyser, source };
  } catch (error) {
    console.error("Error accessing the microphone", error);
    throw error;
  }
};

export const createAudioVisualizer = (
  wavRecorder: WavRecorder,
  wavStreamPlayer: WavStreamPlayer,
  clientCanvas: HTMLCanvasElement,
  serverCanvas: HTMLCanvasElement
) => {
  let clientCtx: CanvasRenderingContext2D | null = null;
  let serverCtx: CanvasRenderingContext2D | null = null;

  const setupCanvas = (canvas: HTMLCanvasElement) => {
    if (!canvas.width || !canvas.height) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    return canvas.getContext('2d');
  };

  const render = () => {
    if (clientCanvas) {
      clientCtx = clientCtx || setupCanvas(clientCanvas);
      if (clientCtx) {
        clientCtx.clearRect(0, 0, clientCanvas.width, clientCanvas.height);
        const result = wavRecorder.recording
          ? wavRecorder.getFrequencies('voice')
          : { values: new Float32Array([0]) };
        drawBars(clientCanvas, clientCtx, result.values, '#0099ff', 10, 0, 8);
      }
    }

    if (serverCanvas) {
      serverCtx = serverCtx || setupCanvas(serverCanvas);
      if (serverCtx) {
        serverCtx.clearRect(0, 0, serverCanvas.width, serverCanvas.height);
        const result = wavStreamPlayer.analyser
          ? wavStreamPlayer.getFrequencies('voice')
          : { values: new Float32Array([0]) };
        drawBars(serverCanvas, serverCtx, result.values, '#009900', 10, 0, 8);
      }
    }
  };

  return { render };
};

export const drawBars = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  values: Float32Array,
  color: string,
  barWidth: number,
  spacing: number,
  scale: number
) => {
  const width = canvas.width;
  const height = canvas.height;
  const bars = Math.floor(width / (barWidth + spacing));
  const step = Math.floor(values.length / bars);

  ctx.fillStyle = color;
  for (let i = 0; i < bars; i++) {
    const value = values[i * step];
    const barHeight = value * height * scale;
    const x = i * (barWidth + spacing);
    const y = (height - barHeight) / 2;
    ctx.fillRect(x, y, barWidth, barHeight);
  }
};

export const initializeAudioForMusic = (audioContext: AudioContext, listener: THREE.AudioListener) => {
  const sound = new THREE.Audio(listener);
  const analyser = new THREE.AudioAnalyser(sound, 32);

  const audioLoader = new THREE.AudioLoader();
  audioLoader.load('/static/Beats.mp3', (buffer) => {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.5);
  });

  return { sound, analyser };
};
