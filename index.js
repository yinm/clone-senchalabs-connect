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

/**
 * Handle server requests, punting them down
 * the middleware stack.
 *
 * @private
 */
proto.handle = (req, res, out) => {
  let index = 0
  let protohost = getProtohost(req.url) || ''
  let removed = ''
  let slashAdded = false
  let stack = this.stack

  // final function handler
  let done = out || finalhandler(req, res, {
    env: env,
    onerror: logerror,
  })

  // store the original URL
  req.originalUrl = req.originalUrl || req.url

  function next(err) {
    if (slashAdded) {
      req.url = req.url.substr(1)
      slashAdded = false
    }

    if (removed.length !== 0) {
      req.url = protohost + removed + req.url.substr(protohost.length)
      removed = ''
    }

    //next callback
    let layer = stack[index++]

    // all done
    if (!layer) {
      defer(done, err)
      return
    }

    // route data
    let path = parseUrl(req).pathname || '/'
    let route = layer.route

    // skip this layer if the route doesn't match
    if (path.toLowerCase().substr(0, route.length) !== route.toLowerCase()) {
      return next(err)
    }

    // skip if route match does not border "/", ".", or end
    let c = path.length > route.length && path[route.length]
    if (c && c !== '/' && c !== '.') {
      return next(err)
    }

    // trim off the part of the url that matches the route
    if (route.length !== 0 && route !== '/') {
      removed = route
      req.url = protohost + req.url.substr(protohost.length + removed.length)

      // ensure leading slash
      if (!protohost && req.url[0] !== '/') {
        req.url = '/' + req.url
        slashAdded = true
      }
    }

    // call the layer handle
    call(layer.handle, route, err, req, res, next)
  }

  next()
}

/**
 * Listen for connections.
 *
 * This method takes the same arguments
 * as node's `http.Server#listen()`.
 *
 * HTTP and HTTPS:
 *
 * If you run your application both as HTTP
 * and HTTPS you may wrap them individually,
 * since your connect "server" is really just
 * a JavaScript `Function`.
 *
 *  var connect = require('connect')
 *    , http = require('http')
 *    , https = require('https')
 *
 *  var app = connect()
 *
 *  http.createServer(app).listen(80)
 *  https.createServer(options, app).listen(443)
 *
 * @returns {http.Server}
 * @api public
 */
proto.listen = function() {
  const server = http.createServer(this)
  return server.listen.apply(server, arguments)
}

/**
 * Invoke a route handle.
 * @private
 */
function call(handle, route, err, req, res, next) {
  const arity = handle.length
  let error = err
  const hasError = Boolean(err)

  debug('%s %s : %s', handle.name || '<annonymous>', route, req.originalUrl)

  try {
    if (hasError && arity === 4) {
      // error-handling middleware
      handle(err, req, res, next)
      return
    } else if (!hasError && arity < 4) {
      // request-handling middleware
      handle(req, res, next)
      return
    }
  } catch (e) {
    // replace the error
    error = e
  }

  // continue
  next(error)
}
