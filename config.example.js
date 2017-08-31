module.exports = {
  discord: {
    token: 'MTXQIAUk_oxWYymVxOGJTdgEEHZancmLvDsavtVmcYykatlA.zyvIxLvNpGGPAaAU_PQ.NvU', // (Not an actual token, don't worry) Enter a Discord bot token here.
    prefix: '!', // Bot prefix for all commands
    reportThreshold: 3,
    feedChannel: 'snowflake',
    messageCacheLimit: '1000', // Sets the maximum amount of messages in the cache this will help keep memory in check.
    guild: '268811439588900865',
    Roles: { // Array of the different Roles
      adminRoles: ['259023993124683776'], // Array of roles for users who can use ALL commands
      moderatorRoles: ['162946809294094336'] // Array of roles for users who can delete, modify and approve others feedback
    }
  },
  uservoice: {
    UVDomain: 'discordapp', // *.uservoice.com, THIS IS NOT YOUR CUSTOM DOMAIN
    subdomain: 'feedback', // UserVoice subdomain
    domain: 'discordapp.com', // UserVoice domain
    key: 'loldiscord', // UserVoice API key
    secret: 'loldiscord', // UserVoice API secret
    forumId: '575944', // ID of the suggestions forum
    forumName: 'test' // URL name of suggestions forum
  },
  services: {
    sentry: 'omerghard'
  },
  timeouts: {
    messageDelete: 2000, // 2 seconds
    errorMessageDelete: 5000, // 5 seconds
    duplicateConfirm: 15000 // 15 seconds
  }
}
