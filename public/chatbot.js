let mediaRecorder;
const audioChunks = [];
const apiKey = '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';
const chatApiUrl = 'https://api.openai.com/v1/chat/completions';
const transcriptionApiUrl = 'https://api.openai.com/v1/audio/transcriptions';
const ttsApiUrl = 'https://api.openai.com/v1/audio/speech'; // Text-to-Speech endpoint

document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('toggle-frame').addEventListener('click', () => {
        const chatContent = document.getElementById('chat-content');
        chatContent.classList.toggle('hidden');
        const buttonText = chatContent.classList.contains('hidden') ? 'Open Chat' : 'Close Chat';
        document.getElementById('toggle-frame').textContent = buttonText;
    });
    document.getElementById('start-recording').addEventListener('click', async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
    
        mediaRecorder.start();
        document.getElementById('start-recording').disabled = true;
        document.getElementById('stop-recording').disabled = false;
    
        // Show recording status
        recordingText.style.display = 'block';
    
        console.log("Starting recording...");
    
        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };
    
        mediaRecorder.onstop = async () => {
            console.log("Recording stopped.");
            recordingText.style.display = 'none';
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const formData = new FormData();
            formData.append('file', audioBlob, 'audio.wav');
            formData.append('model', 'whisper-1'); // Use the Whisper model for transcription
    
            try {
                const response = await fetch(transcriptionApiUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: formData
                });
    
                console.log("Transcription response:", response);   
    
                if (!response.ok) throw new Error('Error transcribing audio: ' + response.statusText);
                const transcription = await response.json();
                console.log("Transcription result:", transcription.text);
    
                appendMessage('You: ' + transcription.text);
                await sendMessageToBot(transcription.text); // Send transcription to bot
    
            } catch (error) {
                console.error(error);
                appendMessage('Error: ' + error.message);
            }
    
            audioChunks.length = 0;
            document.getElementById('start-recording').disabled = false;
            document.getElementById('stop-recording').disabled = true;
        };
    });

    document.getElementById('clear-chat').addEventListener('click', () => {
        const outputDiv = document.getElementById('chat-output');
        outputDiv.innerHTML = ''; // Clear all previous chat messages
    });
    
    document.getElementById('stop-recording').addEventListener('click', () => {
        mediaRecorder.stop();
    });
    
    document.getElementById('send-message').addEventListener('click', async () => {
        const userInput = document.getElementById('user-input').value;
        appendMessage('You: ' + userInput); // Display user input
        await sendMessageToBot(userInput); // Send user input to bot
        document.getElementById('user-input').value = ''; // Clear input field
    });
    
    
});

let recordingText = document.getElementById('recording-status');



async function sendMessageToBot(message) {
    const chatData = {
        model: "gpt-3.5-turbo", // Specify the OpenAI model
        messages: [
            { role: "user", content: message }
        ]
    };

    try {
        const response = await fetch(chatApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(chatData)
        });

        if (!response.ok) throw new Error('Error fetching chat response: ' + response.statusText);
        const chatResponse = await response.json();
        const botMessage = chatResponse.choices[0].message.content;
        appendMessage('Bot: ' + botMessage); // Adjust based on actual response structure

        // Call Text-to-Speech after receiving bot response
        await convertTextToSpeech(botMessage);

    } catch (error) {
        console.error(error);
        appendMessage('Error: ' + error.message);
    }
}

// Text-to-Speech function using OpenAI API
async function convertTextToSpeech(text) {
    const ttsData = {
        model: 'tts-1', // TTS model
        input: text, // Text to convert to speech
        voice: 'alloy', // Voice to use for TTS, choose from available options
        response_format: 'mp3' // Audio format (optional, default is mp3)
    };

    try {
        const response = await fetch(ttsApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ttsData)
        });

        if (!response.ok) throw new Error('Error generating speech: ' + response.statusText);
        
        const audioBlob = await response.blob(); // Get the audio as a blob
        const audioUrl = URL.createObjectURL(audioBlob); // Create a URL for the audio
        const audioElement = new Audio(audioUrl); // Create an audio element
        audioElement.play(); // Play the audio

        console.log("TTS Audio played successfully!");

    } catch (error) {
        console.error(error);
        appendMessage('Error: ' + error.message);
    }
}

function appendMessage(message) {
    const outputDiv = document.getElementById('chat-output');
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    outputDiv.appendChild(messageElement);
}