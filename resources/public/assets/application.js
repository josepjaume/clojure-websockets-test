(function(exports){
  var randColor = function(){
    return '#'+Math.floor(Math.random()*16777215).toString(16);
  }

  $(document).ready(function(){
    var openSocket = function(){
      return new WebSocket("ws://" + window.location.host + "/socket");
    };

    var socket = openSocket();

    var currentColor = randColor();

    setInterval(function(){
      if(socket.readyState == undefined || socket.readyState > 1){
        socket = openSocket();
      }
    }, 100);

    var clients = {};

    var getClient = function(clientId, path){
      var key = clientId + ":" + path;
      var client = clients[key];
      if(client) return client;

      client = {
        id: clientId
      }

      clients[key] = client;
      return client;
    };

    var canvas = document.getElementById("canvas");

    resizeCanvas = function(){
      $(canvas).attr('height', $(document).height());
      $(canvas).attr('width', $(document).width());
    }

    resizeCanvas();
    $(window).resize(resizeCanvas);

    var context = canvas.getContext("2d");

    socket.onmessage = function(event){
      var data = JSON.parse(event.data);
      processEvent(data.id, data.data);
    }

    var processEvent = function(id, data){
      var client = getClient(id, data.path);
      var lastPosition = client.lastPosition;
      var position = data.position;
      if(data.start) lastPosition = null;

      if(lastPosition){
        context.beginPath();
        context.moveTo(lastPosition[0], lastPosition[1]);
        context.lineTo(position[0], position[1]);
        context.lineWidth = 10;
        context.lineCap = 'round';
        context.strokeStyle = data.color;
        context.stroke();
      }

      client.lastPosition = position;
    }

    var clicking = {};
    var lastPositions = {};

    var processMouseEvent = _.throttle(function(event, index){
      if(!clicking[index]) return;

      if(!event.pageX|| !event.pageY) return;
      var position = [event.pageX, event.pageY];

      var data = {
        color: getColor(),
        path: (index || 0)
      };

      if(!lastPositions[index]) data["start"] = true;

      data["position"] = position;
      lastPositions[index] = position;
      socket.send(JSON.stringify(data));
      processEvent("me", data);
    }, 25);

    var startTouch = function(path){
      clicking[path] = true;
    }

    var stopTouch = function(path){
      clicking[path] = false;
      lastPositions[path] = null;
    }

    socket.onopen = function(){
      $(document).mouseup(function(){ stopTouch("mouse") });
      $(document).mousedown(function(){ startTouch("mouse") });

      $(window).on("touchstart", function(e){
        var events = e.originalEvent.targetTouches;
        jQuery.each(events, function(index, evt){
          startTouch(evt.identifier)
        });
      });

      $(window).on("touchend", function(e){
        var events = e.originalEvent.changedTouches;
        jQuery.each(events, function(index, evt){
          stopTouch(evt.identifier)
        });
      });

      $(document).mousemove(function(e){ processMouseEvent(e, "mouse")});

      $(document).on("touchmove", function(event){
        var e = event.originalEvent;
        jQuery.each(e.targetTouches, function(index, evt){
          processMouseEvent(evt, evt.identifier);
        });
        return false;
      });
    };

    var getColor = function(){
      if($("input#rainbow").is(':checked')){
        return randColor();
      }else{
        return currentColor;
      }
    };

    $("input#color").change(function(){
      currentColor = $("input#color").val();
    });
    $("input#color").val(currentColor);
  });
})(window);
