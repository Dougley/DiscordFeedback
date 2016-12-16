var commands = []

commands.ping = {
  adminOnly: true,
  modOnly: false,
  fn: function (client, message) {
    message.reply('Pong!')
  }
}

commands['admin-only'] = {
  adminOnly: true,
  modOnly: false,
  fn: function (client, message, suffix) {
    message.reply(suffix)
  }
}

commands['mod-only'] = {
  adminOnly: false,
  modOnly: true,
  fn: function (client, message, suffix) {
    message.reply(suffix)
  }
}

exports.Commands = commands
