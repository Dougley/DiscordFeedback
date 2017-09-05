const Entities = require('html-entities').AllHtmlEntities
const config = require('../../config.js')
const entities = new Entities()
const Dash = require('rethinkdbdash')
const r = new Dash()

let commands = []

commands.initializeTop = {
  internal: true,
  fn: function (bot, uv) {
    generateTop(bot, uv)
    setInterval(() => generateTop(bot, uv), 3600000) // update the top 10 hourly
  }
}

commands.regenerate = {
  adminOnly: true,
  modOnly: false,
  fn: function (bot, msg, suffix, uv) {
    msg.reply('regenerating the top 10, this could take a while...').then((msg) => {
      generateTop(bot, uv).then(() => {
        msg.edit('Done! You can check the results at <#268812972401360906>')
      })
    })
  }
}

function generateTop (bot, uv) {
  return new Promise(function(resolve, reject) {
    let channel = bot.Channels.find(c => c.name === 'top-10-suggestions')
    let messages
    let counter = 0
    let fetched = false
    channel.fetchMessages().then(msgs => {
      messages = msgs.messages.filter(y => y.author.id === bot.User.id)
      fetched = messages.length > 0
      return uv.v1.loginAsOwner()
    }).then(f => {
      f.get(`forums/${config.uservoice.forumId}/suggestions.json`, {
        per_page: 25
      }).then(data => {
        for (let suggestion of data.suggestions) {
          if (counter === 10) break
          if (!suggestion.status || suggestion.status && suggestion.status.name !== 'completed') {
            counter++
            generateEmbed(suggestion).then(embed => {
              let message = messages.pop()
              if (!message && fetched === false) {
                channel.sendMessage('', false, embed).then(msg => {
                  r.db('DFB').table('queue').insert({
                    id: msg.id,
                    type: 'upvoteOnly',
                    UvId: suggestion.id
                  }).then(() => {
                    msg.addReaction({
                      id: '302138464986595339',
                      name: 'upvote'
                    })
                  })
                })
              } else {
                message.edit('', embed).then(msg => {
                  r.db('DFB').table('queue').get(msg.id).then(doc => {
                    if (doc.UvId !== suggestion.id) msg.clearReactions()
                    r.db('DFB').table('queue').get(msg.id).update({
                      type: 'upvoteOnly',
                      UvId: suggestion.id
                    }).then(() => {
                      msg.addReaction({
                        id: '302138464986595339',
                        name: 'upvote'
                      })
                    })
                  })
                })
              }
            })
          }
        }
        return resolve()
      })
    })
  })
}

function generateEmbed (data) {
  return new Promise(function(resolve, reject) {
    try {
      let embedFields = (data.response) ? [{
        name: "Votes",
        value: data.vote_count,
        inline: false
      }, {
        name: data.status ? `${entities.decode(data.status_changed_by.name)} set the status to ${entities.decode(data.status.name)}` : `${entities.decode(data.status_changed_by.name)} responded:`,
        value: (data.response) ? entities.decode(data.response.text).length > 2000 ? '*Content too long, check the feedback website instead.*' : entities.decode(data.response.text) : 'No comment',
        inline: false
      }] : [{
        name: "Votes",
        value: data.vote_count,
        inline: false
      }]
      return resolve({
        title: entities.decode(data.title),
        description: entities.decode(data.text).length > 2000 ? '*Content too long, check the feedback website instead.*' : entities.decode(data.text),
        url: data.url,
        timestamp: new Date(data.created_at),
        color: (data.status) ? parseInt(data.status.hex_color.substr(1), 16) : 0x595f68,
        footer: {
          text: (data.category) ? entities.decode(data.category.name) : 'Uncategorised'
        },
        author: {
          name: (data.creator) ? entities.decode(data.creator.name) : 'Anonymous',
          url: (data.creator) ? data.creator.url : undefined,
          icon_url: (data.creator) ? data.creator.avatar_url : 'https://assets1.uvcdn.com/pkg/admin/icons/user_70-62136f6de7efc58cc79dabcfed799c01.png' // This is the default UV avatar
        },
        fields: embedFields
      })
    } catch (e) {
      return reject(e)
    }
  })
}

exports.Commands = commands
