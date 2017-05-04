const Http = require('http');
const Path = require('path');
const Url = require('url');
const WebSocket = require('ws');
const Fs = require('fs');
const EventEmitter = require('events');

const eventBus = new EventEmitter();

let silent = true;


module.exports = function ODGNLiveReloadServer(options) {
    const host = readValue(options,'host', 'localhost');
    const port = readValue(options,'port', 37589);
    silent = readValue(options,'silent', true);
    const reloadOnReconnect = readValue(options,'reloadOnReconnect', true);
    const enableReload = readValue(options,'enableReload',true);
    const enableReconnect = readValue(options,'enableReconnect',true);

    const browserJS = buildBrowserJs(host, port, enableReload, enableReconnect, reloadOnReconnect,silent);

    const server = Http.createServer(handleRequest);
    const wss = new WebSocket.Server({ server });

    function handleRequest(request, response) {
        const { pathname, query } = Url.parse(request.url, true);
        if (pathname === '/reload') {
            eventBus.emit('reload');
        } else if (pathname === '/exit') {
            process.exit();
        } else if (pathname === '/reload.js') {
            return response.end(browserJS);
        }
        return response.end();
    }

    wss.on('connection', function connection(ws) {
        const location = Url.parse(ws.upgradeReq.url, true);
        // You might use location.query.access_token to authenticate or share sessions
        // or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

        const reloadHandler = () => {
            log('[ws][reload]', 'ws readyState', ws?ws.readyState:'null');
            if( ws && ws.readyState === 1 ){
                ws.send('reload');
            }
        };

        ws.on('message', function incoming(message) {
            log('[ws] received: %s', message);
        });

        ws.on('close', () => {
            eventBus.removeListener('reload', reloadHandler);
            log('[ws] disconnected');
        });

        eventBus.on('reload', reloadHandler );
    });

    server.listen(port, function listening(err) {
        if (err) {
            throw err;
        }
        log('Listening on %d', server.address().port);
    });
};

function buildBrowserJs(host, port, enableReload, enableReconnect, reloadOnReconnect, silent) {
    // load the browser.js
    const path = Path.join(__dirname, 'browser.js');
    let result = Fs.readFileSync(path, 'utf8');

    let browserOptions = {
        host,
        port,
        enableReload,
        enableReconnect,
        reloadOnReconnect,
        silent
    };

    result = result.replace(new RegExp(/\$\{OPTIONS\}/, 'g'), JSON.stringify(browserOptions) );

    return result;
}

function readValue(obj,key,defaultTo=''){
    if( !obj ){ return defaultTo; }
    if( obj[key] === undefined ){ return defaultTo; }
    return obj[key];
}

function log(msg){
    if( silent ){ return; }
    var args = Array.prototype.slice.call(arguments);
    args.unshift('[odgn-live-reload][server]');
    console.log.apply( console.log, args );
}