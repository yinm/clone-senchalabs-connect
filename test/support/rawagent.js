'use strict'

const assert = require('assert')
const http = require('http')

module.exports = createRawAgent

function createRawAgent(app) {
  return new RawAgent(app)
}

function RawAgent(app) {
  this.app = app

  this._open = 0
  this._port = null
  this._server = null
}

RawAgent.prototype.get = function(path) {
  return new RawRequest(this, 'GET', path)
}

RawAgent.prototype._close = function(cb) {
  if (--this._open) {
    return process.nextTick(cb)
  }

  this._server.close(cb)
}

RawAgent.prototype._start = function(cb) {
  this._open++

  if (this._port) {
    return process.nextTick(cb)
  }

  if (!this.server) {
    this._server = http.createServer(this.app).listen()
  }

  let agent = this
  this._server.on('listening', function() {
    agent._port = this.address().port
    cb()
  })
}
