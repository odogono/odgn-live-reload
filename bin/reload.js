#!/usr/bin/env node

const http = require('http');
const argv = require('minimist')(process.argv.slice(2));
const Server = require('../index');

const host = argv.host || 'localhost';
const port = argv.port || 37589;
const delay = toInteger(argv.delay, 0);

if (argv.server) {
    Server(host, port);
} else {
    let options = {
        host,
        port,
        path: '/reload',
        method: 'POST'
    };

    if (delay > 0) {
        setTimeout(() => sendReloadRequest(options), delay);
    } else {
        sendReloadRequest(options);
    }
}

function toInteger(str, defaultValue = 0) {
    try {
        return parseInt(str, 10);
    } catch (err) {}
    return defaultValue;
}

function sendReloadRequest(params) {
    let request = http.request(params, function(res) {});
    request.on('error', err => console.log('error connecting to ' + params.host + ':' + params.port + ' - ' + err.message));
    request.end();
}
