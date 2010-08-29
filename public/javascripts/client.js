io.setPath('/home/node/node-service/current/public/javascripts/');
var socket = new io.Socket('mesolabs.no.de');
socket.connect();

$(document).ready(function() {
  $('#start').click(function(event) {
    socket.send(JSON.stringify({'join': 'new'}));
  }).focus();
  $('#next').click(function(event) {
    socket.send(JSON.stringify({'join': 'continue'}));
  });
});

var word = '';
socket.addEvent('message', function(data) {
  data = JSON.parse(data);
  if (data.clientCount) { 
    $('#clientCount').text(data.clientCount + ' people are online.');
  }
  if (data.word) {
    $('#count').show();
    $('#next').hide();
    $('#opening').hide();
    $('#playing').show();
    
    word = data.word;
    $('#word').text(word);
    var currentLength = 0;
    var input = $('#input');
    var count = $('#count');

    input.attr('value', '');
    input.removeAttr('disabled');
    input.css('width', word.length * 8);
    input.focus();
    input.keydown(function(event) {
      var keyCode = event.which;
      var ignoreKeyCodes = ',8,9,17,18,19,20,27,33,34,35,36,37,38,39,40,45,46,145,';
      if (ignoreKeyCodes.indexOf(',' + keyCode + ',') > -1) {
        return false;
      }
      return true;
    });
    input.keypress(function(event) {
      var keyCode = event.which;

      var ignoreKeyCodes = ',8,9,17,18,19,20,27,33,34,35,36,38,145,';
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
        return true;
      }
    });
    count.text(currentLength + '/' + word.length);
    updateYou(0);
    prepareOthers(data.playerCount);
    updateOthers(0);
  }
  if (data.you) {
    updateYou(data.you);
  }
  if (data.others) {
    updateOthers(data.others, data.clientId);
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
  if (word.length == position) {
    inputed = 'YOU WIN!!';
    socket.send(JSON.stringify({'finished': true}));
    clean();
  } else {
    inputed = inputed + '_';
    for (var i = position; i < word.length-1; i++) {
      inputed = inputed + '&nbsp;';
    }
  }
  $('#you').html(inputed);
}

function prepareOthers(clientCount) {
  $('.others').remove();
  for (var i = 0; i < clientCount - 1; i++) {
    $('#word').after('<div class="others"></div>');
  }
}

function updateOthers(position, id) {
  var inputed = '';
  for (var i = 0; i < position; i++) { 
    inputed = inputed + '&nbsp;';
  }
  if (word.length == position) {
    inputed = 'WINNER';
    clean();
  } else {
    inputed = inputed + '^';
    for (var i = position; i < word.length-1; i++) {
      inputed = inputed + '&nbsp;';
    }
  }
  if (id) {
    if($('#' + id).attr('id')) {
      $('#' + id).html(inputed);
    } else {
      $('.others:not([id]):first').attr('id', id).html(inputed);
    }
  } else {
    $('.others').html(inputed);
  }
}

function clean() {
  $('#input').attr('disabled', 'disabled').unbind('keypress').unbind('keydown');
  $('#count').hide();
  $('#next').show().focus();
}


