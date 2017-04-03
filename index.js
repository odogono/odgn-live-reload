const Http = require('http');
const Path = require('path');
const Url = require('url');
const WebSocket = require('ws');
const Fs = require('fs');
const EventEmitter = require('events');

const eventBus = new EventEmitter();



module.exports = function ODGNLiveReloadServer(options) {
    const host = readValue(options,'host', 'localhost');
    const port = readValue(options,'port', 37589);
    const silent = readValue(options,'silent', true);
    const reloadOnReconnect = readValue(options,'reloadOnReconnect', true);

    const browserJS = buildBrowserJs(host, port, reloadOnReconnect,silent);

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

        ws.on('message', function incoming(message) {
            console.log('received: %s', message);
        });

        eventBus.on('reload', () => {
            ws.send('reload');
        });
    });

    server.listen(port, function listening(err) {
        if (err) {
            throw err;
        }
        console.log('Listening on %d', server.address().port);
    });

    eventBus.on('reload', () => {
        console.log('eventbus reload');
    });
};

function buildBrowserJs(host, port, reloadOnReconnect, silent) {
    // load the browser.js
    const path = Path.join(__dirname, 'browser.js');
    let result = Fs.readFileSync(path, 'utf8');

    let browserOptions = {
        host,
        port,
        reloadOnReconnect,
        silent
    };

    // insert the port into the browser.js
    // result = result.replace(new RegExp(/\$\{PORT\}/, 'g'), port);
    // insert the host into the browser.js
    // result = result.replace(new RegExp(/\$\{HOST\}/, 'g'), "'" + host + "'");

    result = result.replace(new RegExp(/\$\{OPTIONS\}/, 'g'), JSON.stringify(browserOptions) );

    return result;
}

function readValue(obj,key,defaultTo=''){
    if( !obj ){ return defaultTo; }
    if( obj[key] === undefined ){ return defaultTo; }
    return obj[key];
}