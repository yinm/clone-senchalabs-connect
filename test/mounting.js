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

    it('should set .route', () => {
      let blog = connect()
      let admin = connect()

      app.use('/blog', blog)
      blog.use('/admin', admin)

      assert.equal(app.route, '/')
      assert.equal(blog.route, '/blog')
      assert.equal(admin.route, '/admin')
    })

    it('should not add trailing slash to req.url', (done) => {
      app.use('/admin', (req, res, next) => {
        next()
      })

      app.use((req, res, next) => {
        res.end(req.url)
      })

      request(app)
        .get('/admin')
        .expect('/admin', done)
    })
  })

  describe('with a node app', () => {
    it('should mount', (done) => {
      const blog = http.createServer((req, res) => {
        assert.equal(req.url, '/')
        res.end('blog')
      })

      app.use('/blog', blog)

      request(app)
        .get('/blog')
        .expect('blog', done)
    })
  })

  describe('error handling', () => {
    it('should send errors to arity 4 fns', (done) => {
      app.use((req, res, next) => {
        next(new Error('msg'))
      })

      app.use((err, req, res, next) => {
        res.end(`got error ${err.message}`)
      })

      request(app)
        .get('/')
        .expect('got error msg', done)
    })

    it('should skip to non-error middleware', (done) => {
      let invoked = false

      app.use((req, res, next) => {
        next(new Error('msg'))
      })
      app.use((req, res, next) => {
        invoked = true
        next()
      })
      app.use((err, req, res, next) => {
        res.end(invoked ? 'invoked' : err.message)
      })

      request(app)
        .get('/')
        .expect(200, 'msg', done)
    })

    it('should start at error middleware declared after error', (done) => {
      let invoked = false

      app.use((err, req, res, next) => {
        res.end(`fail: ${err.message}`)
      })
      app.use((req, res, next) => {
        next(new Error('boom!'))
      })
      app.use((err, req, res, next) => {
        res.end(`pass: ${err.message}`)
      })

      request(app)
        .get('/')
        .expect(200, 'pass: boom!', done)
    })

    it('should stack error fns', (done) => {
      app.use((req, res, next) => {
        next(new Error('msg'))
      })
      app.use((err, req, res, next) => {
        res.setHeader('X-Error', err.message)
        next(err)
      })
      app.use((err, req, res, next) => {
        res.end(`got error ${err.message}`)
      })

      request(app)
        .get('/')
        .expect('X-Error', 'msg')
        .expect(200, 'got error msg', done)
    })

    it('should invoke error stack even when headers sent', (done) => {
      app.use((req, res, next) => {
        res.end('0')
        next(new Error('msg'))
      })
      app.use((err, req, res, next) => {
        done()
      })

      request(app)
        .get('/')
        .end(() => {})
    })
  })
})
