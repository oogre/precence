import net from 'net';

const port = 5000;

const log = function(who, what) {
  return function() {
    var args = Array.prototype.slice.call(arguments);
    console.log('[%s on %s]', who, what, args);
  };
};

const echo = function(socket) {
  /**
   *  net.Socket (http://nodejs.org/api/net.html#net_class_net_socket)
   *  events: end, data, end, timeout, drain, error, close
   *  methods:
   */
  socket.on('end', function() {
    // exec'd when socket other end of connection sends FIN packet
    console.log('[socket on end]');
  });
  socket.on('data', function(data) {
    // data is a Buffer object
    console.log('[socket on data]', data);
    //setTimeout(()=>socket.write(data), 1000);
  });
  socket.on('end', function() {
    // emitted when the other end sends a FIN packet
  });

  socket.on('timeout', log('socket', 'timeout'));

  socket.on('drain', function() {
    // emitted when the write buffer becomes empty
    console.log('[socket on drain]');
  });
  socket.on('error', log('socket', 'error'));
  socket.on('close', log('socket', 'close'));
  socket.pipe(socket);
};

/**
 *  net.Server (http://nodejs.org/api/net.html#net_class_net_server)
 *  events: listening, connections, close, err
 *  methods: listen, address, getConnections,  
 */
const server = net.createServer(echo);
server.listen(port); // port or unix socket, cannot listen on both with one server

server.on('listening', function() {
  const ad = server.address();
  if (typeof ad === 'string') {
    console.log('[server on listening] %s', ad);
  } else {
    console.log('[server on listening] %s:%s using %s', ad.address, ad.port, ad.family);
  }
});

server.on('connection', function(socket) {
  server.getConnections(function(err, count) {
    console.log('%d open connections!', count);
  });
});

server.on('close', function() { console.log('[server on close]'); });
server.on('err', function(err) { 
  console.log(err);
  server.close(function() { console.log("shutting down the server!"); });
});
