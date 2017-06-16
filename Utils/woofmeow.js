const SA = require('superagent')

module.exports = {
  woofmeow: () => { return (Math.round(Math.random()) === 1) ? module.exports.woof() : module.exports.meow() },
  woof: () => {
    return new Promise((resolve, reject) => {
      SA.get('https://random.dog/woof.json')
        .end((e, r) => {
          if (!e && r.status === 200) return resolve(r.body.url)
          else return reject(e)
        })
    })
  },
  meow: () => {
    return new Promise((resolve, reject) => {
      SA.get('https://random.cat/meow')
        .end((e, r) => {
          if (!e && r.status === 200) return resolve(r.body.file)
          else return reject(e)
        })
    })
  }
}
