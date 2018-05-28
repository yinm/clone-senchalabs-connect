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
      .get('/Blog')
      .expect('blog', done)
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

  it('should be case insensitive (mixed-case route, mixed-case request)', (done) => {
    const blog = http.createServer((req, res) => {
      assert.equal(req.url, '/')
      res.end('blog')
    })

    app.use('/Blog', blog)

    request(app)
      .get('/blOG')
      .expect('blog', done)
  })

  it('should ignore fn.arity > 4', (done) => {
    let invoked = []

    app.use((req, res, next, _a, _b) => {
      invoked.push(0)
      next()
    })

    app.use((req, res, next) => {
      invoked.push(1)
      next(new Error('err'))
    })

    app.use((err, req, res, next) => {
      invoked.push(2)
      res.end(invoked.join(','))
    })

    request(app)
      .get('/')
      .expect(200, '1,2', done)
  })

  describe('with a connect app', () => {
    it('should mount', (done) => {
      let blog = connect()

      blog.use((req, res) => {
        assert.equal(req.url, '/')
        res.end('blog')
      })

      app.use('/blog', blog)

      request(app)
        .get('/blog')
        .expect(200, 'blog', done)
    })

    it('should retain req.originalUrl', (done) => {
      let app = connect()

      app.use('/blog', (req, res) => {
        res.end(req.originalUrl)
      })

      request(app)
        .get('/blog/post/1')
        .expect(200, '/blog/post/1', done)
    })

    it('should adjust req.url', (done) => {
      app.use('/blog', (req, res) => {
        res.end(req.url)
      })

      request(app)
        .get('/blog/post/1')
        .expect(200, '/post/1', done)
    })

    it('should strip trailing slash', (done) => {
      let blog = connect()

      blog.use((req, res) => {
        assert.equal(req.url, '/')
        res.end('blog')
      })

      app.use('/blog/', blog)

      request(app)
        .get('/blog')
        .expect('blog', done)
    })

  })

})
