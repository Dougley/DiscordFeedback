const Dash = require('rethinkdbdash')
const r = new Dash()

module.exports = {
  awardPoints: (user, type) => {
    return new Promise((resolve, reject) => {
      let now = new Date()
      let today = new Date(now.getFullYear(), now.getUTCMonth(), now.getUTCDate()).getTime()
      let consecutive
      r.db('DFB').table('analytics').get(user).then(o => {
        if (o === null) return r.db('DFB').table('analytics').insert({
          id: user,
          consecutive: []
        })
        consecutive = o.consecutive !== undefined ? o.consecutive : [today.toString()]
        if (consecutive.indexOf(today.toString()) === -1) {
          let last = new Date(parseInt(consecutive[consecutive.length -1]))
          let difference = today - last
          if (difference === 86400000) { // 1 day difference
            consecutive.push(today.toString())
          } else {
            consecutive = [today.toString()]
          }
        }
        r.db('DFB').table('analytics').get(user).update({
          [type]: { [today]: r.row(type)(today.toString()).default(0).add(1) },
          consecutive: consecutive
        }).run().then(resolve).catch(reject)
      })
    })
  },
  getPoints: (user) => {
    return new Promise((resolve, reject) => {
      r.db('DFB').table('analytics').get(user).run().then(resolve).catch(reject)
    })
  }
}