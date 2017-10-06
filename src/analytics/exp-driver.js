const Driver = require('./driver')
const r = require('../models/rethinkdb')

module.exports = {
  countEXP: (userid, exp) => {
    Driver.touch(userid)
    return Driver.increment(userid, 'exp', exp).run()
  },
  getEXP: (userid) => {
    return r.table('analytics').get(userid).pluck('exp').run()
  },
  getEveryone: () => {
    return r.table('analytics').run()
  }
}