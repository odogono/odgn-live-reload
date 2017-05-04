// http://stackoverflow.com/a/31985557/2377677
// http://blog.johnryding.com/post/78544969349/how-to-reconnect-web-sockets-in-a-realtime-web-app
// https://gist.github.com/strife25/9310539


var options = ${OPTIONS};
var silent = options.silent;
var port = options.port;
var reloadOnReconnect = options.reloadOnReconnect;
var enableReload = options.enableReload;
var enableReconnect = options.enableReconnect;
var attempts = 1;
var loc = document.location || { hostname: 'localhost' };
var uri = 'ws://' + window.location.hostname + ':' + port + '/';


document.addEventListener("DOMContentLoaded", function() {
    
    function connect(){
        try{
            clearReconnectTimeout();
            log('[connect] connecting to ', uri);
            var ws = new WebSocket(uri);

            ws.onopen = function(){
                log('[onopen] connected');
                if( reloadOnReconnect && attempts > 1 ){
                    reload();
                }
                attempts = 1;
            }
            ws.onmessage = function(evt){
                log('[onmessage]', evt);
                if( evt.data == 'reload'){
                    reload();
                }
            }
            ws.onerror = function(event){
                log('[onerror]', event);
            }
            ws.onclose = function(){
                log('[onclose]', window.timeoutID);
                // if there is already a timeout in progress, then ignore
                if( window.timeoutID ){
                    return;
                }
                
                if( enableReconnect ){
                    var interval = generateInterval(attempts);
                    log( 'reconnecting in', interval,'ms');
                    window.timeoutID = setTimeout( function(){
                        attempts++;
                        log( '[reconnect]', 'attempts', attempts);
                        connect();
                    }, interval );
                }
            }


        } catch( err ){
            log('error', err);    
        }
    }

    connect();

});

function reload(){
    if( enableReload ){
        document.location.reload();
    } else {
        log('reload requested, but not enabled');
    }
}

function clearReconnectTimeout(){
    if( window.timeoutID ){
        window.clearTimeout(window.timeoutID);
        window.timeoutID = undefined;
    }
}

function generateInterval(k){
    return maxInterval = Math.min( 30, (Math.pow(2,k) - 1) ) * 500;
}

function log(msg){
    if( silent ){ return; }
    var args = Array.prototype.slice.call(arguments);
    args.unshift('[odgn-live-reload]');
    console.log.apply( console.log, args );
}