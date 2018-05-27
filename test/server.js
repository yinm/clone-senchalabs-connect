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

})
