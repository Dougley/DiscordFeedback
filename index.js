const Discordie = require('discordie')
const bot = new Discordie()
const Events = Discordie.Events
const Config = require('./config.js')
const Commands = require('./Utils/command_engine').Commands
const AccessChecker = require('./Utils/access_checker')

bot.Dispatcher.on(Events.MESSAGE_CREATE, (c) => {
  var cmd = c.message.content.substr(Config.prefix.length).split(' ')[0].toLowerCase()
  var suffix
  suffix = c.message.content.substr(Config.prefix.length).split(' ')
  suffix = suffix.slice(1, suffix.length).join(' ')
  var msg = c.message
  if (Commands[cmd]) {
    AccessChecker.getLevel(msg.member, (level) => {
      if (level === 0 && Commands[cmd].adminOnly === true || level === 0 && Commands[cmd].modOnly === true) {
        msg.reply('this command is restricted, and not available to you.')
        return
      }
      if (level === 1 && Commands[cmd].adminOnly === true) {
        msg.reply('sorry, only admins can use this command.')
        return
      }
      try {
        Commands[cmd].fn(bot, msg, suffix)
      } catch (e) {
        console.error(e)
        msg.reply('an error occured while proccessing this command, the admins have been alerted, please try again later')
      }
    })
  }
})

bot.Dispatcher.on(Events.GATEWAY_READY, () => {
  console.log('Feedback bot is ready!')
})

bot.Dispatcher.on(Events.DISCONNECTED, () => {
  console.error('Connection to Discord has been lost, exiting...')
  process.exit(1)
})

bot.connect({
  token: Config.token
})
