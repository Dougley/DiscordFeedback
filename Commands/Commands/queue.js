let commands = []
const Dash = require('rethinkdbdash')
const r = new Dash()
const checker = require('../../Utils/access_checker')
const logger = require('../../Utils/error_loggers')
const genlog = require('../../Utils/generic_logger')
const config = require('../../config.js')

const dupeMap = new Map()

const UVRegex = /https?:\/\/[\w.]+\/forums\/(\d{6,})-[\w-]+\/suggestions\/(\d{8,})(?:-[\w-]*)?/

commands.newCardInit = {
  internal: true,
  fn: function (msg) {
    r.db('DFB').table('queue').insert({
      id: msg.id,
      reports: 0,
      reporters: [],
      type: 'newCard',
      embed: msg.embeds[0],
      UvId: msg.embeds[0].footer.text.split('ID: ')[1]
    }).run().then(() => {
      msg.addReaction({
        id: '302137374920671233',
        name: 'report'
      })
      msg.addReaction({
        id: '302138464986595339',
        name: 'upvote'
      })
    }).catch(logger.raven)
  }
}

commands.chatVoteInit = {
  internal: true,
  fn: function (msg, id, uv) {
    uv.v1.get(`forums/${config.uservoice.forumId}/suggestions/${id}.json`).then((data) => {
      r.db('DFB').table('queue').insert({
        id: msg.id,
        type: 'chatVote',
        reports: 0,
        channel: msg.channel.id,
        embed: {
          color: 0x3498db,
          author: {
            name: data.suggestion.creator.name,
            icon_url: data.suggestion.creator.avatar_url,
            url: data.suggestion.creator.url
          },
          title: data.suggestion.title,
          description: (data.suggestion.text.length < 1900) ? data.suggestion.text : '*Content too long*',
          url: data.suggestion.url,
          footer: {
            text: (data.suggestion.category !== null) ? data.suggestion.category.name : 'No category'
          }
        },
        reporters: [],
        UvId: id
      }).run().then(() => {
        msg.addReaction({
          id: '302137374920671233',
          name: 'report'
        })
        msg.addReaction({
          id: '302138464986595339',
          name: 'upvote'
        })
      }).catch(logger.raven)
    })
  }
}

commands.dupe = {
  modOnly: true,
  adminOnly: false,
  fn: function (bot, msg, suffix, uv, cBack) {
    msg.channel.sendTyping()
    if (!suffix) {
      msg.reply("you're missing parameters, please review <#268812893087203338>").then(errmsg => {
        setTimeout(() => bot.Messages.deleteMessages([msg, errmsg]), config.timeouts.errorMessageDelete)
      })
      return
    }
    if (suffix.split(' ')[0].length < 1 || suffix.split(' ')[1].length < 1) {
      msg.reply("you're missing parameters, please review <#268812893087203338>").then(errmsg => {
        setTimeout(() => bot.Messages.deleteMessages([msg, errmsg]), config.timeouts.errorMessageDelete)
      })
      return
    }
    let parts = suffix.split(' ')[0].match(UVRegex)
    let parts2 = suffix.split(' ')[1].match(UVRegex)
    let id
    let id2
    let force = suffix.split(' ')[2]
    if (parts === null) {
      id = suffix.split(' ')[0]
    } else {
      id = parts[2]
    }
    if (parts2 === null) {
      id2 = suffix.split(' ')[1]
    } else {
      id2 = parts2[2]
    }
    if (id2 === null) {
      msg.reply("you're missing parameters, please review <#268812893087203338>").then(errmsg => {
        setTimeout(() => bot.Messages.deleteMessages([msg, errmsg]), config.timeouts.errorMessageDelete)
      })
      return
    }
    if (id2 == "-") {
      if (dupeMap.has(msg.author.id)) {
        id2 = dupeMap.get(msg.author.id);
      } else {
        return msg.reply("you attempted to use your previously used link, but you didn't submit one.")
      }
    }
    if (id === id2) {
      return msg.reply("you cannot merge 2 of the same suggestions.")
    }

    r.db('DFB').table('queue').filter({ type: 'adminMergeRequest', UV1: id }).run().then(results => {
      if (results.length > 0 && force !== "-f") {
        return msg.reply("this suggestion has already been reported as a duplicate.")
      } else {
        uv.v1.loginAsOwner().then(c => {
          c.get(`forums/${config.uservoice.forumId}/suggestions/${id}.json`).then((data) => {
            c.get(`forums/${config.uservoice.forumId}/suggestions/${id2}.json`).then((data2) => {
              msg.reply(`this will result in the following card.\n__Are you sure this is correct?__ (yes/no)`, false, {
                color: 0x3498db,
                author: {
                  name: data2.suggestion.creator.name,
                  icon_url: data2.suggestion.creator.avatar_url,
                  url: data2.suggestion.creator.url
                },
                title: data2.suggestion.title,
                url: data2.suggestion.url,
                description: (data2.suggestion.text !== null) ? (data2.suggestion.text.length < 1900) ? data2.suggestion.text : '*Content too long*' : '*No content*',
                fields: [{
                  name: 'Votes',
                  value: parseInt(data.suggestion.vote_count) + parseInt(data2.suggestion.vote_count)
                }],
                footer: {
                  text: (data2.suggestion.category !== null) ? data2.suggestion.category.name : 'No category'
                }
              }).then(() => {
                wait(bot, msg).then((q) => {
                  if (q === null) {
                    msg.reply('you took too long to answer, the operation has been cancelled.').then(errmsg => {
                      setTimeout(() => bot.Messages.deleteMessages([msg, errmsg]), config.timeouts.errorMessageDelete)
                    })
                  }
                  if (q === false) {
                    msg.reply('thanks for reconsidering, the operation has been cancelled.').then(successmsg => {
                      setTimeout(() => bot.Messages.deleteMessages([msg, successmsg]), config.timeouts.messageDelete)
                    })
                  }
                  if (q === true) {
                    cBack({
                      affected: id
                    })
                    msg.reply('your report has been sent to the admins, thanks!').then(successmsg => {
                      setTimeout(() => bot.Messages.deleteMessages([msg]), config.timeouts.messageDelete)
                    })
                    dupeMap.set(msg.author.id, id2)
                    bot.Channels.find(f => f.name === 'admin-queue').sendMessage(`Merge **${data.suggestion.title}** (${id2}) into **${data2.suggestion.title}** (${id})?`, false, {
                      color: 0x3498db,
                      fields: [{
                        name: `Merge Candidate: ${(data.suggestion.text !== null) ? (data.suggestion.text.length < 500) ? 'Content' : 'Summary' : 'Content'}`,
                        value: (data.suggestion.text !== null) ? (data.suggestion.text.length < 500) ? data.suggestion.text : `${data.suggestion.text.substring(0, 500)}` : '*No content*',
                        inline: false
                      },
                      {
                        name: `Target Card: ${(data2.suggestion.text !== null) ? (data2.suggestion.text.length < 500) ? 'Content' : 'Summary' : 'Content'}`,
                        value: (data2.suggestion.text !== null) ? (data2.suggestion.text.length < 500) ? data2.suggestion.text : `${data2.suggestion.text.substring(0, 500)}` : '*No content*',
                        inline: false
                      },
                      {
                        name: 'Merge Candidate: Votes',
                        value: parseInt(data.suggestion.vote_count),
                        inline: true
                      },
                      {
                        name: 'Merge Candidate: Date of creation',
                        value: data.suggestion.created_at,
                        inline: true
                      },
                      {
                        name: 'Target Card: Votes',
                        value: parseInt(data2.suggestion.vote_count),
                        inline: true
                      },
                      {
                        name: 'Target Card: Date of creation',
                        value: data2.suggestion.created_at,
                        inline: true
                      }
                      ],
                      title: data2.suggestion.title,
                      description: `These suggestions will be merged.\n[Target Card](${data2.suggestion.url})\n[Merge Candidate](${data.suggestion.url})`,
                      footer: {
                        text: data2.suggestion.category.name
                      }
                    }).then(b => {
                      r.db('DFB').table('queue').insert({
                        id: b.id,
                        type: 'adminMergeRequest',
                        author: msg.author,
                        UV1: id,
                        UV2: id2,
                        UvId: id,
                        embed: b.embeds[0]
                      }).run().then(() => {
                        b.addReaction({
                          name: 'approve',
                          id: '302137375092375553'
                        })
                        b.addReaction({
                          name: 'deny',
                          id: '302137375113609219'
                        })
                        b.addReaction({
                          name: 'reverse',
                          id: '322646981476614144'
                        })
                      }).catch(logger.raven)
                    })
                  }
                })
              })
            }).catch((e) => {
              if (e.statusCode === 404) {
                msg.reply('unable to find a suggestion using your second query.').then(errmsg => {
                  setTimeout(() => bot.Messages.deleteMessages([msg, errmsg]), config.timeouts.errorMessageDelete)
                })
              } else {
                logger.log(bot, {
                  cause: 'dupe_search_second',
                  message: (e.message !== undefined) ? e.message : JSON.stringify(e)
                }, e)
                msg.reply('an error occured, please try again later.').then(errmsg => {
                  setTimeout(() => bot.Messages.deleteMessages([msg, errmsg]), config.timeouts.errorMessageDelete)
                })
              }
            })
          }).catch((e) => {
            if (e.statusCode === 404) {
              msg.reply('unable to find a suggestion using your first query.').then(errmsg => {
                setTimeout(() => bot.Messages.deleteMessages([msg, errmsg]), config.timeouts.errorMessageDelete)
              })
            } else {
              logger.log(bot, {
                cause: 'dupe_search_first',
                message: (e.message !== undefined) ? e.message : JSON.stringify(e)
              }, e)
              msg.reply('an error occured, please try again later.').then(errmsg => {
                setTimeout(() => bot.Messages.deleteMessages([msg, errmsg]), config.timeouts.errorMessageDelete)
              })
            }
          })
        })
      }
    }).catch(logger.raven)
  }
}

commands.registerVote = {
  internal: true,
  fn: function (msg, reaction, bot, uv, user) {
    if (msg === null) {
      console.warn('Warning! Vote registering failed due to the message not being cached!')
      return
    }
    r.db('DFB').table('queue').get(msg.id).then((hj) => {
      let doc = hj
      if (doc === null) {
        console.warn('Warning! Vote registering failed due to the report not being known to memory!')
        return
      }
      switch (doc.type) {
      case 'upvoteOnly' : {
        if (reaction.id === '302138464986595339') {
          getMail(uv, user.id).then(f => {
            uv.v1.loginAs(f).then(c => {
              c.post(`forums/${config.uservoice.forumId}/suggestions/${doc.UvId}/votes.json`, {
                to: 1
              }).then((s) => {
                if (user !== null) {
                  genlog.log(bot, user, {
                    message: 'Top10-voted',
                    affected: doc.UvId
                  })
                }
              }).catch(e => {
                if (e.statusCode !== 404) {
                  logger.log(bot, {
                    cause: 'top10_vote_apply',
                    message: (e.message !== undefined) ? e.message : JSON.stringify(e)
                  }, e)
                }
              })
            }).catch(e => {
              logger.log(bot, {
                cause: 'login_as',
                message: (e.message !== undefined) ? e.message : JSON.stringify(e)
              }, e).catch(e => {
                if (e !== 'Not found') {
                  logger.log(bot, {
                    cause: 'email_search',
                    message: (e.message !== undefined) ? e.message : JSON.stringify(e)
                  }, e)
                }
              })
            })
          })
        }
        break
      }
      case 'chatVote': {
        if (reaction.id === '302137374920671233') {
          checker.getLevel(user.memberOf('268811439588900865'), function (l) {
            if (l > 0 && doc.reporters.indexOf(user.id) === -1) {
              doc.reporters.push(user.id)
              doc.reports++
              genlog.log(bot, user, {
                message: 'Reported a card as inappropriate in the chat',
                awardPoints: true,
                affected: doc.UvId,
                result: (doc.reports === config.discord.reportThreshold) ? 'Report has been sent to admins' : undefined
              })
              if (doc.reports === config.discord.reportThreshold) {
                var reportsArr = msg.fetchReactions({
                  id: '302137374920671233',
                  name: 'report'
                }, bot.User)
                for (let reaction in reportsArr) {
                  msg.removeReaction({
                    id: '302137374920671233',
                    name: 'report'
                  }, reaction[0])
                }
                msg.addReaction({
                  name: 'reported',
                  id: '323058409203171328'
                })
                switchIDs(doc, bot)
              }
            }
          })
        } else if (reaction.id === '302138464986595339') {
          getMail(uv, user.id).then(f => {
            uv.v1.loginAs(f).then(c => {
              c.post(`forums/${config.uservoice.forumId}/suggestions/${doc.UvId}/votes.json`, {
                to: 1
              }).then((s) => {
                if (user !== null) {
                  genlog.log(bot, user, {
                    message: 'Chat-voted',
                    awardPoints: true,
                    affected: doc.UvId
                  })
                  msg.addReaction({
                    id: '296752137935912960',
                    name: 'f1'
                  }).then(setTimeout(() => {
                    msg.fetchReactions({
                      id: '296752137935912960',
                      name: 'f1'
                    }).then(users => {
                      users.map(user => msg.removeReaction({
                        id: '296752137935912960',
                        name: 'f1'
                      }, user.id))
                    })
                  }, 2500))
                }
              }).catch(e => {
                if (e.statusCode === 404) {
                  logger.log(bot, {
                    cause: 'chat_vote',
                    message: (e.message !== undefined) ? e.message : JSON.stringify(e)
                  }, e)
                } else if (e.statusCode === 422) {
                  // 422 is given when voting is closed, since this is a chat vote we want to avoid sending messages, so we'll just fail silently.
                  return
                } else {
                  logger.log(bot, {
                    cause: 'chat_vote_apply',
                    message: (e.message !== undefined) ? e.message : JSON.stringify(e)
                  }, e)
                }
              })
            }).catch(e => {
              logger.log(bot, {
                cause: 'login_as',
                message: (e.message !== undefined) ? e.message : JSON.stringify(e)
              }, e).catch(e => {
                if (e === 'Not found') {
                  bot.Channels.get(doc.channel).sendMessage(`${user.mention}, your details were not found. Make sure you've logged into the website at <https://${config.uservoice.subdomain}.${config.uservoice.domain}> at least once.`).then(errmsg => {
                    setTimeout(() => errmsg.delete(), config.timeouts.errorMessageDelete)
                  })
                } else {
                  logger.log(bot, {
                    cause: 'email_search',
                    message: (e.message !== undefined) ? e.message : JSON.stringify(e)
                  }, e)
                }
              })
            })
          })
        }
        r.db('DFB').table('queue').get(doc.id).update(doc).run().catch(logger.raven)
        break
      }
      case 'newCard': {
        if (reaction.id === '302137374920671233') {
          checker.getLevel(user.memberOf('268811439588900865'), function (l) {
            if (l > 0 && doc.reporters.indexOf(user.id) === -1) {
              doc.reporters.push(user.id)
              doc.reports++
              genlog.log(bot, user, {
                message: 'Reported a card as inappropriate in the feed',
                awardPoints: true,
                affected: doc.UvId,
                result: (doc.reports === config.discord.reportThreshold) ? 'Report has been sent to admins' : undefined
              })
              if (doc.reports === config.discord.reportThreshold) {
                doc.type = 'adminReviewDelete'
                var reportsArr = msg.fetchReactions({
                  id: '302137374920671233',
                  name: 'report'
                }, bot.User)
                for (let reaction in reportsArr) {
                  msg.removeReaction({
                    id: '302137374920671233',
                    name: 'report'
                  }, reaction.id)
                }
                msg.addReaction({
                  name: 'reported',
                  id: '323058409203171328'
                })
                switchIDs(doc, bot)
              }
            }
          })
        } else if (reaction.id === '302138464986595339') {
          getMail(uv, user.id).then(f => {
            uv.v1.loginAs(f).then(c => {
              c.post(`forums/${config.uservoice.forumId}/suggestions/${doc.UvId}/votes.json`, {
                to: 1
              }).then((s) => {
                if (user !== null) {
                  genlog.log(bot, user, {
                    message: 'Feed-voted',
                    awardPoints: true,
                    affected: doc.UvId
                  })
                  msg.addReaction({
                    id: '296752137935912960',
                    name: 'f1'
                  }).then(setTimeout(() => {
                    msg.fetchReactions({
                      id: '296752137935912960',
                      name: 'f1'
                    }).then(users => {
                      users.map(user => msg.removeReaction({
                        id: '296752137935912960',
                        name: 'f1'
                      }, user.id))
                    })
                  }, 2500))
                }
              }).catch(e => {
                if (e.statusCode === 404) {
                  bot.Channels.get(config.discord.feedChannel).sendMessage('The suggestion is no longer available to be voted on.').then(errmsg => {
                    setTimeout(() => bot.Messages.deleteMessages([msg, errmsg]), config.timeouts.errorMessageDelete)
                  })
                } else if (e.statusCode === 422) {
                  bot.Channels.get(config.discord.feedChannel).sendMessage('The suggestion is no longer open for voting.').then(errmsg => {
                    setTimeout(() => bot.Messages.deleteMessages([msg, errmsg]), config.timeouts.errorMessageDelete)
                  })
                } else {
                  logger.log(bot, {
                    cause: 'feed_vote_apply',
                    message: (e.message !== undefined) ? e.message : JSON.stringify(e)
                  }, e)
                }
              })
            }).catch(e => {
              logger.log(bot, {
                cause: 'login_as',
                message: (e.message !== undefined) ? e.message : JSON.stringify(e)
              }, e).catch(e => {
                if (e === 'Not found') {
                  bot.Channels.get(config.discord.feedChannel).sendMessage(`${user.mention}, your details were not found. Make sure you've logged into the website at <https://${config.uservoice.subdomain}.${config.uservoice.domain}> at least once.`).then(errmsg => {
                    setTimeout(() => errmsg.delete(), config.timeouts.errorMessageDelete)
                  })
                } else {
                  logger.log(bot, {
                    cause: 'email_search',
                    message: (e.message !== undefined) ? e.message : JSON.stringify(e)
                  }, e)
                }
              })
            })
          })
        }
        r.db('DFB').table('queue').get(doc.id).update(doc).run().catch(logger.raven)
        break
      }
      case 'adminReviewDelete': {
        if (reaction.id === '285445175541497859') {
          let deleteID = []
          bot.Channels.find(c => c.name === 'admin-queue').sendMessage(`Entering comment mode for ${doc.UvId}. Please enter your comment now, or type \`cancel\` to cancel.`).then((k) => {
            deleteID.push(k)
            awaitAny(bot, user.id, msg.channel.id).then(data => {
              deleteID.push(data.m)
              if (data.c.toLowerCase() === 'cancel') {
                bot.Channels.find(c => c.name === 'admin-queue').sendMessage('Operation cancelled.').then((k) => {
                  deleteID.push(k)
                  console.log(deleteID)
                  setTimeout(() => deleteID.map(o => o.delete()), config.timeouts.messageDelete)
                })
              } else {
                bot.Channels.find(c => c.name === 'admin-queue').sendMessage(`Please confirm, you're about to comment on ${doc.UvId}.\`\`\`${data.c}\`\`\``).then((k) => {
                  deleteID.push(k)
                  waitID(bot, user.id, msg.channel.id).then(data2 => {
                    deleteID.push(data2.m)
                    if (data2.c === null) {
                      bot.Channels.find(c => c.name === 'admin-queue').sendMessage(`You took too long to confirm, cancelled.`).then((k) => {
                        deleteID.push(k)
                        setTimeout(() => deleteID.map(o => o.delete()), config.timeouts.messageDelete)
                      })
                    }
                    if (data2.c === false) {
                      bot.Channels.find(c => c.name === 'admin-queue').sendMessage(`Cancelled.`).then((k) => {
                        deleteID.push(k)
                        setTimeout(() => deleteID.map(o => o.delete()), config.timeouts.messageDelete)
                      })
                    }
                    if (data2.c === true) {
                      getMail(uv, user.id).then(f => {
                        uv.v1.loginAs(f).then(c => {
                          c.post(`forums/${config.uservoice.forumId}/suggestions/${doc.UvId}/comments.json`, {
                            comment: {
                              text: data.c
                            }
                          }).then(data => {
                            bot.Channels.find(c => c.name === 'admin-queue').sendMessage(`Your comment was added sucessfully.`).then((k) => {
                              deleteID.push(k)
                              setTimeout(() => deleteID.map(o => o.delete()), config.timeouts.messageDelete)
                            })
                          }).catch(data => {
                            bot.Channels.find(c => c.name === 'admin-queue').sendMessage(`Something went wrong :(`).then((k) => {
                              deleteID.push(k)
                              setTimeout(() => deleteID.map(o => o.delete()), config.timeouts.messageDelete)
                            })
                            logger.log(bot, {
                              cause: 'queue_comment',
                              message: JSON.stringify(data)
                            })
                          })
                        })
                      })
                    }
                  })
                })
              }
            })
          })
        }
        if (reaction.id === '302137375113609219') {
          genlog.log(bot, user, {
            message: 'Dismissed a report',
            affected: doc.UvId
          })
          bot.Channels.find(c => c.name === 'admin-queue').sendMessage(`The report for ${doc.embed.title} has been dismissed, no action has been taken.`).then(o => {
            setTimeout(() => bot.Messages.deleteMessages([o, msg]), config.timeouts.messageDelete)
          })
        } else if (reaction.id === '302137375092375553') {
          genlog.log(bot, user, {
            message: 'Approved a report',
            affected: doc.UvId,
            result: `Card with ID ${doc.UvId} has been deleted`
          })

          bot.Channels.find(c => c.name === 'admin-queue').sendMessage(`The report for ${doc.embed.title} has been approved, the card has been deleted from Uservoice.`).then(o => {
            setTimeout(() => bot.Messages.deleteMessages([o.id, msg.id], bot.Channels.find(c => c.name === 'admin-queue').id), config.timeouts.messageDelete)
          })
          deleteFromUV(doc.UvId, uv, bot)
          r.db('DFB').table('queue').get(doc.id).delete().run().catch(logger.raven)
        }
        break
      }
      case 'adminMergeRequest': {
        if (reaction.id === '302137375113609219') {
          genlog.log(bot, user, {
            message: 'Dismissed a report',
            affected: doc.UvId
          })
          bot.Channels.get('347823023102885889').sendMessage(`The following dupe report was denied by ${user.username}.`, false, doc.embed)
          bot.Channels.find(c => c.name === 'admin-queue').sendMessage(`The merge request for ${doc.UV1} has been dismissed, no action has been taken.`).then(o => {
            setTimeout(() => bot.Messages.deleteMessages([o.id, msg.id], bot.Channels.find(c => c.name === 'admin-queue').id), config.timeouts.messageDelete)
          })
        } else if (reaction.id === '302137375092375553') {
          genlog.log(bot, user, {
            message: 'Approved a report',
            result: `Card with ID ${doc.UV1} has been merged into ${doc.UV2}`
          })
          bot.Channels.find(c => c.name === 'admin-queue').sendMessage(`The report for ${doc.embed.title} has been approved, the card has been merged.`).then(o => {
            setTimeout(() => bot.Messages.deleteMessages([o.id, msg.id], bot.Channels.find(c => c.name === 'admin-queue').id), config.timeouts.messageDelete)
          })
          merge(doc.UV1, doc.UV2, uv).catch((e, body) => {
            logger.log(bot, {
              cause: 'merge_apply',
              message: body
            }, e)
          })
          r.db('DFB').table('queue').get(doc.id).delete().run().catch(logger.raven)
        } else if (reaction.id === '322646981476614144') {
          genlog.log(bot, user, {
            message: 'Approved a report',
            result: `Card with ID ${doc.UV2} has been merged into ${doc.UV1}`
          })
          bot.Channels.find(c => c.name === 'admin-queue').sendMessage(`The report for ${doc.embed.title} has been approved, the card has been flip-merged.`).then(o => {
            setTimeout(() => bot.Messages.deleteMessages([o.id, msg.id], bot.Channels.find(c => c.name === 'admin-queue').id), config.timeouts.messageDelete)
          })
          merge(doc.UV2, doc.UV1, uv).catch((e) => {
            logger.log(bot, {
              cause: 'flipmerge_apply',
              message: e.message
            }, e)
          })
          r.db('DFB').table('queue').get(doc.id).delete().run().catch(logger.raven)
        }
        break
      }
      }
    }).catch(logger.raven)
  }
}

function merge (target, dupe, uv) {
  return new Promise((resolve, reject) => {
    uv.v2.loginAsOwner(config.uservoice.secret.trim()).then(client => {
      require('superagent')
        .post(`https://${config.uservoice.UVDomain}.uservoice.com/api/v2/admin/suggestions/bulk/merge`)
        .send(`action.notify_supporters=false&action.reply_to=&action.links.to_suggestion=${dupe}&include_ids=${target}`)
        .set('Authorization', 'Bearer ' + client.accessToken)
        .end((err, res) => {
          if (err || res.statusCode !== 200) return reject(err, res.body)
          else return resolve(res)
        })
    })
  })
}

function deleteFromUV (UVID, uvClient, bot) {
  uvClient.v1.loginAsOwner().then(i => {
    i.delete(`forums/${config.uservoice.forumId}/suggestions/${UVID}.json`).catch((e) => {
      if (e.statusCode === 404) {
        bot.Channels.find(c => c.name === 'admin-queue').sendMessage('That suggestion doesn\'t seem to exist, (someone must have beat you to it).').then(o => {
          setTimeout(() => o.delete(), config.timeouts.errorMessageDelete)
        })
      } else {
        logger.log(bot, {
          cause: 'card_destroy',
          message: (e.message !== undefined) ? e.message : JSON.stringify(e)
        }, e)
      }
    })
  }).catch((e) => {
    logger.log(bot, {
      cause: 'card_destroy_login',
      message: (e.message !== undefined) ? e.message : JSON.stringify(e)
    }, e)
  })
}

function switchIDs (og, bot) {
  bot.Channels.find(c => c.name === 'admin-queue').sendMessage('The following card was reported as inappropriate, please confirm this report.\n**Confirming this report will DESTROY the card, please be certain.**', false, og.embed).then(b => {
    og.id = b.id
    og.type = 'adminReviewDelete'
    r.db('DFB').table('queue').insert(og).run().then(() => {
      b.addReaction({
        name: 'approve',
        id: '302137375092375553'
      })
      b.addReaction({
        name: 'deny',
        id: '302137375113609219'
      })
      b.addReaction({
        name: 'thinkBot',
        id: '285445175541497859'
      })
    }).catch(logger.raven)
  })
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

function wait (bot, msg) {
  let yn = /^y(es)?$|^n(o)?$/i
  return new Promise((resolve, reject) => {
    bot.Dispatcher.on('MESSAGE_CREATE', function doStuff (c) {
      let time = setTimeout(() => {
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

function waitID (bot, user, channel) {
  let yn = /^y(es)?$|^n(o)?$/i
  return new Promise((resolve, reject) => {
    bot.Dispatcher.on('MESSAGE_CREATE', function doStuff (c) {
      let time = setTimeout(() => {
        resolve(null)
        bot.Dispatcher.removeListener('MESSAGE_CREATE', doStuff)
      }, config.timeouts.duplicateConfirm) // We won't wait forever for the person to anwser
      if (c.message.channel.id !== channel) return
      if (c.message.author.id !== user) return
      if (c.message.content.match(yn) === null) return
      else {
        resolve({
          c: (c.message.content.match(/^y(es)?/i) !== null), 
          m: c.message
        })
        bot.Dispatcher.removeListener('MESSAGE_CREATE', doStuff)
        clearTimeout(time)
      }
    })
  })
}

function awaitAny (bot, user, channel) {
  return new Promise((resolve, reject) => {
    bot.Dispatcher.on('MESSAGE_CREATE', function doStuff (c) {
      if (c.message.channel.id !== channel) return
      if (c.message.author.id !== user) return
      else {
        resolve({
          c: c.message.content,
          m: c.message
        })
        bot.Dispatcher.removeListener('MESSAGE_CREATE', doStuff)
      }
    })
  })
}

exports.Commands = commands
