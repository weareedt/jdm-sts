import OpenAI from 'openai';

export interface MesoliticaTranscriptionParams {
  file: File;
  model: 'base';
  language: 'ms';
}

export type MesoliticaClient = Omit<OpenAI, 'audio'> & {
  audio: {
    transcriptions: {
      create(params: MesoliticaTranscriptionParams): Promise<OpenAI.Audio.Transcription>;
    };
  };
};
