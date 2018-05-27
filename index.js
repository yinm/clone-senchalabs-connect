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

/**
 * Create a new connect server.
 *
 * @return {function}
 * @public
 */
function createServer() {
  function app(req, res, next){ app.handle(req, res, next) }
  merge(app, proto)
  merge(app, EventEmitter.prototype)
  app.route = '/'
  app.stack = []
  return app
}

/**
 * Utilize the given middleware `handle` on the given `route`,
 * defaulting to _/_. This "route" is the mount-point for the
 * middleware, when given a value other than _/_ the middleware
 * is only effective when that segment is present in the request's
 * pathname.
 *
 * For example if we were to mount a function at _/admin_, it would
 * be invoked on _/admin_, and _/admin/settings_, however it would
 * not be invoked for _/_, or _posts_.
 *
 * @param {String|Function|Server} route callback or server
 * @param {Function|Server} fn callback or server
 * @returns {Server} for chaining
 * @public
 */
proto.use = (route, fn) => {
  let handle = fn
  let path = route

  // default route to '/'
  if (typeof route !== 'string') {
    handle = route
    path = '/'
  }

  // wrap sub-apps
  if (typeof handle.handle === 'function') {
    let server = handle
    server.route = path
    handle = (req, res, next) => {
      server.handle(req, res, next)
    }
  }

  // wrap vanilla http.Servers
  if (handle instanceof http.Server) {
    handle = handle.listeners('request')[0]
  }

  // strip trailing slash
  if (path[path.length - 1] === '/') {
    path = path.slice(0, -1)
  }

  // add the middleware
  debug('use %s %s', path || '/', handle.name || 'annonymous')
  this.stack.push({ route: path, handle: handle })

  return this
}
