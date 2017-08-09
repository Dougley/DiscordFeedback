const config = require('../../../config');

class Message {
  constructor(client, packet) {
    Object.defineProperty(this, 'client', { value: client });

    this.patch(packet);

    this.react = new Proxy(config.discord.emojis, {
      get: (target, prop) => {
        const id = target[prop];
        if (typeof id !== 'string') return id;
        if (id == null) return Promise.reject(new Error('invalid emoji')); // eslint-disable-line eqeqeq
        return (time) => {
          const endpoint = client.api.channels(this.channel_id).messages(this.id)
            .reactions(encodeURIComponent(`${prop}:${id}`), '@me');
          return endpoint.put().then(() => {
            if (time) return new Promise((s, f) => setTimeout(() => endpoint.delete().then(s, f), time));
            return true;
          });
        };
      },
    });
  }

  patch(packet) {
    Object.assign(this, packet);
    this.channel = this.client.channels[packet.channel_id];
  }

  get createdAt() {
    return new Date(this.timestamp);
  }

  get editedAt() {
    return new Date(this.editedTimestamp);
  }

  reply(content, options = {}) {
    if (typeof content === 'string') options.content = content;
    else options = content;

    if (options.content && !options.code && options.bold !== false) options.content = `**${options.content}**`;
    if (options.code) options.content = `\`\`\`${options.code}\n${options.content}\n\`\`\``;

    return this.client.api.channels(this.channel_id).messages.post({
      data: options,
    });
  }

  toJSON() {
    const ret = Object.assign({}, this);
    ret.client = undefined;
    ret.channel = {
      id: this.channel.id,
      name: this.channel.name,
      nsfw: this.channel.nsfw,
      type: this.channel.type,
    };
    ret.channel.guild = this.channel.guild ? {
      id: this.channel.guild.id,
      name: this.channel.guild.name,
    } : null;
    return ret;
  }
}

module.exports = Message;
