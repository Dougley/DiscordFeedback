const UV = require('../models/uservoice')
const Constants = require('../../constants')

module.exports = {
  getMail: (userid) => {
    return new Promise((resolve, reject) => {
      if (Constants.Debugging.enable) return resolve(Constants.Debugging.mocking.email)
      UV.v1.loginAsOwner().then(client => {
        client.get('users/search.json', {
          guid: userid
        }).then(result => {
          if (!result.users || result.users.length !== 1) return reject(false)
          else return resolve(result.users[0].email)
        }).catch(reject)
      }).catch(reject)
    })
  }
}