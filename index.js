const Discordie = require('discordie')
const UserVoice = require('uservoice-nodejs')
const Events = Discordie.Events
const Config = require('./config.js')
const logger = require('./Utils/error_loggers')
const Commands = require('./Utils/command_engine').Commands
const AccessChecker = require('./Utils/access_checker')
const genlog = require('./Utils/generic_logger')
const woofmeow = require('./Utils/woofmeow')
const Analytics = require('./Utils/orwell')
const bot = new Discordie({
  autoReconnect: true
})

const UVRegex = /https?:\/\/[\w.]+\/forums\/(\d{6,})-[\w-]+\/suggestions\/(\d{7,})(?:-[\w-]*)?/

const uvClient = {
  v1: new UserVoice.Client({
    subdomain: Config.uservoice.subdomain.trim(),
    domain: Config.uservoice.domain.trim(),
    apiKey: Config.uservoice.key.trim(),
    apiSecret: Config.uservoice.secret.trim()
  }),
  v2: new UserVoice.ClientV2({
    clientId: Config.uservoice.key.trim(),
    subdomain: Config.uservoice.UVDomain.trim()
  })
}

bot.Dispatcher.on(Events.MESSAGE_CREATE, (c) => {
  if (c.message.isPrivate === true) return
  if (c.message.channel.id !== Config.discord.feedChannel && c.message.content.match(UVRegex) !== null && c.message.content.indexOf(Config.discord.prefix) !== 0) {
    let parts = c.message.content.match(UVRegex)
    Commands['chatVoteInit'].fn(c.message, parts[2], uvClient)
  }
  if (c.message.channel.id === Config.discord.feedChannel && c.message.author.id !== bot.User.id && c.message.author.bot) {
    Commands['newCardInit'].fn(c.message)
    return
  }
  if (!c.message.author.bot && !c.message.content.startsWith(Config.discord.prefix)) {
    Analytics.awardPoints(c.message.author.id, 'messages')
  }
  if (c.message.content.indexOf(Config.discord.prefix) === 0) {
    let cmd = c.message.content.substr(Config.discord.prefix.length).split(' ')[0].toLowerCase()
    let suffix
    suffix = c.message.content.substr(Config.discord.prefix.length).split(' ')
    suffix = suffix.slice(1, suffix.length).join(' ')
    let msg = c.message
    if (Commands[cmd]) {
      if (Commands[cmd].internal === true) return
      AccessChecker.getLevel(msg.member, (level) => {
        if (level === 0 && Commands[cmd].modOnly === true) {
          if (Commands[cmd].phantom !== undefined) msg.reply('this command is restricted, and not available to you.')
          return
        } else if (level !== 2 && Commands[cmd].adminOnly === true) return
        try {
          Commands[cmd].fn(bot, msg, suffix, uvClient, (res) => {
            genlog.log(bot, c.message.author, {
              message: `Ran the command \`${cmd}\``,
              result: res.result,
              affected: res.affected,
              awardPoints: true
            })
          })
        } catch (e) {
          logger.log(bot, {
            cause: cmd,
            message: e.message
          })
          woofmeow.woofmeow().then((c) => {
            msg.reply(`an error occurred while processing this command, the admins have been alerted, please try again later.\nHere's your consolation animal image: ${c}`)
          })
        }
      })
    }
  }
})

bot.Dispatcher.on(Events.MESSAGE_REACTION_ADD, (m) => {
  if (m.user.id !== bot.User.id) {
    if (m.message === null) {
      bot.Channels.get(m.data.channel_id).fetchMessages().then(() => {
        m.message = bot.Messages.get(m.data.message_id)
      })
    }
    Commands['registerVote'].fn(m.message, m.emoji, bot, uvClient, m.user)
  }
})

bot.Dispatcher.on(Events.GUILD_MEMBER_UPDATE, (c) => {
  for (let role of c.rolesAdded) {
    if (role.id === '268815388882632704') {
      bot.Channels.get('284796966641205249').sendMessage(`Welcome ${c.member.mention} to the custodians!`)
    }
  }
})

bot.Dispatcher.on(Events.GATEWAY_READY, () => {
  setInterval(() => {
    bot.Users.fetchMembers() // Hacky way to cache offline users, #blamelazyloading
  }, 600000)
  console.log('Feedback bot is ready!')
  
  // Autorole!
  Analytics.roleUsers(bot.Guilds.get(Config.discord.guild), bot)
  setInterval(() => {
    Analytics.roleUsers(bot.Guilds.get(Config.discord.guild), bot)
  }, 3600000) // once an hour

  Commands['initializeTop'].fn(bot, uvClient)
})

process.on('uncaughtException', (err) => {
  logger.raven(err.stack || err)
})

process.on('unhandledRejection', (reason, p) => {
  if (p !== null && reason !== null) {
    if (reason instanceof Error) logger.raven(reason)
    else logger.raven(new Error(`Unhandled promise: ${require('util').inspect(p, {depth: 3})}: ${reason}`))
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
