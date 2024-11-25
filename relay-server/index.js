import { RealtimeRelay } from './lib/relay.js';
import https from 'https';
import http from 'http';
import dotenv from 'dotenv';
dotenv.config({ override: true });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error(
    `Environment variable "OPENAI_API_KEY" is required.\n` +
      `Please set it in your .env file.`
  );
  process.exit(1);
}

const WS_PORT = parseInt(process.env.WS_PORT) || 8081;
const HTTP_PORT = 3001;

// Set up WebSocket relay for OpenAI
const relay = new RealtimeRelay(OPENAI_API_KEY);
relay.listen(WS_PORT);

// Set up HTTP server for AI server proxy
const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
      'Access-Control-Max-Age': '86400'
    });
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/forward_message') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const options = {
        hostname: 'aishah.jdn.gov.my',
        path: '/api/forward_message',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzNDUifQ.E1MDASE64Q_yMqDZNzBX2nGZK78NRXUP8cJE2I8-wns'
        }
      };

      const proxyReq = https.request(options, proxyRes => {
        res.writeHead(proxyRes.statusCode, {
          'Access-Control-Allow-Origin': '*',
          ...proxyRes.headers
        });
        proxyRes.pipe(res);
      });

      proxyReq.on('error', error => {
        console.error('Proxy Error:', error);
        res.writeHead(500, {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        });
        res.end(JSON.stringify({ error: error.message }));
      });

      proxyReq.write(body);
      proxyReq.end();
    });
  } else {
    res.writeHead(404, {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(HTTP_PORT, () => {
  console.log(`[RealtimeRelay] WebSocket server running on ws://localhost:${WS_PORT}`);
  console.log(`[RealtimeRelay] HTTP proxy server running on http://localhost:${HTTP_PORT}`);
});
