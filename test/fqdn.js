const assert = require('assert')
const connect = require('..')
const http = require('http')
const rawrequest = require('./support/rawagent')

describe('app.use()', () => {
  let app

  beforeEach(() => {
    app = connect()
  })

  it('should not obscure FQDNs', (done) => {
    app.use((req, res) => {
      res.end(req.url)
    })

    rawrequest(app)
      .get('http://example.com/foo')
      .expect(200, 'http://example.com/foo', done)
  })

})
