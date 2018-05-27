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
