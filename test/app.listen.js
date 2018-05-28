const connect = require('..')
const request = require('supertest')

describe('app.listen()', () => {
  it('should wrap in an http.Server', (done) => {
    const app = connect()

    app.use((req, res) => {
      res.end()
    })

    app.listen(0, () => {
      request(app)
        .get('/')
        .expect(200, done)
    })
  })
})
