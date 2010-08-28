io.setPath('/javasciprts');
var socket = new io.Socket('localhost');
socket.connect();
//socket.send('hoge');
var word = '';
socket.addEvent('message', function(data) {
  data = JSON.parse(data);
  if (data.start) {
    word = data.start;
    $('#word').text(word);
    var count = $('#count');
    var currentLength = 0;
    var input = $('#input');

    input.attr('value', '');
    input.css('width', word.length * 8);
    input.focus();
    input.keydown(function(event) {
      var keyCode = event.which;
      var ignoreKeyCodes = ',8,9,17,18,19,20,27,33,34,35,36,37,38,39,40,45,46,145,';
      if (ignoreKeyCodes.indexOf(',' + keyCode + ',') > -1) {
        return false;
      }
    });
    input.keypress(function(event) {
      var keyCode = event.which;

      var ignoreKeyCodes = ',8,9,17,18,19,20,27,33,34,35,36,37,38,39,145,';
      if (ignoreKeyCodes.indexOf(',' + keyCode + ',') > -1) {
        return false;
      }
    
      var c = String.fromCharCode(keyCode);
      if (word[currentLength] != c) {
        return false;
      } else {
        currentLength++;
        count.text(currentLength + '/' + word.length);
        socket.send(JSON.stringify(
          {'position': currentLength}));
      }
    });
    count.text(currentLength + '/' + word.length);
    updateYou(0);
    updateOthers(0);
  }
  if (data.you) {
    updateYou(data.you);
  }
  if (data.others) {
    updateOthers(data.others);
  }
});

function log(text) {
  var debug = $('#debug');
  var oldText = debug.html();
  var newText = '<p>' + text + '</p>';
  debug.html(newText + oldText);
}

function updateYou(position) {
  var inputed = '';
  for (var i = 0; i < position; i++) {
    inputed = inputed + '&nbsp;';
  }
  inputed = inputed + '_';
  $('#you').html(inputed);
}

function updateOthers(position) {
  var inputed = '';
  for (var i = 0; i < position; i++) { 
    inputed = inputed + '&nbsp;';
  }
  inputed = inputed + '^';
  $('#others').html(inputed);
}

