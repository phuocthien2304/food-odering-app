const WebSocket = require('ws');

let wss = null;

function init(server) {
  if (wss) return wss;
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    console.log('WS client connected');
    ws.on('message', (msg) => {
      // echo or ignore; clients shouldn't need to send messages for now
      try { console.log('WS message from client:', msg.toString()); } catch (e) {}
    });
    ws.on('close', () => console.log('WS client disconnected'));
  });

  return wss;
}

function broadcast(event) {
  if (!wss) return;
  const data = JSON.stringify(event);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

module.exports = { init, broadcast };
