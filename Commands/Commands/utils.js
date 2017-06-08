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
    msg.channel.sendMessage('Pong!')
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
        }, 2500)
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
