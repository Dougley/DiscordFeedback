var commands = []

var checker = require('../../Utils/access_checker')
var logger = require('../../Utils/error_loggers')
var config = require('../../config.js')
var bugsnag = require('bugsnag')

bugsnag.register(config.discord.bugsnag)

commands.ping = {
  phantom: true,
  adminOnly: true,
  modOnly: false,
  fn: function (bot, msg) {
    msg.channel.sendMessage('Pong!').then(successmsg => {
      setTimeout(() => successmsg.delete(), config.timeouts.messageDelete)
    })
  }
}

commands.help = {
  adminOnly: false,
  modOnly: false, 
  fn: function (bot, msg) {
    msg.channel.sendMessage(`Hey ${msg.author.mention}! You can find all the info you need about the bot over at <#268812893087203338>!`).then(successmsg => {
      setTimeout(() => successmsg.delete(), config.timeouts.messageDelete)
    })
  }
}

commands.fetch = {
  phantom: true,
  adminOnly: true,
  modOnly: false,
  fn: function (bot, msg) {
    msg.channel.fetchMessages().then(g => {
      msg.reply(`fetched ${g.messages.length} messages in this channel.`).then(f => {
        setTimeout(() => {
          f.delete()
          msg.delete()
        }, config.timeouts.messageDelete)
      })
    })
  }
}

commands.shutdown = {
  phantom: true,
  adminOnly: true,
  modOnly: false,
  fn: function (bot, msg) {
    msg.reply('shutting down...').then(() => {
      process.exit(0)
    })
  }
}

exports.Commands = commands
