const Constants = require('../Constants');

function handle(client, ws, packet) { // eslint-disable-line complexity
  switch (packet.t) {
    case 'READY':
      for (const guild of packet.d.guilds) handle(client, ws, { t: 'GUILD_CREATE', d: guild });
      return packet.d;
    case 'GUILD_CREATE':
      if (packet.d.id !== Constants.ROOT_GUILD) return;
      if (packet.d.unavailable) {
        // shit shit shit shit shit
        return false;
      }
      for (const role of packet.d.roles) {
        client.roles.set(role.id, role);
      }
      for (const member of packet.d.members) {
        const user = member.user;
        delete member.user;
        client.members.set(user.id, member);
        client.users.set(user.id, user);
      }
      for (const channel of packet.d.channels) {
        handle(client, ws, { t: 'CHANNEL_CREATE', d: channel });
      }
      for (const emoji of packet.d.emojis) {
        handle(client, ws, { t: 'EMOJI_CREATE', d: emoji });
      }
      return client;
    case 'GUILD_UPDATE': {
      if (packet.d.id !== Constants.ROOT_GUILD) return;
      return false;
      // const n = packet.d;
      // // if (Reflect.has(n, 'name')) guild.name = n.name;
      // return guild;
    }
    case 'GUILD_DELETE': {
      if (packet.d.id !== Constants.ROOT_GUILD) return;
      if (packet.d.unavailable) {
        client.unavailable = true;
      } else {
        // the guild was actually deleted, i give up
        return false;
      }
      return client;
    }
    case 'GUILD_MEMBER_UPDATE': {
      const member = client.members.get(packet.d.user.id);
      if (!member) return;
      member.nick = packet.d.nick;
      return member;
    }
    case 'GUILD_MEMBER_ADD': {
      const guild = client.guilds[packet.d.guild_id];
      if (!guild || !guild.members) return;
      return guild.members[packet.d.user.id] = { nick: packet.d.nick };
    }
    case 'GUILD_MEMBER_REMOVE': {
      const guild = client.guilds[packet.d.guild_id];
      if (!guild || !guild.members) return;
      const member = guild.members[packet.d.user.id];
      delete guild.members[packet.d.user.id];
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
      return packet.d;
      // return new Message(client, packet.d);
    default:
      return false;
  }
}

module.exports = handle;
