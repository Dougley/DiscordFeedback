const Package = require('../package.json');

exports.Http = {
  VERSION: 7,
  API: 'https://discordapp.com/api',
};

exports.USER_AGENT = `DiscordBot (${Package.homepage}, ${Package.version})`;

exports.ROOT_GUILD = '268811439588900865';
