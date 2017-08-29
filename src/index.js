if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production';

const Client = require('./discord').Client;
const config = require('../config');
const logger = require('./util/logger');

const client = new Client();
let prefix;

client.on('READY', (packet) => {
  prefix = new RegExp(`^(<@!?${packet.user.id}>|${config.discord.prefix})`, 'i');
});

client.on('MESSAGE_CREATE', (message) => {
  if (!prefix || message.author.bot || !prefix.test(message.content)) return;
  const [command, ...content] = message.content.replace(prefix, '').trim().split(' ');
  console.log(command, content);
});

client.on('MESSAGE_REACTION_ADD', (x) => {
  logger.log('REACTION_ADD', x);
});

client.on('MESSAGE_REACTION_REMOVE', (x) => {
  logger.log('REACTION_REMOVE', x);
});

client.login(config.discord.token);
