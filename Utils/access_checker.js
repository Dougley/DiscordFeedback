const Config = require('../config.js')

exports.getLevel = function (member, callback) {
  for (var role of member.roles) {
    if (Config.discord.Roles.adminRoles.indexOf(role.id) > -1) {
      return callback(2)
    } else if (Config.discord.Roles.moderatorRoles.indexOf(role.id) > -1) {
      return callback(1)
    }
  }
  return callback(0)
}
