const Discordie = require('discordie')
const UserVoice = require('uservoice-nodejs')
const Events = Discordie.Events
const Config = require('./config.js')
const Commands = require('./Utils/command_engine').Commands
const AccessChecker = require('./Utils/access_checker')
const ErrorLog = require('./Utils/error_loggers')
const bot = new Discordie({
  autoReconnect: true,
  messageCacheLimit: Config.discord.messageCacheLimit
})

var bugsnag = require('bugsnag')

bugsnag.register(Config.discord.bugsnag)

var uvClient = new UserVoice.Client({
  subdomain: Config.uservoice.subdomain.trim(),
  domain: Config.uservoice.domain.trim(),
  apiKey: Config.uservoice.key.trim(),
  apiSecret: Config.uservoice.secret.trim()
})

bot.Dispatcher.on(Events.MESSAGE_CREATE, (c) => {
  if (c.message.channel.id === Config.discord.feedChannel && c.message.author.id !== bot.User.id) {
    Commands['newCardInit'].fn(c.message)
    return
  }
  if (c.message.isPrivate === true) return
  if (c.message.content.indexOf(Config.discord.prefix) === 0) {
    var cmd = c.message.content.substr(Config.discord.prefix.length).split(' ')[0].toLowerCase()
    var suffix
    suffix = c.message.content.substr(Config.discord.prefix.length).split(' ')
    suffix = suffix.slice(1, suffix.length).join(' ')
    var msg = c.message
    if (Commands[cmd]) {
      if (Commands[cmd].internal === true) return
      AccessChecker.getLevel(msg.member, (level) => {
        if (level === 0 && Commands[cmd].adminOnly === true || level === 0 && Commands[cmd].modOnly === true) {
          msg.reply('this command is restricted, and not available to you.')
          return
        }
        if (level === 1 && Commands[cmd].adminOnly === true) {
          if (Commands[cmd].phantom !== undefined) msg.reply('sorry, only admins can use this command.')
          return
        }
        try {
          Commands[cmd].fn(bot, msg, suffix, uvClient)
        } catch (e) {
          ErrorLog.log(bot, {
            cause: cmd,
            message: e.message
          })
          msg.reply('an error occurred while processing this command, the admins have been alerted, please try again later')
        }
      })
    }
  }
})

bot.Dispatcher.on(Events.MESSAGE_REACTION_ADD, (m) => {
  if (m.user.id !== bot.User.id) {
    if (m.channel.id === Config.discord.feedChannel || m.channel.name === 'admin-queue') {
      Commands['registerVote'].fn(m.message, m.emoji, bot, uvClient)
    }
  }
})

bot.Dispatcher.on(Events.GATEWAY_READY, () => {
  setInterval(() => {
    bot.Users.fetchMembers() // Hacky way to cache offline users, #blamelazyloading
  }, 600000)
  console.log('Feedback bot is ready!')
})

process.on('unhandledRejection', (reason, p) => {
  if (p !== null && reason !== null) {
    bugsnag.notify(new Error(`Unhandled promise: ${require('util').inspect(p, {depth: 3})}: ${reason}`))
  }
})

bot.Dispatcher.on(Events.DISCONNECTED, (e) => {
  console.error('Connection to Discord has been lost... Delay till reconnect:', e.delay)
})

bot.Dispatcher.on(Events.GATEWAY_RESUMED, () => {
  console.log('Reconnected.')
})

bot.connect({
  token: Config.discord.token
})
