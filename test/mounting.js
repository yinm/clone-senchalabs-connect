const assert = require('assert')
const connect = require('..')
const http = require('http')
const request = require('supertest')

describe('app.use()', () => {
  let app

  beforeEach(() => {
    app = connect()
  })

  it('should match all paths with "/"', (done) => {
    app.use('/', (req, res) => {
      res.end(req.url)
    })

    request(app)
      .get('/blog')
      .expect(200, '/blog', done)
  })

  it('should match full path', (done) => {
    app.use('/blog', (req, res) => {
      res.end(req.url)
    })

    request(app)
      .get('/blog')
      .expect(200, '/', done)
  })

  it('should match left-side of path', (done) => {
    app.use('/blog', (req, res) => {
      res.end(req.url)
    })

    request(app)
      .get('/blog/article/1')
      .expect(200, '/article/1', done)
  })

})
