const Config = require('../../config')
const Constants = require('../../constants')
const Helpers = {
  login: require('../util/login')
}

module.exports = {
  meta: {
    level: 0,
    cooldown: {
      global: 500,
      user: 20000
    }
  },
  fn: (msg, suffix) => {
    msg.channel.sendTyping()
    const index = suffix.split(' | ')
    Helpers.login.userv1(msg.author.id).then(client => {
      return client.post(`forums/${Config.Uservoice.forumID}/suggestions.json`, {
        suggestion: {
          title: index[0],
          text: index[1],
          votes: 1,
          category_id: (!Constants.UVChannels.default) ? Constants.UVChannels.channels[msg.channel.id] : Constants.UVChannels.default //eslint-disable-line
        }
      }).then(result => {
        return msg.reply('feedback submitted!')
      }).catch(console.error)
    }).catch(console.error)
  }
}