"use strict";

var util = require('util'),
    events = require('events');

var proxy = {
    Events: function (obj,writable,readable) {
        var route = function(ev) {
            switch (ev) {
            case 'data':
            case 'end':
            case 'close':
            case 'readable':
                return readable;
            case 'drain':
            case 'finish':
            case 'pipe':
            case 'unpipe':
            case 'error':
                return writable;
            default:
                throw new Error('route '+ev);
            }
        }
        obj.on = function (ev, fn) { return route(ev).on(ev,fn)  }
        obj.once = function (ev, fn) { return route(ev).once(ev,fn) }
        obj.emit = function (ev, arg) { return route(ev).emit(ev,arg) }
        obj.removeListener = function (ev, listener) { return route(ev).removeListener(ev,listener) }
        obj.removeAllListeners = function (ev) { return  ev ? route(ev).removeAllListeners(ev) : (readable.removeAllListeners(),writable.removeAllListeners()) }
        obj.setMaxListeners = function (n) { writable.setMaxListeners(n); readable.setMaxListeners(n) }
        obj.listeners = function (ev) { return route(ev).listeners() }
    },
    Readable: function (obj,bindto) {
        obj.read = function (size) { return bindto.read(size) };
        obj.setEncoding = function (encoding) { return bindto.setEncoding(encoding) };
        obj.resume = function () { return bindto.resume() };
        obj.pause = function () { return bindto.pause() };
        obj.pipe = function (destination, options) { return bindto.pipe(destination, options) };
        obj.unpipe = function (destination) { return bindto.unpipe(destination) };
        obj.unshift = function (chunk) { return bindto.unshift(chunk) };
    },
    Writable: function (obj,bindto) {
        obj.write = function (chunk, encoding, callback) { return bindto.write(chunk, encoding, callback) };
        obj.end = function (chunk, encoding, callback) { return bindto.end(chunk, encoding, callback) };
    }
}

var Pipes = module.exports = function (pipes) {
    var start = pipes[0];
    var end = pipes[pipes.length-1];
    for (var ii=1; ii<pipes.length; ++ii) {
        pipes[ii-1].pipe(pipes[ii]);
    }
    proxy.Writable(this, start);
    proxy.Readable(this, end);
    proxy.Events(this, start, end);
}
