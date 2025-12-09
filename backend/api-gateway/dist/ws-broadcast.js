"use strict";

var WebSocket = require('ws');
var wss = null;
function init(server) {
  if (wss) return wss;
  wss = new WebSocket.Server({
    server: server
  });
  wss.on('connection', function (ws, req) {
    console.log('WS client connected');
    ws.on('message', function (msg) {
      // echo or ignore; clients shouldn't need to send messages for now
      try {
        console.log('WS message from client:', msg.toString());
      } catch (e) {}
    });
    ws.on('close', function () {
      return console.log('WS client disconnected');
    });
  });
  return wss;
}
function broadcast(event) {
  if (!wss) return;
  var data = JSON.stringify(event);
  wss.clients.forEach(function (client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}
module.exports = {
  init: init,
  broadcast: broadcast
};