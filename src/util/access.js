const Constants = require('../../constants.js')
const Config = require('../../config.js')

module.exports = {
  check: (user) => {
    return new Promise((resolve, reject) => {
      if (Constants.DefaultPerms.users[user.id]) return resolve(Constants.DefaultPerms.users[user.id])
      let result = 0
      for (let role in user.roles) {
        if (Constants.DefaultPerms.roles[role.id]) return resolve(Constants.DefaultPerms.users[user.id])
        if (Config.Settings.roles[role.id]) {
          result = (result < Config.Settings.roles[role.id]) ? Config.Settings.roles[role.id] : result
        }
        return resolve(result)
      }
    })
  }
}