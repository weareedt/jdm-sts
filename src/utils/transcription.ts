import OpenAI from 'openai';

// Initialize OpenAI client for Mesolitica
const mesoliticaClient = new OpenAI({
    baseURL: 'https://api.mesolitica.com',
    dangerouslyAllowBrowser: true ,
    apiKey: process.env.MESOLITICA_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IndlYXJlZWR0QGdtYWlsLmNvbSIsInV1aWQiOiIwNmRmYmY3My1mMjIzLTQ1MDgtYTY5OC1kMTExMWM2YTI4YjEifQ.Iz5z2MaI9SI7w8KaNzBEzTZ3HizmZT8jNHBecCh9Mdc',
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
            language: options.language || 'ms',
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.MESOLITICA_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IndlYXJlZWR0QGdtYWlsLmNvbSIsInV1aWQiOiIwNmRmYmY3My1mMjIzLTQ1MDgtYTY5OC1kMTExMWM2YTI4YjEifQ.Iz5z2MaI9SI7w8KaNzBEzTZ3HizmZT8jNHBecCh9Mdc'}`,
                'Content-Type': 'multipart/form-data',
            },
            
        });

        return transcription;
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
    // Create WAV header
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    
    // "RIFF" chunk descriptor
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + buffer.length * 2, true); // file size
    view.setUint32(8, 0x57415645, false); // "WAVE"
    
    // "fmt " sub-chunk
    view.setUint32(12, 0x666D7420, false); // "fmt "
    view.setUint32(16, 16, true); // subchunk size
    view.setUint16(20, 1, true); // PCM = 1
    view.setUint16(22, 1, true); // mono = 1 channel
    view.setUint32(24, 24000, true); // sample rate
    view.setUint32(28, 24000 * 2, true); // byte rate
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    
    // "data" sub-chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, buffer.length * 2, true); // data size
    
    // Combine header and audio data
    const audioData = new Int16Array(buffer);
    const blob = new Blob([wavHeader, audioData], { type: 'audio/wav' });
    
    return blob;
};
