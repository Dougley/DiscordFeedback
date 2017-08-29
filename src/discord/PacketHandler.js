const ROOT_GUILD = require('../../config.json').discord.root_guild;
const Message = require('./structures/Message');

function handle(client, packet) { // eslint-disable-line complexity
  switch (packet.t) {
    case 'READY':
      for (const guild of packet.d.guilds) handle(client, { t: 'GUILD_CREATE', d: guild });
      return packet.d;
    case 'GUILD_CREATE':
      if (packet.d.id !== ROOT_GUILD) return;
      if (packet.d.unavailable) {
        // shit shit shit shit shit
        return false;
      }
      for (const role of packet.d.roles) {
        client.roles.set(role.id, role);
      }
      for (const member of packet.d.members) {
        handle(client, { t: 'GUILD_MEMBER_ADD', d: member });
      }
      for (const channel of packet.d.channels) {
        handle(client, { t: 'CHANNEL_CREATE', d: channel });
      }
      for (const emoji of packet.d.emojis) {
        handle(client, { t: 'EMOJI_CREATE', d: emoji });
      }
      return client;
    case 'GUILD_UPDATE': {
      if (packet.d.id !== ROOT_GUILD) return;
      return false;
    }
    case 'GUILD_DELETE': {
      if (packet.d.id !== ROOT_GUILD) return;
      if (packet.d.unavailable) {
        client.unavailable = true;
      } else {
        // the guild was actually deleted, i give up
        return false;
      }
      return client;
    }
    case 'GUILD_MEMBER_ADD': {
      const member = packet.d;
      const user = member.user;
      delete member.user;
      client.users.set(user.id, user);
      return client.members.set(user.id, member);
    }
    case 'GUILD_MEMBER_UPDATE': {
      const member = client.members.get(packet.d.user.id);
      if (!member) return;
      member.nick = packet.d.nick;
      return member;
    }
    case 'GUILD_MEMBER_REMOVE': {
      const member = client.members.get(packet.d.user.id);
      if (!member) return false;
      client.members.delete(packet.d.user.id);
      return member;
    }
    case 'CHANNEL_CREATE': {
      const channel = client.channels.get(packet.d.id);
      if (channel) return;
      if ([2, 4].includes(packet.d.type)) return;
      return client.channels.set(packet.d.id, {
        id: packet.d.id,
        name: packet.d.name,
        type: packet.d.type,
        nsfw: packet.d.nsfw || /^nsfw(-|$)/.test(packet.d.name) || false,
        recipients: packet.d.recipients,
        last_message_id: packet.d.last_message_id,
      });
    }
    case 'CHANNEL_UPDATE': {
      const channel = client.channels.get(packet.d.id);
      if (!channel) return;
      const n = packet.d;
      if (Reflect.has(n, 'name')) channel.name = n.name;
      if (Reflect.has(n, 'nsfw')) channel.nsfw = n.nsfw; // eslint-disable-line eqeqeq
      if (Reflect.has(n, 'recipients')) channel.recipients = n.recipients;
      return channel;
    }
    case 'CHANNEL_DELETE': {
      const channel = client.channels.get(packet.d.id);
      return client.channels.delete(packet.d.id) && channel;
    }
    case 'MESSAGE_CREATE':
      return new Message(client, packet.d);
    case 'MESSAGE_REACTION_ADD':
    case 'MESSAGE_REACTION_REMOVE':
      return packet.d;
    default:
      return false;
  }
}

module.exports = handle;
