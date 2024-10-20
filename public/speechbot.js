// const apiKey = 'apiKey'; // Replace with your actual OpenAI API key
// const url = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`;

// const socket = new WebSocket(url, [], {
//   headers: {
//     'Authorization': `Bearer ${apiKey}`,
//     'OpenAI-Beta': 'realtime=v1',
//   }
// });

// socket.onopen = function(event) {
//   console.log("WebSocket is open now.");
  
//   // You can start sending messages to the server once the connection is open
//   socket.send(JSON.stringify({
//     message: "Hello GPT-4 Realtime!"
//   }));
// };

// socket.onmessage = function(event) {
//   console.log("Message from server ", event.data);
  
//   // Handle the real-time response from GPT-4 here
// };

// socket.onerror = function(error) {
//   console.log("WebSocket Error: ", error);
// };

// socket.onclose = function(event) {
//   console.log("WebSocket is closed now.");
// };
