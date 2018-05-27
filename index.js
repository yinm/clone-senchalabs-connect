'use strict'

/**
 * Module dependencies.
 * @private
 */
const debug = require('debug')('connect:dispatcher')
const EventEmitter = require('events').EventEmitter
const finalhandler = require('finalhandler')
const http = require('http')
const merge = require('utils-merge')
const parseUrl = require('parseurl')

/**
 * Module exports.
 * @public
 */
module.exports = createServer

/**
 * Module variables.
 * @private
 */
const env = process.env.NODE_ENV || 'development'
let proto = {}

/* istanbul ignore next */
const defer = typeof setImmediate === 'function'
  ? setImmediate
  : function(fn) { process.nextTick(fn.bind.apply(fn, arguments)) }

