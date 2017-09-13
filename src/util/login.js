const GetMail = require('./getmail')
const UV = require('../models/uservoice')
const Config = require('../../config.js')

module.exports = {
  userv1: (userid) => {
    return new Promise((resolve, reject) => {
      GetMail.getMailCached(userid).then(result => {
        if (!result) return reject(false)
        return UV.v1.loginAs(result)
      }).catch(reject)
    })
  },
  userv2: (userid) => {
    return new Promise((resolve, reject) => {
      GetMail.getMailCached(userid).then(result => {
        if (!result) return reject(false)
        return UV.v2.loginAs(result)
      }).catch(reject)
    })
  },
  ownerv1: () => {
    return UV.v1.loginAsOwner()
  },
  ownerv2: () => {
    return UV.v2.loginAsOwner(Config.Uservoice.keys.secret)
  }
}