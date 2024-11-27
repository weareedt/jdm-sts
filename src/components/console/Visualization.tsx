import React from 'react';
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';
import { AudioVisualization } from './AudioVisualization';

interface VisualizationProps {
  mountRef: React.RefObject<HTMLDivElement>;
  items: any[];
  wavRecorder?: any;
  wavStreamPlayer?: any;
  waitingForCommand?: boolean;
}

export const Visualization: React.FC<VisualizationProps> = ({
  mountRef,
  items,
  wavRecorder,
  wavStreamPlayer,
  waitingForCommand,
}) => {
  return (
    <div className="content-block events">
      <div
        className="visualization"
        ref={mountRef}
        style={{
          width: '100%',
          height: '100%',
        }}
      >

        {/* Canvas-based audio visualization */}
        {wavRecorder && wavStreamPlayer && (
          <AudioVisualization
            wavRecorder={wavRecorder}
            wavStreamPlayer={wavStreamPlayer}
          />
        )}

        {/* Overlay log for the assistant's latest message */}
        {items.length > 0 && (
          <div className="overlay-log assistant-log">
            {items.filter((item) => item.role === 'assistant').slice(-1)[0]
              ?.formatted.transcript ||
              items.filter((item) => item.role === 'assistant').slice(-1)[0]
                ?.formatted.text ||
              '(No assistant response)'}
          </div>
        )}

        {/* Overlay log for the user's latest transcript */}
        {items.length > 0 && (
          <div className="overlay-log user-log">
            {items.filter((item) => item.role === 'user').slice(-1)[0]
              ?.formatted.transcript ||
              items.filter((item) => item.role === 'user').slice(-1)[0]
                ?.content?.[0].text ||
              '(No user input)'}
          </div>
        )}
      </div>
    </div>
  );
};
