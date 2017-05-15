const Config = require('../config.js')

exports.log = function (bot, user, cObj) {
  bot.Channels.find((c) => c.name === 'bot-log').sendMessage('', false, {
    color: 0x3498db,
    author: {
      name: `${cObj.user.username} (${cObj.user.id})`,
      icon_url: cObj.user.avatarURL
    },
    timestamp: new Date(),
    title: 'This user did the following action:',
    description: cObj.message,
    footer: {
      text: 'MegaBot v' + require('../package.json').version,
      icon_url: 'https://cdn.discordapp.com/attachments/258274103935369219/278959167601901568/bots2.png' // ORIGINAL CONTENT PLEASE DONT STEAL
    }
  })
}