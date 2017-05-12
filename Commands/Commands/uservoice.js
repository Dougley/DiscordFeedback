var commands = []

var checker = require('../../Utils/access_checker')
var logger = require('../../Utils/error_loggers')
var config = require('../../config.js')
var Entities = require('html-entities').AllHtmlEntities
var UVRegex = /http[s]?:\/\/[\w.]*\/forums\/([0-9]{6,})-[\w-]+\/suggestions\/([0-9]{8,})-[\w-]*/

entities = new Entities()

commands.vote = {
  adminOnly: false,
  modOnly: false,
  fn: function (bot, msg, suffix, uvClient) {
    msg.channel.sendTyping()
    getMail(uvClient, msg.author.id).then(email => {
      uvClient.loginAs(email).then(c => {
        let parts = suffix.match(UVRegex)
        let id
        if (parts === null) {
          id = suffix
        } else {
          id = parts[2]
        }
        c.post(`forums/${config.uservoice.forumId}/suggestions/${id}/votes.json`, {
          to: 1
        }).then((s) => {
          msg.reply('vote registered, thanks!')
        }).catch(e => {
          if (e.statusCode === 404) {
            msg.reply('unable to find a suggestion using your query.')
          } else {
            logger.log(bot, {
              cause: 'vote_apply',
              message: (e.message !== undefined) ? e.message : JSON.stringify(e)
            })
            msg.reply('an error occured, please try again later.')
          }
        })
      }).catch(e => {
        logger.log(bot, {
          cause: 'login_as',
          message: (e.message !== undefined) ? e.message : JSON.stringify(e)
        })
        msg.reply('an error occured, please try again later.')
      })
    }).catch(e => {
      if (e === 'Not found') {
        msg.reply("I was unable to find your details, make sure you've logged into the website at least once.")
      } else {
        logger.log(bot, {
          cause: 'email_search',
          message: (e.message !== undefined) ? e.message : JSON.stringify(e)
        })
        msg.reply('an error occured, please try again later.')
      }
    })
  }
}

commands.submit = {
  adminOnly: false,
  modOnly: false,
  fn: function (bot, msg, suffix, uvClient) {
    let channels = require('../../channels')
    let IDs = Object.getOwnPropertyNames(channels)
    if (IDs.indexOf(msg.channel.id) === -1) return
    let content = suffix.split(' | ')
    if (content.length !== 2) {
      msg.reply('This command only takes 2 arguments')
    } else {
      msg.channel.sendTyping()
      getMail(uvClient, msg.author.id).then(email => {
        uvClient.loginAs(email).then(c => {
          c.post(`forums/${config.uservoice.forumId}/suggestions.json`, {
            suggestion: {
              title: content[0],
              text: content[1],
              votes: 1,
              category_id: channels[msg.channel.id]
            }
          }).then(data => {
            msg.reply('your feedback has been submitted!', false, {
              color: 0x3498db,
              author: {
                name: entities.decode(data.suggestion.creator.name),
                icon_url: data.suggestion.creator.avatar_url,
                url: data.suggestion.creator.url
              },
              title: entities.decode(data.suggestion.title),
              description: (data.suggestion.text.length !== 2000) ? entities.decode(data.suggestion.text) : '*Content too long*',
              url: data.suggestion.url,
              footer: {
                text: entities.decode(data.suggestion.category.name)
              }
            })
          }).catch(e => {
            logger.log(bot, {
              cause: 'submit_feedback',
              message: (e.message !== undefined) ? e.message : JSON.stringify(e)
            })
            msg.reply('an error occured, please try again later.')
          })
        }).catch(e => {
          logger.log(bot, {
            cause: 'login_as',
            message: (e.message !== undefined) ? e.message : JSON.stringify(e)
          })
          msg.reply('an error occured, please try again later.')
        })
      }).catch(e => {
        if (e === 'Not found') {
          msg.reply("I was unable to find your details, make sure you've logged into the website at least once.")
        } else {
          logger.log(bot, {
            cause: 'email_search',
            message: (e.message !== undefined) ? e.message : JSON.stringify(e)
          })
          msg.reply('an error occured, please try again later.')
        }
      })
    }
  }
}

commands.comment = {
  adminOnly: false,
  modOnly: false,
  fn: function (bot, msg, suffix, uvClient) {
    msg.channel.sendTyping()
    getMail(uvClient, msg.author.id).then(email => {
      uvClient.loginAs(email).then(c => {
        let s = suffix.split(' ')
        let idt = s[0]
        s.shift()
        let content = s.join(' ')
        let parts = idt.match(UVRegex)
        let id
        if (parts === null) {
          id = idt
        } else {
          id = parts[2]
        }
        c.post(`forums/${config.uservoice.forumId}/suggestions/${id}/comments.json`, {
          comment: {
            text: content
          }
        }).then(data => {
          msg.reply('your comment was added.', false, {
            title: entities.decode(data.comment.suggestion.title),
            url: data.comment.suggestion.url,
            description: (data.comment.suggestion.text !== null) ? ((data.comment.suggestion.text.length < 1900) ? entities.decode(data.comment.suggestion.text) : '*Content too long*') : '*No content*',
            color: 0x3498db,
            author: {
              name: entities.decode(data.comment.suggestion.creator.name),
              url: data.comment.suggestion.creator.url,
              icon_url: data.comment.suggestion.creator.avatar_url
            },
            fields: [
              {
                name: `${entities.decode(data.comment.creator.name)} commented on this:`,
                value: entities.decode(data.comment.text),
                inline: false
              }
            ]
          })
        }).catch(e => {
          if (e.statusCode === 404) {
            msg.reply('unable to find a suggestion using your query.')
          } else {
            logger.log(bot, {
              cause: 'comment_add',
              message: (e.message !== undefined) ? e.message : JSON.stringify(e)
            })
            msg.reply('an error occured, please try again later.')
          }
        })
      }).catch(e => {
        logger.log(bot, {
          cause: 'login_as',
          message: (e.message !== undefined) ? e.message : JSON.stringify(e)
        })
        msg.reply('an error occured, please try again later.')
      })
    }).catch(e => {
      if (e === 'Not found') {
        msg.reply("I was unable to find your details, make sure you've logged into the website at least once.")
      } else {
        logger.log(bot, {
          cause: 'email_search',
          message: (e.message !== undefined) ? e.message : JSON.stringify(e)
        })
        msg.reply('an error occured, please try again later.')
      }
    })
  }
}

function getMail (uv, user) {
  return new Promise(function (resolve, reject) {
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

exports.Commands = commands
