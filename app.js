
/**
 * Module dependencies.
 */

var http = require('http'),
    express = require('express'),
    connect = require('connect'),
    io = require('socket.io'),
    json = JSON.stringify;

var app = express.createServer();

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

app.listen(3000);

var clientCount = 0;
var socket = io.listen(app);
socket.on('connection', function(client) {
  console.log('Client Connected');
  clientCount++;
  client.on('message', function(message) {
    console.log('message received. :' + message);
    var message = JSON.parse(message);
    if (message.start) {
      sendRandomWord(client, clientCount);
    }
    if (message.position) {
      client.broadcast(json({'others': message.position}));
      client.send(json({'you': message.position}));
    }
  });
  client.on('disconnect', function() {
    console.log('Client disconnected.');
    clientCount--;
  });
});


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
        console.log('retry');
        sendRandomWord(client);
      } else {
        console.log(word);
        var message = {'start': clientCount,
                       'word': word};
        client.broadcast(json(message));
        client.send(json(message));
      }
    }
  });
};

