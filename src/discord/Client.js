const EventEmitter = require('events');
const Collection = require('../util/Collection');
const Router = require('./rest/Router');
const WebSocketConnection = require('./WebSocketConnection');
const logger = require('../util/logger');

class Client extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = options;

    this.users = new Collection();
    this.channels = new Collection();
    this.roles = new Collection();
    this.members = new Collection();
    this.emojis = new Collection();

    this.rest = new Router(this);

    this.ws = new WebSocketConnection(this);
  }

  get api() {
    return this.rest.api();
  }

  login(token) {
    this.token = token;
    return this.api.gateway.bot.get().then((res) => {
      const gateway = `${res.url}/?v=6&encoding=etf`;
      logger.log('GATEWAY DISCOVERY', gateway);
      this.ws.connect(gateway);
    });
  }
}

module.exports = Client;
