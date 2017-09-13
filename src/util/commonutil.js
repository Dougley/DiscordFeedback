const Constants = require('../../constants')

module.exports = {
  sendTimed: (msg, content, reply = false) => {
    if (reply) {
      msg.reply(content).then(m => setTimeout(() => m.delete(), Constants.timeouts.messagedelete))
    } else {
      msg.channel.sendMessage(content).then(m => setTimeout(() => m.delete(), Constants.timeouts.messagedelete))
    }
  },
  sendTimedEmbed: (msg, embed, content = '', reply = false) => {
    if (reply) {
      msg.reply(content, embed).then(m => setTimeout(() => m.delete(), Constants.timeouts.messagedelete))
    } else {
      msg.channel.sendMessage(content, false, embed).then(m => setTimeout(() => m.delete(), Constants.timeouts.messagedelete))
    }
  }
}