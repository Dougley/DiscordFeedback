const r = require('../models/rethinkdb')
const Moment = require('moment')

module.exports = {
  getDetails: (userid) => {
    return r.table('analytics').get(userid)
  },
  modify: (userid, details) => {
    return r.table('analytics').get(userid).update(details).run()
  },
  increment: (userid, datapoint, add = 1) => {
    module.exports.touch(userid)
    return r.table('analytics').get(userid).update({
      [datapoint]: r.row(datapoint).default(0).add(add)
    }).run()
  },
  touch: (userid) => {
    return r.table('analytics').get(userid).update({
      last_seen: new Date(Moment().startOf('day')).getTime().toString()
    }).run()
  }
}