const UserVoice = require('uservoice-nodejs')
const Config = require('../../config.js')

module.exports = {
  v1: new UserVoice.Client({
    subdomain: Config.Uservoice.domains.sub,
    domain: Config.Uservoice.domains.domain,
    apiKey: Config.Uservoice.keys.apikey,
    apiSecret: Config.Uservoice.keys.apisecret
  }),
  v2: new UserVoice.ClientV2({
    clientId: Config.Uservoice.keys.apikey,
    subdomain: Config.Uservoice.domains.uservoicesub
  })
}