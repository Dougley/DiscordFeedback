const UV = require('../models/uservoice')
const Constants = require('../../constants')
const Redis = require('../models/redis')

module.exports = {
  getMail: (userid) => {
    if (Constants.Debugging.enable) return Constants.Debugging.mocking.email
    UV.v1.loginAsOwner().then(client => {
      return client.get('users/search.json', {
        guid: userid
      })
    }).then(result => {
      if (!result.users || result.users.length !== 1) return Promise.reject
      else {
        Redis.set(`email:${userid}`, result.users[0].email)
        return result.users[0].email
      }
    }).catch(console.error)
  },
  getMailCached: (userid) => {
    Redis.get(`email:${userid}`).then(res => {
      if (res !== null) return res
      else return module.exports.getMail(userid)
    }).catch(Promise.reject)
  }
}
