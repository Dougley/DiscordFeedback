const AccessCheck = require('../util/access')
const Commands = require('../commands/index')
const Config = require('../../config')

module.exports = function (ctx) {
  if (ctx.message.content.indexOf(Config.Discord.prefix) === 0) {
    let parts = ctx.message.content.substr(Config.Discord.prefix.length).split(' ')
    let suffix = parts.slice(1, parts.length).join(' ')
    let cmd = parts[0].toLowerCase()
    if (Commands[cmd]) {
      if (!Commands[cmd].meta.enabledms && ctx.message.isPrivate) return ctx.channel.sendMessage('This command cannot be used in DMs.')
      AccessCheck.check(ctx.message.member).then(result => {
        // eslint-disable-next-line promise/always-return
        if (result >= Commands[cmd].meta.level) return Commands[cmd].fn(ctx.message, suffix)
      }).catch(e => {
        console.error(e)
      })
    }
  }
}