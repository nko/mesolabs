
/**
 * Module dependencies.
 */

var http = require('http'),
    express = require('express'),
    connect = require('connect'),
    io = require('socket.io'),
    json = JSON.stringify;


var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.use(connect.bodyDecoder());
    app.use(connect.methodOverride());
    app.use(connect.compiler({ src: __dirname + '/public', enable: ['less'] }));
    app.use(app.router);
    app.use(connect.staticProvider(__dirname + '/public'));
});

app.configure('development', function(){
    app.use(connect.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
   app.use(connect.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
    res.render('index.jade', {
        locals: {
            title: 'Typing Championship'
        }
    });
});

app.listen(8080);

var socket = io.listen(app);
var playerCount = 0;
var clientCount = 0;
var first = true;
var playing = false;
var clients = {};
socket.on('connection', function(client) {
  clientCount++;
  clients[client.sessionId] = 'NOT_JOINED';
  sendClientCount(client);

  client.on('message', function(message) {
    var message = JSON.parse(message);
    if (message.join) {
      if (message.join == 'new') { 
        clients[client.sessionId] = 'JOINED';
      }
      if (playing == false) {
        setTimeout(sendRandomWord, 3000, client);
        playing = true;
      }
    }
    if (message.position) {
      client.broadcast(json({'others': message.position,
                             'clientId': client.sessionId}));
      client.send(json({'you': message.position}));
    }
    if (message.finished) {
      playing = false;
    }
  });
  client.on('disconnect', function() {
    clientCount--;
    clients[client.sessionId] = undefined;
    
    var playerCount = 0;
    for (var n in clients) {
      if (clients[n] == 'JOINED') {
        playerCount++;
      }
    }
    if (playerCount == 0) {
      playing = false;
    }
    sendClientCount(client);
  });
});

function sendClientCount() {
  socket.broadcast(json({'clientCount': clientCount}));
}

function sendRandomWord(client) {
  var wikipedia = http.createClient(80, 'en.wikipedia.org');
  var request = wikipedia.request('GET', '/wiki/Special:Random',
    {'host': 'en.wikipedia.org',
     'User-Agent': 'shimizu.toshihiro@gmail.com'});
  request.end();

  request.on('response', function(res) {
    if (res.statusCode != 302) {
      throw new Error('Wikipedia returns unexpected result.');
    } else {
      var word = res.headers.location.split('/').pop();
      word = word.replace(/_/g, ' ');
      var decoded = decodeURI(word);
      if (word != decoded) {
        sendRandomWord(client);
      } else {
        var notCastClients = [];
        var playerCount = 0;
        for (var n in clients) {
          if (clients[n] == 'NOT_JOINED') {
            notCastClients.push(n);
          } else if (clients[n] == 'JOINED') {
            playerCount++;
          }
        }
        var message = {'word': word, 'playerCount': playerCount};
        socket.broadcast(json(message), notCastClients);
      }
    }
  });
};

