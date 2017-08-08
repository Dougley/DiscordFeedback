const EventEmitter = require('events');
const Collection = require('../util/Collection');
const Router = require('./rest/Router');

class Client extends EventEmitter {
  constructor() {
    super();

    this.channels = new Collection();
    this.roles = new Collection();
    this.members = new Collection();
    this.emojis = new Collection();

    this.rest = new Router(this);
  }

  get api() {
    return this.rest.api();
  }

  login(token) {
    client.token = token;
    return this.api.gateway.bot.get().then((res) => {
      const gateway = `${res.url}/?v=6&encoding=json`;
      // do ws stuff
    });
  }
}

module.exports = Client;
