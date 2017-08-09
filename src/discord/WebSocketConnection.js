const WebSocket = require('uws');
const erlpack = require('erlpack');
const EventEmitter = require('events');
const Package = require('../../package.json');
const handle = require('./PacketHandler');
const logger = require('../util/logger');

class WebSocketConnection extends EventEmitter {
  constructor(client) {
    super();
    this.client = client;

    this.gateway = null;

    this.cache = {
      seq: 0,
      session_id: null,
      get token() { return client.token; },
    };

    this.heartbeat = null;
  }

  send(op, d) {
    return this.ws.send(erlpack.pack({ op, d }));
  }

  onMessage({ data }) {
    if (Array.isArray(data)) data = Buffer.concat(data);
    let packet;
    try {
      packet = erlpack.unpack(Buffer.from(data));
    } catch (err) {
      return;
    }

    if (packet.s > this.cache.seq) this.cache.seq = packet.s;

    if (packet.t === 'READY') {
      logger.log('WS', 'READY');
      this.cache.session_id = packet.d.session_id;
    } else if (packet.t === 'RESUMED') {
      logger.log('WS', 'RESUMED');
    } else if (packet.op === 10) {
      this.identify();
      this.heartbeat = setInterval(() => {
        this.send(1, this.cache.seq);
      }, packet.d.heartbeat_interval);
    } else if (packet.op === 1) {
      this.send(1, this.cache.seq);
    } else if (packet.op === 7) {
      logger.log('WS', 'RECONNECTING');
      this.reconnect();
    } else if (packet.op === 9) {
      logger.log('WS', 'SESSION INVALIDATION');
      if (packet.d === false) this.cache.session_id = null;
      this.reconnect(false);
    }

    if (this.listenerCount('raw')) this.emit('raw', packet);
    const handled = handle(this.client, packet);
    if (handled) this.client.emit(packet.t, handled);
  }

  onOpen() {} // eslint-disable-line no-empty-function

  onClose(e) {
    if (!e.code) return; // fuck you uWS
    logger.log('WS', 'CONNECTION CLOSE', e.reason, e.code);
    this.emit('disconnect');
    this.reconnect();
  }

  onError(e) {
    logger.log('WS', 'CONNECTION ERROR', e.stack);
    this.emit('disconnect');
    this.reconnect();
  }

  reconnect(disconnect = true) {
    if (disconnect && ![WebSocket.CLOSED, WebSocket.CLOSING].includes(this.ws.readyState)) this.ws.close();
    const method = (disconnect ? this.connect : this.identify).bind(this);
    if (this.cache.session_id) setTimeout(() => method(), 500);
    else setTimeout(() => method(), 5e3);
  }

  identify() {
    if (this.cache.session_id) {
      logger.log('WS', 'SENDING RESUME');
      this.send(6, this.cache);
    } else {
      logger.log('WS', 'SENDING IDENTIFY');
      const uniq = `${Package.name}/${Package.version}`;
      const d = {
        token: this.client.token,
        large_threshold: 150,
        compress: true,
        properties: {
          $os: uniq,
          $browser: uniq,
          $device: uniq,
        },
      };
      if (this.client.options.presence) d.presence = this.client.options.presence;
      this.send(2, d);
    }
  }

  connect(gateway = this.gateway) {
    this.gateway = gateway;
    const ws = this.ws = new WebSocket(`${gateway}/?v=6&encoding=etf`);
    ws.onclose = this.onClose.bind(this);
    ws.onerror = this.onError.bind(this);
    ws.onmessage = this.onMessage.bind(this);
    ws.onopen = this.onOpen.bind(this);
  }
}

module.exports = WebSocketConnection;
