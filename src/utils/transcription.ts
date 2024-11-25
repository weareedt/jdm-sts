import OpenAI from 'openai';

// Initialize OpenAI client for Mesolitica
const mesoliticaClient = new OpenAI({
    baseURL: 'https://api.mesolitica.com',
    apiKey: process.env.MESOLITICA_API_KEY || '',
    dangerouslyAllowBrowser: true  // Enable browser usage
});

// Initialize OpenAI client for OpenAI services (TTS)
const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
    dangerouslyAllowBrowser: true  // Enable browser usage
});

interface TranscriptionOptions {
    language?: string;
    model?: string;
}

export const transcribeAudioMesolitica = async (audioBlob: Blob, options: TranscriptionOptions = {}) => {
    try {
        // Convert Blob to File
        const file = new File([audioBlob], 'audio.wav', { type: 'audio/wav' });
        
        const transcription = await mesoliticaClient.audio.transcriptions.create({
            file,
            model: options.model || 'base',
            language: options.language || 'ms'
        });

        return transcription.text;
    } catch (error) {
        console.error('Mesolitica transcription error:', error);
        throw error;
    }
};

export const transcribeAudioOpenAI = async (audioBlob: Blob, options: TranscriptionOptions = {}) => {
    try {
        // Convert Blob to File
        const file = new File([audioBlob], 'audio.wav', { type: 'audio/wav' });
        
        const transcription = await openaiClient.audio.transcriptions.create({
            file,
            model: options.model || 'whisper-1',
            language: options.language
        });

        return transcription.text;
    } catch (error) {
        console.error('OpenAI transcription error:', error);
        throw error;
    }
};

// Helper function to convert audio buffer to blob
export const audioBufferToBlob = (buffer: Int16Array): Blob => {
    return new Blob([buffer], { type: 'audio/wav' });
};
