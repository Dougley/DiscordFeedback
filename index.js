const Discordie = require('discordie')
const Config = require('./config.js')
const Events = require('./src/events/index')
const Client = new Discordie({
  autoReconnect: true
})

Client.Dispatcher.onAny((type, ctx) => {
  if (Events[type]) Events[type](ctx)
})

Client.connect({
  token: Config.Discord.token
})