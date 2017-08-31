const Analytics = require('./orwell.js')

exports.log = (bot, user, cObj) => {
  let fields = []
  if (cObj.result !== undefined) fields.push({name: 'This resulted in the following:', value: cObj.result, inline: false})
  if (cObj.affected !== undefined) fields.push({name: 'This affected the following cards:', value: cObj.affected, inline: false})
  if (cObj.awardPoints === true) Analytics.awardPoints(user.id, 'commands')
  bot.Channels.find((c) => c.name === 'bot-log').sendMessage('', false, {
    color: 0x3498db,
    author: {
      name: `${user.username} (${user.id})`,
      icon_url: user.avatarURL
    },
    fields: fields,
    timestamp: new Date(),
    title: 'This user did the following action:',
    description: cObj.message,
    footer: {
      text: 'MegaBot v' + require('../package.json').version,
      icon_url: 'https://cdn.discordapp.com/attachments/258274103935369219/278959167601901568/bots2.png' // ORIGINAL CONTENT PLEASE DONT STEAL
    }
  })
}

