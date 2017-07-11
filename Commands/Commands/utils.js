var commands = []

// var checker = require('../../Utils/access_checker')
// var logger = require('../../Utils/error_loggers')
var config = require('../../config.js')
var analytics = require('../../Utils/orwell.js')
var bugsnag = require('bugsnag')

bugsnag.register(config.discord.bugsnag)

commands.ping = {
  phantom: true,
  adminOnly: true,
  modOnly: false,
  fn: function (bot, msg) {
    msg.channel.sendMessage('Pong!').then(successmsg => {
      setTimeout(() => bot.Messages.deleteMessages([msg, successmsg]), config.timeouts.messageDelete)
    })
  }
}

commands.help = {
  adminOnly: false,
  modOnly: false,
  fn: function (bot, msg) {
    msg.channel.sendMessage(`Hey ${msg.author.mention}! You can find all the info you need about the bot over at <#268812893087203338>!`).then(successmsg => {
      setTimeout(() => bot.Messages.deleteMessages([msg, successmsg]), config.timeouts.errorMessageDelete)
    })
  }
}

commands.stats = {
  adminOnly: false,
  modOnly: false,
  fn: function (bot, msg) {
    msg.channel.sendTyping()
    let moment = require('moment') // forgive me father for i have sinned
    analytics.getPoints(msg.member.id).then(data => {
      if (data === null) return msg.reply("you don't have any stats registered right now.")
      let now = new Date()
      let today = new Date(now.getFullYear(), now.getUTCMonth(), now.getUTCDate()).getTime()
      let messagesField = []
      let commandsField = []
      for (let date in data.messages) {
        if (today - parseInt(date) <= 172800000) {
          let parsed = moment(parseInt(date)).format("MMM Do YYYY")
          messagesField.push({
            name: `Messages on ${parsed} | `,
            value: data.messages[date],
            inline: true
          })
        }
        if (messagesField.length === 3) break
      }
      for (let date in data.commands) {
        if (today - parseInt(date) <= 172800000) {
          let parsed = moment(parseInt(date)).format("MMM Do YYYY")
          commandsField.push({
            name: `Commands on ${parsed} | `,
            value: data.messages[date],
            inline: false
          })
          if (commandsField.length === 3) break
        }
      }
      commandsField.push({
        name: `Consecutive active days`,
        value: data.consecutive.length,
        inline: true
      })
      msg.channel.sendMessage('', false, {
        color: 0x59f442,
        title: `${msg.author.username} - Statistics`,
        thumbnail: {
          url: msg.author.avatarURL
        },
        fields: messagesField.concat(commandsField)
      })
    }).catch(e => {
      msg.reply('an unexpected error occured while getting your stats, try again later.')
      console.error(e)
    })
  }
}

commands.lookup = {
  adminOnly: true,
  modOnly: false,
  fn: function (bot, msg, suffix) {
    msg.channel.sendTyping()
    let moment = require('moment') // forgive me father for i have sinned
    analytics.getPoints(suffix).then(data => {
      if (data === null) return msg.reply("couldn't find data on this user.")
      let now = new Date()
      let today = new Date(now.getFullYear(), now.getUTCMonth(), now.getUTCDate()).getTime()
      let messagesField = []
      let commandsField = []
      for (let date in data.messages) {
        if (today - parseInt(date) <= 172800000) {
          let parsed = moment(parseInt(date)).format("MMM Do YYYY")
          messagesField.push({
            name: `Messages on ${parsed}`,
            value: data.messages[date],
            inline: true
          })
        }
        if (messagesField.length === 3) break
      }
      for (let date in data.commands) {
        if (today - parseInt(date) <= 172800000) {
          let parsed = moment(parseInt(date)).format("MMM Do YYYY")
          commandsField.push({
            name: `Commands on ${parsed}`,
            value: data.commands[date],
            inline: false
          })
          if (commandsField.length === 3) break
        }
      }
      commandsField.push({
        name: `Consecutive active days`,
        value: data.consecutive.length,
        inline: false
      })
      msg.channel.sendMessage('', false, {
        color: 0x59f442,
        title: `Statistics for ${suffix}`,
        fields: messagesField.concat(commandsField)
      })
    }).catch(e => {
      msg.reply('an unexpected error occured while getting your stats, try again later.')
      console.error(e)
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
        setTimeout(() => bot.Messages.deleteMessages([msg, f]), config.timeouts.messageDelete)
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
