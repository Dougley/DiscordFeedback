let Config = {
  token: 'MTXQIAUk_oxWYymVxOGJTdgEEHZancmLvDsavtVmcYykatlA.zyvIxLvNpGGPAaAU_PQ.NvU', // (Not an actual token, don't worry) Enter a Discord bot token here.
  prefix: '!',                                                                       // Bot prefix for all commands
  Roles: {                                                                           // Array of the different Roles
    adminRoles: ['259023993124683776'],                                                // Array of roles for users who can use ALL commands
    moderatorRoles: ['162946809294094336']                                            // Array of roles for users who can delete, modify and approve others feedback
  },
  uservoice: {
    key: 'loldiscord',                                                               // UserVoice API key
    secret: 'loldiscord',                                                            // UserVoice API secret
    trusted: true,                                                                   // Is the key trusted by UserVoice?
    tokenRequestUrl: 'http://bing.com',                                              // UserVoice API request token URL
    tokenAccessUrl: 'http://google.com',                                             // UserVoice API access token URL,
    OauthAuthUrl: 'http://yahoo.com'                                                 // UserVoice API OAuth redirect URL
  }
}

module.exports = Config
