import { useEffect, useRef, useCallback, useState } from 'react';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';
import { WavRecorder, WavStreamPlayer } from '../lib/wavtools/index.js';
import { WavRenderer } from '../utils/wav_renderer';
import { X, Edit, Zap } from 'react-feather';
import { Button } from '../components/button/Button';
import { sendMessage } from '../utils/api';
import './VoiceChat.scss';

type Props = {
  scrapedContent: string;
};

interface AIResponse {
  id: string;
  role: 'assistant';
  text: string;
}

export const VoiceChat: React.FC<Props> = ({ scrapedContent }) => {
  const apiKey = localStorage.getItem('tmp::voice_api_key') || '';
  const [items, setItems] = useState<ItemType[]>([]);
  const [aiResponses, setAIResponses] = useState<AIResponse[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId] = useState(`session_${Date.now()}`);

  const wavRecorderRef = useRef<WavRecorder>(new WavRecorder({ sampleRate: 24000 }));
  
  // Initialize RealtimeClient with proper configuration
  const clientRef = useRef<RealtimeClient>(
    new RealtimeClient({
      apiKey: apiKey,
      dangerouslyAllowAPIKeyInBrowser: true,
      debug: true, // Enable debug mode for better error logging
      url: process.env.REACT_APP_WS_URL || 'ws://localhost:3001/ws'
    })
  );

  const resetAPIKey = useCallback(() => {
    const newApiKey = prompt('OpenAI API Key');
    if (newApiKey !== null) {
      localStorage.setItem('tmp::voice_api_key', newApiKey);
      window.location.reload();
    }
  }, []);

  const sendMessageToAIServer = async (text: string) => {
    try {
      const response = await sendMessage({
        message: text,
        session_id: sessionId
      });
      
      const newResponse: AIResponse = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        text: response.response.text
      };
      setAIResponses(prev => [...prev, newResponse]);
    } catch (error) {
      console.error('Error sending message to AI server:', error);
    }
  };

  const connectConversation = useCallback(async () => {
    try {
      const client = clientRef.current;
      const wavRecorder = wavRecorderRef.current;

      // Resume the AudioContext if it's suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Initialize audio recording first
      await wavRecorder.begin();

      // Then connect to the realtime API
      await client.connect();
      console.log('RealtimeAPI connected successfully');

      setIsConnected(true);
      setItems(client.conversation.getItems());

      // Send initial message after connection is established
      const initialMessage = "Hello!";
      await client.sendUserMessageContent([
        {
          type: 'input_text',
          text: initialMessage,
        },
      ]);
      await sendMessageToAIServer(initialMessage);

      if (client.getTurnDetectionType() === 'server_vad') {
        await wavRecorder.record((data) => {
          if (client.isConnected()) {
            client.appendInputAudio(data.mono);
          }
        });
      }
    } catch (error) {
      console.error('Error connecting:', error);
      setIsConnected(false);
      
      // Clean up on error
      try {
        const wavRecorder = wavRecorderRef.current;
        await wavRecorder.end();
        if (audioContext.state === 'running') {
          await audioContext.suspend();
        }
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
    }
  }, []);

  const disconnectConversation = useCallback(async () => {
    try {
      setIsConnected(false);
      setItems([]);
      setAIResponses([]);

      const client = clientRef.current;
      await client.disconnect();

      const wavRecorder = wavRecorderRef.current;
      await wavRecorder.end();

      // Suspend the AudioContext when not in use
      if (audioContext.state === 'running') {
        await audioContext.suspend();
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }, []);

  const deleteConversationItem = useCallback(async (id: string) => {
    const client = clientRef.current;
    client.deleteItem(id);
    setAIResponses(prev => prev.filter(response => response.id !== id));
  }, []);

  useEffect(() => {
    const client = clientRef.current;

    // Set up client configuration
    client.updateSession({ instructions: scrapedContent });
    client.updateSession({ input_audio_transcription: { model: 'whisper-1' } });
    client.updateSession({ voice: 'alloy' });

    // Set up event listeners
    const errorHandler = (event: any) => {
      console.error('RealtimeAPI error:', event);
      if (!client.isConnected()) {
        setIsConnected(false);
      }
    };

    const conversationHandler = async ({ item, delta }: any) => {
      const items = client.conversation.getItems();
      setItems(items);

      if (item && item.role === 'user' && item.formatted.text) {
        await sendMessageToAIServer(item.formatted.text);
      }
    };

    client.on('error', errorHandler);
    client.on('conversation.updated', conversationHandler);

    setItems(client.conversation.getItems());

    // Cleanup function
    return () => {
      client.off('error', errorHandler);
      client.off('conversation.updated', conversationHandler);
      client.reset();
      
      if (audioContext.state === 'running') {
        audioContext.suspend();
      }
    };
  }, [scrapedContent]);

  return (
    <div data-component="VoiceChat">
      <div className="content-top">
        <div className="content-title">
          <span>AI Voice Agent</span>
        </div>
        <div className="content-api-key">
          <Button
            icon={Edit}
            iconPosition="end"
            buttonStyle="flush"
            label={`api key: ${apiKey.slice(0, 3)}...`}
            onClick={resetAPIKey}
          />
        </div>
      </div>
      <div className="content-main">
        <div className="content-logs">
          {(items.length > 0 || aiResponses.length > 0) && (
            <div className="content-block conversation">
              <div className="content-block-body" data-conversation-content>
                {items.map((conversationItem) => (
                  <div className="conversation-item" key={conversationItem.id}>
                    <div className={`speaker ${conversationItem.role || ''}`}>
                      <div>
                        {(conversationItem.role || conversationItem.type).replaceAll('_', ' ')}
                      </div>
                      <div className="close" onClick={() => deleteConversationItem(conversationItem.id)}>
                        <X />
                      </div>
                    </div>
                    <div className={`speaker-content`}>
                      {conversationItem.formatted.transcript || conversationItem.formatted.text || '(truncated)'}
                    </div>
                  </div>
                ))}
                {aiResponses.map((response) => (
                  <div className="conversation-item" key={response.id}>
                    <div className={`speaker ${response.role}`}>
                      <div>
                        {response.role}
                      </div>
                      <div className="close" onClick={() => deleteConversationItem(response.id)}>
                        <X />
                      </div>
                    </div>
                    <div className={`speaker-content`}>
                      {response.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="content-actions">
            <Button
              label={isConnected ? 'Disconnect' : 'Connect'}
              iconPosition={isConnected ? 'end' : 'start'}
              icon={isConnected ? X : Zap}
              buttonStyle={isConnected ? 'regular' : 'action'}
              onClick={isConnected ? disconnectConversation : connectConversation}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
