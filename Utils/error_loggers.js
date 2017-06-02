const Config = require('../config.js')
var bugsnag = require('bugsnag')

bugsnag.register(Config.discord.bugsnag)

exports.log = function (bot, cObj, fullErr) {
  if (fullErr !== undefined) bugsnag.notify(fullErr)
  bot.Channels.find((c) => c.name === 'bot-error').sendMessage(`Encountered an error while trying to run ${cObj.cause}.\nReturned error: \`\`\`${cObj.message}\`\`\``)
}
