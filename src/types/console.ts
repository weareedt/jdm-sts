import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';
import * as THREE from 'three';

export interface Coordinates {
  lat: number;
  lng: number;
  location?: string;
  temperature?: {
    value: number;
    units: string;
  };
  wind_speed?: {
    value: number;
    units: string;
  };
}

export interface RealtimeEvent {
  time: string;
  source: 'client' | 'server';
  count?: number;
  event: { [key: string]: any };
}

export interface ConsoleState {
  userMessage: string;
  items: ItemType[];
  realtimeEvents: RealtimeEvent[];
  expandedEvents: { [key: string]: boolean };
  isConnected: boolean;
  canPushToTalk: boolean;
  isRecording: boolean;
  memoryKv: { [key: string]: any };
  coords: Coordinates | null;
  marker: Coordinates | null;
  audioData: Uint8Array;
  isMinimized: boolean;
  isColorControlVisible: boolean;
  animationColor: string;
  startTime: string;
  eventsScrollHeight: number;
  // Audio state properties
  audioContext: AudioContext | null;
  sound: THREE.Audio | null;
  analyser: THREE.AudioAnalyser | null;
  isPlaying: boolean;
  isAudioInitialized: boolean;
}

export interface UIRefs {
  contentTop: React.RefObject<HTMLDivElement>;
  clientCanvas: React.RefObject<HTMLCanvasElement>;
  serverCanvas: React.RefObject<HTMLCanvasElement>;
  eventsScroll: React.RefObject<HTMLDivElement>;
  mount: React.RefObject<HTMLDivElement>;
  shaderMaterial: React.RefObject<THREE.ShaderMaterial>;
}

// Component Props
export interface ControlPanelProps {
  apiKey: string;
  isLocalRelay: boolean;
  isConnected: boolean;
  onResetApiKey: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  contentTopRef: React.RefObject<HTMLDivElement>;
}

export interface VisualizationProps {
  mountRef: React.RefObject<HTMLDivElement>;
  items: ItemType[];
}

export interface ChatWindowProps {
  isMinimized: boolean;
  items: ItemType[];
  userMessage: string;
  onMinimizeToggle: () => void;
  onMessageChange: (message: string) => void;
  onMessageSend: () => void;
  onDeleteItem: (id: string) => void;
}

export interface ActionControlsProps {
  isConnected: boolean;
  canPushToTalk: boolean;
  isRecording: boolean;
  onTurnEndTypeChange: (value: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

// Hook Return Types
export interface UseConversationReturn {
  state: ConsoleState;
  setState: React.Dispatch<React.SetStateAction<ConsoleState>>;
  uiRefs: UIRefs;
  connectConversation: () => Promise<void>;
  disconnectConversation: () => Promise<void>;
  deleteConversationItem: (id: string) => Promise<void>;
  toggleContentTopDisplay: () => void;
  toggleMinimize: () => void;
  toggleColorControl: () => void;
  handleColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSphereClick: () => Promise<void>;
  initializeAudio: () => void;
  handleStartPause: () => void;
  handleSendMessage: () => void;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  changeTurnEndType: (value: string) => Promise<void>;
}

export interface UseVisualizationReturn {
  shaderMaterialRef: React.RefObject<THREE.ShaderMaterial>;
}
