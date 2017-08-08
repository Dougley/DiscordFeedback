const EventEmitter = require('events');
const Collection = require('../util/Collection');

class Client extends EventEmitter {
  constructor() {
    super();

    this.channels = new Collection();
    this.roles = new Collection();
    this.members = new Collection();
    this.emojis = new Collection();
  }
}

module.exports = Client;
