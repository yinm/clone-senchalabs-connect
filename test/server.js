const assert = require('assert')
const connect = require('..')
const http = require('http')
const rawrequest = require('./support/rawagent')
const request = require('supertest')

describe('app', () => {
  let app

  beforeEach(() => {
    app = connect()
  })

  it('should inherit from event emitter', (done) => {
    app.on('foo', done)
    app.emit('foo')
  })

  it('should work in http.createServer', (done) => {
    app.use((req, res) => {
      res.end('hello, world')
    })

    const server = http.createServer(app)

    request(server)
      .get('/')
      .expect(200, 'hello, world', done)
  })

  it('should be a callable function', (done) => {
    app.use((req, res) => {
      res.end('hello, world!')
    })

    function handler(req, res) {
      res.write('oh, ')
      app(req, res)
    }

    const server = http.createServer(handler)

    request(server)
      .get('/')
      .expect(200, 'oh, hello, world!', done)
  })

  it('should invoke callback if request not handled', (done) => {
    app.use('/foo', (req, res) => {
      res.end('hello, world!')
    })

    function handler(req, res) {
      res.write('oh, ')
      app(req, res, () => {
        res.end('no!')
      })
    }

    const server = http.createServer(handler)

    request(server)
      .get('/')
      .expect(200, 'oh, no!', done)
  })

  it('should invoke callback on error', (done) => {
    app.use((req, res) => {
      throw new Error('boom!')
    })

    function handler(req, res) {
      res.write('oh, ')
      app(req, res, (err) => {
        res.end(err.message)
      })
    }

    const server = http.createServer(handler)

    request(server)
      .get('/')
      .expect(200, 'oh, boom!', done)
  })

  it('should work as middleware', (done) => {
    // custom server handler array
    const handlers = [
      connect(),
      (req, res, next) => {
        res.writeHead(200, {'Content-Type': 'text/plain'})
        res.end('Ok')
      },
    ]

    // execute callbacks in sequence
    let n = 0
    function run(req, res) {
      if (handlers[n]) {
        handlers[n++](req, res, () => {
          run(req, res)
        })
      }
    }

    // create a non-connect server
    const server = http.createServer(run)

    request(server)
      .get('/')
      .expect(200, 'Ok', done)
  })

  it('should escape the 500 response body', (done) => {
    app.use((req, res, next) => {
      next(new Error('error!'))
    })

    request(app)
      .get('/')
      .expect(/Error: error!<br>/)
      .expect(/<br> &nbsp; &nbsp;at/)
      .expect(500, done)
  })

  describe('404 handler', () => {
    it('should escape the 404 response body', (done) => {
      rawrequest(app)
        .get('/foo/<script>stuff\'n</script>')
        .expect(404, />Cannot GET \/foo\/%3Cscript%3Estuff&#39;n%3C\/script%3E</, done)
    })

    it('should not fire after headers sent', (done) => {
      app.use((req, res, next) => {
        res.write('body')
        res.end()
        process.nextTick(next)
      })

      request(app)
        .get('/')
        .expect(200, done)
    })

    it('should have no body for HEAD', (done) => {
      request(app)
        .head('/')
        .expect(404, '', done)
    })
  })

})
