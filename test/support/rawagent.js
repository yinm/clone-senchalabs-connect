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

function RawRequest(agent, method, path) {
  this.agent = agent
  this.method = method
  this.path = path
}

RawRequest.prototype.expect = function(status, body, callback) {
  const request = this

  this.agent._start(function() {
    let req = http.request({
      host: '127.0.0.1',
      method: request.method,
      path: request.path,
      port: request.agent._port,
    })

    req.on('response', function(res) {
      let buf = ''

      res.setEncoding('utf8')
      res.on('data', function(s) { buf += s })
      res.on('end', function() {
        let err = null

        try {
          assert.equal(res.statusCode, status, 'expected ' + status + ' status, got ' + res.statusCode)

          if (body instanceof RegExp) {
            assert.ok(body.test(buf), 'expected body ' + buf + ' to match ' + body)
          } else {
            assert.equal(buf, body, 'expectd ' + body + ' response body, got ' + buf)
          }
        } catch (e) {
          err = e
        }

        request.agent._close(function() {
          callback(err)
        })
      })
    })

    req.end()
  })
}
