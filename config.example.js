module.exports = {
  Discord: {
    token: 'wowie',
    prefix: '!',
  }, 
  Uservoice: {
    domains: {
      uservoicesub: 'discordapp', // *.uservoice.om, not your custom domain
      sub: 'feedback',
      domain: 'discordapp.com'
    },
    keys: {
      apikey: 'loldiscord',
      apisecret: 'loldiscord'
    }
  },
  Services: {
    sentry: ''
  },
  Settings: {
    roles: { 
      // these are seperate from defaultperms in constants.js, these are variable and can be overridden by roles with higher levels
      // defaultperms default to the value given and doesnt care about if you have other roles that have other permissions
      '268815388882632704': 1,
      '273149949720526848': 2,
      '273149954120482816': 3,
      '273149954850160640': 4,
      '273149955512860673': 5,
      '273149956167172107': 6
    },
    guild: {
      id: '268811439588900865',
      feed: '258274103935369219'
    },
    reports: {
      threshold: 3
    }
  }
}