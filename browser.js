// http://stackoverflow.com/a/31985557/2377677
// http://blog.johnryding.com/post/78544969349/how-to-reconnect-web-sockets-in-a-realtime-web-app
// https://gist.github.com/strife25/9310539


// var loc;
// var uri = ${HOST};
var port = ${PORT};
var attempts = 1;


// if (typeof uri === "number") {
    var loc = document.location || { hostname: 'localhost' };
    var uri = '//' + loc.hostname + ':' + port;
// }

function handleData(data){
    if( data == 'reload' ){
        document.location.reload();
    }
}

document.addEventListener("DOMContentLoaded", function() {
    
    function connect(){

        var ws = new WebSocket(uri);

        ws.onopen = function(){
            attempts = 1;
            if( window.timeoutID ){
                window.clearTimeout(window.timeoutID);
                window.timeoutID = undefined;
            }
        }
        ws.onmessage = function(evt){
            if( evt.data == 'reload'){
                document.location.reload();
            }
        }
        ws.onclose = function(){
            // if there is already a timeout in progress, then ignore
            if( window.timeoutID ){
                return;
            }
            
            var interval = generateInterval(attempts);
            console.log('reconnecting in', interval,'ms');
            window.timeoutID = setTimeout( function(){
                attempts++;
                connect();
            }, interval );
        }

    }

    connect();

});


function generateInterval(k){
    return maxInterval = Math.min( 30, (Math.pow(2,k) - 1) ) * 1000;
}