const net = require('net');
var forge = require('node-forge');
forge.options.usePureJavaScript = true;


var socket = new net.Socket();

var client = forge.tls.createConnection({
  server: false,
  verify: function(connection, verified, depth, certs) {
    // skip verification for testing
    console.log('[tls] server certificate verified');
    return true;
  },
  connected: function(connection) {
    console.log('[tls] connected');
    // prepare some data to send (note that the string is interpreted as
    // 'binary' encoded, which works for HTTP which only uses ASCII, use
    // forge.util.encodeUtf8(str) otherwise
    client.prepare('GET / HTTP/1.0\r\n\r\n');
  },
  tlsDataReady: function(connection) {
    // encrypted data is ready to be sent to the server
    var data = connection.tlsData.getBytes();
    socket.write(data, 'binary'); // encoding should be 'binary'
  },
  dataReady: function(connection) {
    // clear data from the server is ready
    var data = connection.data.getBytes();
    console.log('[tls] data received from the server: ' + data);
  },
  closed: function() {
    console.log('[tls] disconnected');
  },
  error: function(connection, error) {
    console.log('[tls] error', error);
  }
});

socket.on('connect', function() {
  console.log('[socket] connected');
  client.handshake();
});
socket.on('data', function(data) {
  client.process(data.toString('binary')); // encoding should be 'binary'
});
socket.on('end', function() {
  console.log('[socket] disconnected');
});

// connect to google.com
socket.connect(443, 'google.com');

// or connect to gmail's imap server (but don't send the HTTP header above)
//socket.connect(993, 'imap.gmail.com');