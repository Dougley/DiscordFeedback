const Redis = require('../models/redis')

module.exports = {
  meta: {
    level: 0
  },
  fn: (msg, suffix) => {
    Redis.set('email:' + msg.author.id, suffix).then(() => {
      msg.reply('done')
    }).catch((e) => {
      console.error(e)
      msg.reply('error!')
    })
  }
}