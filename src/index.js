const Client = require('./discord').Client;

const config = require('../config');

const client = new Client();

client.on('MESSAGE_CREATE', () => {
  // handle message lol
});

client.login(config.discord.token);
