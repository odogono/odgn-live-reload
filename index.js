const Http = require('http');
const Url = require('url');
const WebSocket = require('ws');
const Fs = require('fs');
const EventEmitter = require('events');

// class EventBus extends EventEmitter{};
const eventBus = new EventEmitter();


module.exports = function ODGNLiveReloadServer(options){
    const server = Http.createServer(handleRequest);
    const wss = new WebSocket.Server({ server });
    
    const host = options.host || 'localhost';
    const port = options.port || 37589;

    const browserJS = buildBrowserJs(host,port);

    wss.on('connection', function connection(ws) {
        const location = Url.parse(ws.upgradeReq.url, true);
        // You might use location.query.access_token to authenticate or share sessions
        // or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

        ws.on('message', function incoming(message) {
            console.log('received: %s', message);
        });

        eventBus.on('reload', () => {
            ws.send('reload');
        })
    });

    server.listen(port, function listening(err) {
        if( err ){
            throw err;
        }
        console.log('Listening on %d', server.address().port);
    });

    eventBus.on('reload', () => {
        console.log('eventbus reload');
    })
}


function handleRequest(request,response){
    const {pathname,query} = Url.parse(request.url,true);
    if( pathname === '/reload' ){
        eventBus.emit('reload');
    } else if( pathname === '/exit' ){
        process.exit();
    } else if( pathname === '/reload.js'){
        return response.end(browserJS);
    }
    return response.end();
}


function buildBrowserJs(host,port){
    // load the browser.js
    let result = Fs.readFileSync('./browser.js', 'utf8');

    // insert the port into the browser.js
    result = result.replace( new RegExp(/\$\{PORT\}/, 'g'), port );
    // insert the host into the browser.js
    result = result.replace( new RegExp(/\$\{HOST\}/, 'g'), "'" + host + "'" );

    return result;
}