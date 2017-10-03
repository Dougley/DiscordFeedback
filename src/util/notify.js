const r = require('../models/rethinkdb')

module.exports = (userid, bot, message) => {
  r.table('logs').get(userid).then(doc => {
    if (doc.notifications === true) { // eslint-disable-line
      return bot.Users.get(userid).openDM()
    }
  }).then(channel => {
    return channel.sendMessage(message + '\n\n*Wish to stop receving these messages? React wtih ❌*')
  }).then(message => {
    return message.addReaction({
      name: '❌'
    })
  }).catch(console.error)
}