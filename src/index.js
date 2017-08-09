const Client = require('./discord').Client;
const config = require('../config');
const logger = require('./util/logger');

const client = new Client();

client.on('MESSAGE_CREATE', (message) => {
  logger.log('MESSAGE', message.react.deny(1000));
});

client.on('MESSAGE_REACTION_ADD', (x) => {
  logger.log('REACTION_ADD', x);
});

client.on('MESSAGE_REACTION_REMOVE', (x) => {
  logger.log('REACTION_REMOVE', x);
});

client.login(config.discord.token);
