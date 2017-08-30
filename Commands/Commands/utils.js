var commands = []

// var checker = require('../../Utils/access_checker')
// var logger = require('../../Utils/error_loggers')
var config = require('../../config.js')
var analytics = require('../../Utils/orwell.js')
var bugsnag = require('bugsnag')
const Dash = require('rethinkdbdash')
const r = new Dash()
const roles = require('../../roles')

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

commands['autorole-rerun'] = {
  adminOnly: true,
  modOnly: false, 
  fn: function (bot, msg) {
    msg.reply('rerunning autorole...').then(() => {
      analytics.roleUsers(msg.guild, bot)
    })
  }
}

commands['streak-mod'] = {
  adminOnly: true,
  modOnly: false,
  fn: function (bot, msg, suffix) {
    msg.channel.sendTyping()
    let parts = suffix.split(' ')
    analytics.getPoints(parts[0]).then(data => {
      let now = new Date()
      let today = new Date(now.getFullYear(), now.getUTCMonth(), now.getUTCDate()).getTime()
      if (data === null) return msg.reply('no data for this user, cannot edit.')
      let moment = require('moment')
      let newstreak = []
      for (let x = parseInt(parts[1]); x !== 0; x--) {
        let date = new Date(moment(today).subtract(x, 'days')).getTime().toString()
        newstreak.push(date)
      }
      analytics.arbitraryEdit(parts[0], newstreak).then(() => {
        return msg.reply('analytics data edited.')
      }).catch(() => {
        return msg.reply('something went wrong.')
      })
    }).catch(() => {
      return msg.reply('cannot fetch data.')
    })
  }
}

commands.stats = {
  adminOnly: false,
  modOnly: false,
  fn: function (bot, msg) {
    let moment = require('moment') // forgive me father for i have sinned
    analytics.getPoints(msg.member.id).then(data => {
      if (data === null) return msg.reply("you don't have any stats registered right now.")
      let now = new Date()
      let today = new Date(now.getFullYear(), now.getUTCMonth(), now.getUTCDate()).getTime()
      let dataObj = {}
      if (data.messages) Object.entries(data.messages).forEach(m => dataObj[m[0]] ? Object.assign(dataObj[m[0]], { msgs: m[1] }) : dataObj[m[0]] = { msgs: m[1] })
      if (data.commands) Object.entries(data.commands).forEach(c => dataObj[c[0]] ? Object.assign(dataObj[c[0]], { cmds: c[1] }) : dataObj[c[0]] = { cmds: c[1] })
      let dataArr = Object.entries(dataObj).sort()
      let field = []

      for (let i in dataArr) {
        let date = dataArr[i][0]
        if (today - parseInt(date) <= 172800000) {
          let parsed = moment(parseInt(date)).format("MMM Do")
          if (data.messages && dataArr[i][1].msgs) field.push({
            name: `Messages on ${parsed}`,
            value: data.messages[date],
            inline: dataArr[i] ? (dataArr[i][1].cmds ? true : false) : false
          })
          if (data.commands && dataArr[i][1].cmds) field.push({
            name: `Commands on ${parsed}`,
            value: data.commands[date],
            inline: dataArr[i] ? (dataArr[i][1].msgs ? true : false) : false
          })
        }
      }

      let sortedRoles = Object.entries(roles).sort((a, b) => a[1].rank - b[1].rank)
      let nextRankByThres = sortedRoles.find(r => r[1].threshold > data.consecutive.length)
      let rolesID = sortedRoles.map(r => r[0])
      let ownedRoles = msg.member.roles.map(r => rolesID.includes(r.id) ? r.id : '')
      let highestRole = sortedRoles.findIndex(r => r[0] === ownedRoles[ownedRoles.length - 1])
      let nextRankByOwned = highestRole != -1 ? sortedRoles[highestRole + 1] : ''
      let nextRank = (nextRankByThres && nextRankByThres) ? ((ownedRoles.includes(nextRankByThres[0])) ? nextRankByOwned[1].threshold : nextRankByThres[1].threshold) - data.consecutive.length : 'N/A'

      field.push(
        {
          name: `Consecutive active days`,
          value: data.consecutive.length,
          inline: true
        },
        {
          name: `Days needed for next rank`,
          value: nextRank,
          inline: true
        }
      )
      msg.author.openDM().then((e) => {
        e.sendMessage('', false, {
          color: 0x59f442,
          title: `${msg.author.username} - Statistics`,
          thumbnail: {
            url: msg.author.staticAvatarURL
          },
          fields: field
        }).catch(bugsnag.notify) // Send Message to DM error
      }).then(msg.delete()).catch(bugsnag.notify) // Error opening DM channel
    }).catch(e => {
      msg.reply('an unexpected error occured while getting your stats, try again later.')
      console.error(e)
    })
  }
}

commands['stats-reset'] = {
  adminOnly: true,
  modOnly: false,
  fn: function (bot, msg, suffix) {
    r.db('DFB').table('analytics').get(suffix).then(data => {
      if (data !== null) {
        msg.reply(`you're about to reset the stats for ${suffix}, are you sure?`).then(() => {
          wait(bot, msg).then(resp => {
            if (resp === null) {
              msg.channel.sendMessage('No answer given in time, operation aborted.')
            }
            if (resp === false) {
              msg.channel.sendMessage('Operation aborted.')
            }
            if (resp === true) {
              msg.channel.sendMessage(`Are you **ABSOLUTELY** sure? This can not be undone!`).then(() => {
                wait(bot, msg).then(resp2 => {
                  if (resp2 === null) {
                    msg.channel.sendMessage('No answer given in time, operation aborted.')
                  }
                  if (resp2 === false) {
                    msg.channel.sendMessage('Operation aborted.')
                  }
                  if (resp2 === true) {
                    r.db('DFB').table('analytics').get(suffix).delete().run().then(() => {
                      msg.channel.sendMessage(`Stats for ${suffix} are deleted.`)
                    }).catch(e => {
                      bugsnag.notify(e)
                      msg.channel.sendMessage(`Failed to delete stats for ${suffix}`)
                    })
                  }
                })
              })
            }
          })
        })
      } else {
        msg.reply(`no data for ${suffix} found.`)
      }
    })
  }
}

commands.lookup = {
  adminOnly: true,
  modOnly: false,
  fn: function (bot, msg, suffix) {
    let moment = require('moment') // forgive me father for i have sinned
    analytics.getPoints((msg.mentions.length !== 0) ? msg.mentions[0].id : suffix).then(data => {
      if (data === null) return msg.reply("couldn't find data on this user.")
      let member = msg.guild.members.find(member => member.id === data.id)
      let now = new Date()
      let today = new Date(now.getFullYear(), now.getUTCMonth(), now.getUTCDate()).getTime()
      let dataObj = {}
      if (data.messages) Object.entries(data.messages).forEach(m => dataObj[m[0]] ? Object.assign(dataObj[m[0]], { msgs: m[1] }) : dataObj[m[0]] = { msgs: m[1] })
      if (data.commands) Object.entries(data.commands).forEach(c => dataObj[c[0]] ? Object.assign(dataObj[c[0]], { cmds: c[1] }) : dataObj[c[0]] = { cmds: c[1] })
      let dataArr = Object.entries(dataObj).sort()
      let field = []

      for (let i in dataArr) {
        let date = dataArr[i][0]
        if (today - parseInt(date) <= 172800000) {
          let parsed = moment(parseInt(date)).format("MMM Do")
          if (data.messages && dataArr[i][1].msgs) field.push({
            name: `Messages on ${parsed}`,
            value: data.messages[date],
            inline: dataArr[i] ? (dataArr[i][1].cmds ? true : false) : false
          })
          if (data.commands && dataArr[i][1].cmds) field.push({
            name: `Commands on ${parsed}`,
            value: data.commands[date],
            inline: dataArr[i] ? (dataArr[i][1].msgs ? true : false) : false
          })
        }
      }

      let sortedRoles = Object.entries(roles).sort((a, b) => a[1].rank - b[1].rank)
      let nextRankByThres = sortedRoles.find(r => r[1].threshold > data.consecutive.length)
      let rolesID = sortedRoles.map(r => r[0])
      let ownedRoles = member.roles.map(r => rolesID.includes(r.id) ? r.id : '')
      let highestRole = sortedRoles.findIndex(r => r[0] === ownedRoles[ownedRoles.length - 1])
      let nextRankByOwned = highestRole != -1 ? sortedRoles[highestRole + 1] : ''
      let nextRank = (nextRankByThres && nextRankByThres) ? ((ownedRoles.includes(nextRankByThres[0])) ? nextRankByOwned[1].threshold : nextRankByThres[1].threshold) - data.consecutive.length : 'N/A'

      field.push(
        {
          name: `Consecutive active days`,
          value: data.consecutive.length,
          inline: true
        },
        {
          name: `Days needed for next rank`,
          value: nextRank,
          inline: true
        }
      )
      msg.channel.sendMessage('', false, {
        color: 0x59f442,
        title: `Statistics for ${member.username}#${member.discriminator}`,
        thumbnail: {
          url: member.staticAvatarURL
        },
        fields: field
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

function wait (bot, msg) {
  let yn = /^y(es)?$|^n(o)?$/i
  return new Promise((resolve, reject) => {
    bot.Dispatcher.on('MESSAGE_CREATE', function doStuff (c) {
      var time = setTimeout(() => {
        resolve(null)
        bot.Dispatcher.removeListener('MESSAGE_CREATE', doStuff)
      }, config.timeouts.duplicateConfirm) // We won't wait forever for the person to anwser
      if (c.message.channel.id !== msg.channel.id) return
      if (c.message.author.id !== msg.author.id) return
      if (c.message.content.match(yn) === null) return
      else {
        resolve((c.message.content.match(/^y(es)?/i) !== null))
        bot.Dispatcher.removeListener('MESSAGE_CREATE', doStuff)
        clearTimeout(time)
      }
    })
  })
}

exports.Commands = commands
