#!/usr/bin/env node

const http = require('http');
const argv = require('minimist')(process.argv.slice(2));
const Server = require('../index');

const host = argv.host || 'localhost';
const port = argv.port || 37589;

if( argv.reload ){
    let options = {
        host,
        port,
        path: '/reload',
        method: 'POST'
    }

    let request = http.request(options, function(res){});
    request.end();
}
else {
    Server(host,port);
}