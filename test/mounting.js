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

  it('should match up to dot', (done) => {
    app.use('/blog', (req, res) => {
      res.end(req.url)
    })

    request(app)
      .get('/blog.json')
      .expect(200, done)
  })

  it('should not match shorter path', (done) => {
    app.use('/blog-o-rama', (req, res) => {
      res.end(req.url)
    })

    request(app)
      .get('/blog')
      .expect(404, done)
  })

  it('should not end match in middle of component', (done) => {
    app.use('/blog', (req, res) => {
      res.end(req.url)
    })

    request(app)
      .get('/blog-o-rama/article/1')
      .expect(404, done)
  })

  it('should be case insensitive (mixed-case route, lower-case request)', (done) => {
    const blog = http.createServer((req, res) => {
      assert.equal(req.url, '/')
      res.end('blog')
    })

    app.use('/Blog', blog)

    request(app)
      .get('/blog')
      .expect('blog', done)
  })

})
