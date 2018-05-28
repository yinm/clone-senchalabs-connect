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

})