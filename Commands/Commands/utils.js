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
