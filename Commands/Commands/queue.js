var commands = []
var state = {}
var checker = require('../../Utils/access_checker')
var logger = require('../../Utils/error_loggers')
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
  }
}

commands.registerVote = {
  internal: true,
  fn: function (msg, reaction, bot, uv) {
    switch (state[msg.id].type) {
      case 'newCard': {
        if (reaction.id === '302137374920671233') {
          state[msg.id].reports++
          if (state[msg.id].reports === config.discord.reportThreshold) {
            bot.Channels.get(config.discord.feedChannel).sendMessage(`Feedback with ID ${state[msg.id].UvId} (${msg.embeds[0].title}) has been send off for admin review.`)
            state[msg.id].type = 'adminReviewDelete'
            switchIDs(state[msg.id], bot)
            delete state[msg.id]
          }
        }
        break
      }
      case 'adminReviewDelete': {
        if (reaction.id === '302137375113609219') {
          bot.Channels.find(c => c.name === 'admin-queue').sendMessage(`The report for ${state[msg.id].embed.title} has been dismissed, no action has been taken.`).then(o => {
            setTimeout(() => bot.Messages.deleteMessages([o.id, msg.id], bot.Channels.find(c => c.name === 'admin-queue').id), 5000)
          })
          delete state[msg.id]
        } else if (reaction.id === '302137375092375553') {
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
