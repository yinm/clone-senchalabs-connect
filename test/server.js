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
})
