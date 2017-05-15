var commands = []
var state = {}
var checker = require('../../Utils/access_checker')
var logger = require('../../Utils/error_loggers')
var genlog = require('../../Utils/generic_logger')
var config = require('../../config.js')
var bugsnag = require('bugsnag')

bugsnag.register(config.discord.bugsnag)

try {
  state = JSON.parse(require('fs').readFileSync('./dump.json', 'utf8'))
  console.log('Queue restored!')
} catch (e) {
  console.log('Failed to restore queue! ' + e.message)
}

commands.newCardInit = {
  internal: true,
  fn: function (msg) {
    state[msg.id] = {
      type: 'newCard',
      reports: 0,
      embed: msg.embeds[0],
      UvId: msg.embeds[0].footer.text.split('ID: ')[1]
    }
    msg.addReaction({
      id: '302137374920671233',
      name: 'report'
    })
    msg.addReaction({
      id: '302138464986595339',
      name: 'upvote'
    })
  }
}

commands.registerVote = {
  internal: true,
  fn: function (msg, reaction, bot, uv, user) {
    if (msg === null) {
      console.warn('Warning! Vote registering failed due to the message not being cached!')
      return
    }
    if (state[msg.id] === undefined) {
      console.warn('Warning! Vote registering failed due to the report not being known to memory!')
      return
    }
    switch (state[msg.id].type) {
      case 'newCard': {
        if (reaction.id === '302137374920671233') {
          check.getLevel(user.memberOf('268811439588900865'), function (l) {
            if (l > 0) {
              genlog.log(bot, user, {
                message: 'Reported a card as inappropriate in the feed',
                affected: state[msg.id].UvId,
                result: (state[msg.id].reports === config.discord.reportThreshold) ? 'Report has been sent to admins': undefined
              })
              state[msg.id].reports++
              if (state[msg.id].reports === config.discord.reportThreshold) {
                bot.Channels.get(config.discord.feedChannel).sendMessage(`Feedback with ID ${state[msg.id].UvId} (${msg.embeds[0].title}) has been sent off for admin review.`)
                state[msg.id].type = 'adminReviewDelete'
                switchIDs(state[msg.id], bot)
                delete state[msg.id]
              }
            }
          })
        } else if (reaction.id === '302138464986595339') {
          getMail(uv, user.id).then(f => {
            uv.loginAs(f).then(c => {
              c.post(`forums/${config.uservoice.forumId}/suggestions/${state[msg.id].UvId}/votes.json`, {
                to: 1
              }).then((s) => {
                if (user !== null) {
                  genlog.log(bot, user, {
                    message: 'Feed-voted',
                    affected: state[msg.id].UvId
                  })
                  bot.Channels.get(config.discord.feedChannel).sendMessage(`${user.mention}, your vote has been registered.`).then(c => {
                    setTimeout(() => c.delete(), 5000)
                  })
                }
              }).catch(e => {
                if (e.statusCode === 404) {
                  logger.log(bot, {
                    cause: 'feed_vote',
                    message: (e.message !== undefined) ? e.message : JSON.stringify(e)
                  })
                } else {
                  logger.log(bot, {
                    cause: 'feed_vote_apply',
                    message: (e.message !== undefined) ? e.message : JSON.stringify(e)
                  })
                }
              })
            }).catch(e => {
              logger.log(bot, {
                cause: 'login_as',
                message: (e.message !== undefined) ? e.message : JSON.stringify(e)
              }).catch(e => {
                 if (e === 'Not found') {
                  bot.Channels.get(config.discord.feedChannel).sendMessage(`${user.mention}, your details are not found.`).then(c => {
                    setTimeout(() => c.delete(), 5000)
                  })
                } else {
                  logger.log(bot, {
                    cause: 'email_search',
                    message: (e.message !== undefined) ? e.message : JSON.stringify(e)
                  })
                }
              })
            })
          })
        }
        break
      }
      case 'adminReviewDelete': {
        if (reaction.id === '302137375113609219') {
          genlog.log(bot, user, {
            message: 'Dismissed a report',
            affected: state[msg.id].UvId,
          })
          bot.Channels.find(c => c.name === 'admin-queue').sendMessage(`The report for ${state[msg.id].embed.title} has been dismissed, no action has been taken.`).then(o => {
            setTimeout(() => bot.Messages.deleteMessages([o.id, msg.id], bot.Channels.find(c => c.name === 'admin-queue').id), 5000)
          })
          delete state[msg.id]
        } else if (reaction.id === '302137375092375553') {
          genlog.log(bot, user, {
            message: 'Approved a report',
            affected: state[msg.id].UvId,
            result: `Card with ID ${state[msg.id].UvId} has been deleted`
          })

          bot.Channels.find(c => c.name === 'admin-queue').sendMessage(`The report for ${state[msg.id].embed.title} has been approved, the card has been deleted from Uservoice.`).then(o => {
            setTimeout(() => bot.Messages.deleteMessages([o.id, msg.id], bot.Channels.find(c => c.name === 'admin-queue').id), 5000)
          })
          deleteFromUV(state[msg.id].UvId, uv, bot)
          delete state[msg.id]
        }
        break
      }
    }
  }
}

function switchIDs (og, bot) {
  bot.Channels.find(c => c.name === 'admin-queue').sendMessage('The following card was reported as inappropriate, please confirm this report.\n**Confirming this report will DESTROY the card, please be certain.**', false, og.embed).then(b => {
    b.addReaction({
      name: 'approve',
      id: '302137375092375553'
    })
    b.addReaction({
      name: 'deny',
      id: '302137375113609219'
    })
    state[b.id] = og
  })
}

function deleteFromUV (UVID, uvClient, bot) {
  uvClient.loginAsOwner().then(i => {
    i.delete(`forums/${config.uservoice.forumId}/suggestions/${UVID}.json`).catch((e) => {
      logger.log(bot, {
        cause: 'card_destroy',
        message: (e.message !== undefined) ? e.message : JSON.stringify(e)
      })
    })
  }).catch((e) => {
    logger.log(bot, {
      cause: 'card_destroy',
      message: (e.message !== undefined) ? e.message : JSON.stringify(e)
    })
  })
}

function getMail (uv, user) {
  return new Promise(function (resolve, reject) {
    if (config.debug === true) return resolve('hello@dougley.com') // no dox pls
    uv.loginAsOwner().then(i => {
      i.get('users/search.json', {
        guid: user
      }).then((data) => {
        if (data.users === undefined || data.users.length !== 1) {
          return reject('Not found')
        } else {
          return resolve(data.users[0].email)
        }
      }).catch(reject)
    }).catch(reject)
  })
}

function saveTheWorld () {
  console.log('About to exit! Attempting to dump current report memory to file...')
  try {
    require('fs').writeFileSync('./dump.json', JSON.stringify(state))
    console.log('Queue saved.')
  } catch (e) {
    console.log('Error when writing json file! QUEUE HAS NOT BEEN SAVED!')
  }
  process.exit()
}

process.on('exit', () => {
  saveTheWorld()
})

exports.Commands = commands
