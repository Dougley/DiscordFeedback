let commands = []

// const checker = require('../../Utils/access_checker')
const logger = require('../../Utils/error_loggers')
const config = require('../../config.js')
const Entities = require('html-entities').AllHtmlEntities
const UVRegex = /https?:\/\/[\w.]+\/forums\/(\d{6,})-[\w-]+\/suggestions\/(\d{7,})(?:-[\w-]*)?/

const entities = new Entities()

commands.vote = {
  adminOnly: false,
  modOnly: false,
  fn: function (bot, msg, suffix, uvClient, cBack) {
    msg.channel.sendTyping()
    getMail(uvClient, msg.author.id).then(email => {
      uvClient.v1.loginAs(email).then(c => {
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
          cBack({
            affected: id
          })
        }).catch(e => {
          if (e.statusCode === 404) {
            msg.reply('unable to find a suggestion using your query.').then(errmsg => {
              setTimeout(() => bot.Messages.deleteMessages([msg, errmsg]), config.timeouts.errorMessageDelete)
            })
          } else {
            logger.log(bot, {
              cause: 'vote_apply',
              message: (e.message !== undefined) ? e.message : JSON.stringify(e)
            }, e)
            msg.reply('an error occured, please try again later.').then(errmsg => {
              setTimeout(() => bot.Messages.deleteMessages([msg, errmsg]), config.timeouts.errorMessageDelete)
            })
          }
        })
      }).catch(e => {
        logger.log(bot, {
          cause: 'login_as',
          message: (e.message !== undefined) ? e.message : JSON.stringify(e)
        }, e)
        msg.reply('an error occured, please try again later.').then(errmsg => {
          setTimeout(() => bot.Messages.deleteMessages([msg, errmsg]), config.timeouts.errorMessageDelete)
        })
      })
    }).catch(e => {
      if (e === 'Not found') {
        msg.reply(`I was unable to find your details, make sure you've logged into the website at <https://${config.uservoice.subdomain}.${config.uservoice.domain}> at least once.`).then(errmsg => {
          setTimeout(() => bot.Messages.deleteMessages([msg, errmsg]), config.timeouts.errorMessageDelete)
        })
      } else {
        logger.log(bot, {
          cause: 'email_search',
          message: (e.message !== undefined) ? e.message : JSON.stringify(e)
        }, e)
        msg.reply('an error occured, please try again later.').then(errmsg => {
          setTimeout(() => bot.Messages.deleteMessages([msg, errmsg]), config.timeouts.errorMessageDelete)
        })
      }
    })
  }
}

commands.submit = {
  adminOnly: false,
  modOnly: false,
  fn: function (bot, msg, suffix, uvClient, cBack) {
    let channels = require('../../channels')
    let IDs = Object.getOwnPropertyNames(channels)
    if (IDs.indexOf(msg.channel.id) === -1) return
    let content = suffix.split(' | ')
    if (content.length !== 2) {
      msg.reply('This command only takes 2 arguments').then(errmsg => {
        setTimeout(() => bot.Messages.deleteMessages([msg, errmsg]), config.timeouts.errorMessageDelete)
      })
    } else {
      msg.channel.sendTyping()
      getMail(uvClient, msg.author.id).then(email => {
        uvClient.v1.loginAs(email).then(c => {
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
            }).then(successmsg => {
              setTimeout(() => bot.Messages.deleteMessages([msg]), config.timeouts.messageDelete)
            })
            cBack({
              result: data.suggestion.url
            })
          }).catch(e => {
            logger.log(bot, {
              cause: 'submit_feedback',
              message: (e.message !== undefined) ? e.message : JSON.stringify(e)
            }, e)
            msg.reply('an error occured, please try again later.').then(errmsg => {
              setTimeout(() => bot.Messages.deleteMessages([msg, errmsg]), config.timeouts.errorMessageDelete)
            })
          })
        }).catch(e => {
          logger.log(bot, {
            cause: 'login_as',
            message: (e.message !== undefined) ? e.message : JSON.stringify(e)
          }, e)
          msg.reply('an error occured, please try again later.').then(errmsg => {
            setTimeout(() => bot.Messages.deleteMessages([msg, errmsg]), config.timeouts.errorMessageDelete)
          })
        })
      }).catch(e => {
        if (e === 'Not found') {
          msg.reply(`I was unable to find your details, make sure you've logged into the website at <https://${config.uservoice.subdomain}.${config.uservoice.domain}> at least once.`).then(errmsg => {
            setTimeout(() => bot.Messages.deleteMessages([msg, errmsg]), config.timeouts.errorMessageDelete)
          })
        } else {
          logger.log(bot, {
            cause: 'email_search',
            message: (e.message !== undefined) ? e.message : JSON.stringify(e)
          }, e)
          msg.reply('an error occured, please try again later.').then(errmsg => {
            setTimeout(() => bot.Messages.deleteMessages([msg, errmsg]), config.timeouts.errorMessageDelete)
          })
        }
      })
    }
  }
}

commands.comment = {
  adminOnly: false,
  modOnly: false,
  fn: function (bot, msg, suffix, uvClient, cBack) {
    msg.channel.sendTyping()
    getMail(uvClient, msg.author.id).then(email => {
      uvClient.v1.loginAs(email).then(c => {
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
        if (content.startsWith('|')) content = content.slice(1).trim()
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
          }).then(successmsg => {
            setTimeout(() => bot.Messages.deleteMessages([msg]), config.timeouts.messageDelete)
          })
          cBack({
            affected: id,
            result: 'A new comment was created'
          })
        }).catch(e => {
          if (e.statusCode === 404) {
            msg.reply('unable to find a suggestion using your query.').then(errmsg => {
              setTimeout(() => bot.Messages.deleteMessages([msg, errmsg]), config.timeouts.errorMessageDelete)
            })
          } else {
            logger.log(bot, {
              cause: 'comment_add',
              message: (e.message !== undefined) ? e.message : JSON.stringify(e)
            }, e)
            msg.reply('an error occured, please try again later.').then(errmsg => {
              setTimeout(() => bot.Messages.deleteMessages([msg, errmsg]), config.timeouts.errorMessageDelete)
            })
          }
        })
      }).catch(e => {
        logger.log(bot, {
          cause: 'login_as',
          message: (e.message !== undefined) ? e.message : JSON.stringify(e)
        }, e)
        msg.reply('an error occured, please try again later.').then(errmsg => {
          setTimeout(() => bot.Messages.deleteMessages([msg, errmsg]), config.timeouts.errorMessageDelete)
        })
      })
    }).catch(e => {
      if (e === 'Not found') {
        msg.reply(`I was unable to find your details, make sure you've logged into the website at <https://${config.uservoice.subdomain}.${config.uservoice.domain}> at least once.`).then(errmsg => {
          setTimeout(() => bot.Messages.deleteMessages([msg, errmsg]), config.timeouts.errorMessageDelete)
        })
      } else {
        logger.log(bot, {
          cause: 'email_search',
          message: (e.message !== undefined) ? e.message : JSON.stringify(e)
        }, e)
        msg.reply('an error occured, please try again later.').then(errmsg => {
          setTimeout(() => bot.Messages.deleteMessages([msg, errmsg]), config.timeouts.errorMessageDelete)
        })
      }
    })
  }
}
commands.url = {
  adminOnly: false,
  modOnly: false,
  fn: function (bot, msg, suffix) {
    if (suffix) {
      let id = suffix.match(/[0-9]{7,}/)[0]
      if (id) msg.reply(`Here's the link: https://${config.uservoice.subdomain}.${config.uservoice.domain}/forums/${config.uservoice.forumId}/suggestions/${suffix}`)
      else msg.reply(`Please enter a Suggestion ID.`)
    }
    else msg.reply(`URL for the Feedback page is https://${config.uservoice.subdomain}.${config.uservoice.domain}, though that's probably not what you were looking for. Try entering a Suggestion ID`)
  }
}

commands.info = {
  modOnly: false,
  adminOnly: false,
  fn: function (bot, msg, suffix, uvClient, cBack) {
    function getInfo (uvid, userid) {
      uvClient.v1.loginAsOwner().then(c => {
        c.get(`users/${uvid}.json`).then(data => {
          let dcuser = '*Cannot grab user.*'
          let member = msg.guild.members.find(member => userid === member.id)
          if (member) { // Search server for a member with that DCID and return a NAME#DISCRIM
            dcuser = `${member.username}#${member.discriminator}`
          }
          let latestSuggTitle = 'No suggestion available'
          let latestSuggLink
          c.get(`users/${uvid}/suggestions.json`, {
            per_page: 1,
            sort: 'newest'
          }).then(response => {
            latestSuggLink = response.suggestions[0].url
            latestSuggTitle = response.suggestions[0].title
            return msg.channel.sendMessage(`Information for User ${data.user.name}:`, false, {
              color: 0xfc9822,
              title: `${data.user.name} - UserVoice`,
              description: `UserVoice ID: ${data.user.id}`,
              url: data.user.url,
              thumbnail: {
                url: data.user.avatar_url
              },
              fields: [{
                name: 'Suggestions submitted',
                value: data.user.created_suggestions_count,
                inline: true
              },
              {
                name: 'Upvotes given',
                value: data.user.supported_suggestions_count,
                inline: true
              },
              {
                name: 'Last Suggestion Interacted with',
                value: `[${latestSuggTitle}](${latestSuggLink})`,
                inline: true
              },
              {
                name: 'Discord Username',
                value: dcuser,
                inline: false
              }
              ],
              footer: {
                text: 'User created on',
                icon_url: data.user.avatar_url
              },
              timestamp: new Date(data.user.created_at)
            })
          }).catch(logger.raven)
        }).catch(() => {
          return msg.channel.sendMessage('User could not be found on UserVoice, make sure they have logged into the Feedback site at least once.').then(errMsg => {
            setTimeout(() => bot.Messages.deleteMessages([msg, errMsg]), config.timeouts.errorMessageDelete)
          })
        })
      })
    }
    
    msg.channel.sendTyping()
    let mentions = msg.mentions
    let userid
    let uvid

    if (mentions.length !== 0) {
      userid = mentions[0].id // Mention given? Convert to User ID
    } else if (suffix.match(/(\d{16,18})/g)) { // User ID given? Set User ID
      userid = suffix.match(/(\d{16,18})/)[1]
    } else if (suffix.match(/(.{2,32}#\d{4})/g)) { // NAME#DISCRIM given? Search for user in server and set User ID
      let namedisc = suffix.match(/(.{2,32})#(\d{4})/g)[0]
      let member = msg.guild.members.find(member => member.username === namedisc[1] && member.discriminator === namedisc[2])
      if (member) {
        userid = member.id
      } else { // Can't find user by that? Abort mission
        return msg.reply(`Unable to find a user named ${suffix}. The user has to be in this server for using NAME#DISCRIM search. Use a Discord or UserVoice ID.`).then(errMsg => {
          setTimeout(() => bot.Messages.deleteMessages([msg, errMsg]), config.timeouts.errorMessageDelete)
        })
      }
    } else if (suffix.match(/(\d{9})/)) {
      uvid = suffix.match(/(\d{9})/)[1] // 9 Character UVID given? tyvm set it
    } else if (!suffix) {
      userid = msg.author.id
    } else {
      return msg.channel.sendMessage('Invalid usage. Use a mention, ID or Username#Discriminator combination.').then(errMsg => { // crap given? Don't give a crap
        setTimeout(() => bot.Messages.deleteMessages([msg, errMsg]), config.timeouts.errorMessageDelete)
      })
    }

    if (userid || uvid) { // Do we have anything to live off of?
      if (!uvid) { // No UVID? Try to search user
        uvClient.v1.loginAsOwner().then(i => {
          i.get('users/search.json', {
            guid: userid
          }).then((data) => {
            if (data.users && data.users.length === 1) {
              let id = data.users[0].id
              getInfo(id, userid, null)
            } else {
              return msg.channel.sendMessage('User could not be found on UserVoice, make sure they have logged into the Feedback site at least once.').then(errMsg => {
                setTimeout(() => bot.Messages.deleteMessages([msg, errMsg]), config.timeouts.errorMessageDelete)
              })
            }
          }).catch(() => {
            return msg.channel.sendMessage('Failed to find a suitable result using that input.').then(errMsg => {
              setTimeout(() => bot.Messages.deleteMessages([msg, errMsg]), config.timeouts.errorMessageDelete)
            })
          })
        })
      } else { // OwO UVID is given, try to get dat user ID
        uvClient.v1.loginAsOwner().then(i => {
          i.get(`users/${uvid}.json`).then(userdata => {
            let avatar = userdata.user.avatar_url
            let id = avatar.match(/https?:\/\/[\w.]+\/avatars\/(\d+)\/.+/) // Grab userid from Avatar URL
            getInfo(uvid, id[1])
          }).catch(() => {
            return msg.channel.sendMessage('Failed to find a suitable result using that input.').then(errMsg => {
              setTimeout(() => bot.Messages.deleteMessages([msg, errMsg]), config.timeouts.errorMessageDelete)
            })
          })
        })
      }
    }
  }
}

function getMail (uv, user) {
  return new Promise(function (resolve, reject) {
    if (config.debug === true) return resolve('hello@dougley.com') // no dox pls
    uv.v1.loginAsOwner().then(i => {
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
