const r = require('../models/rethinkdb')
const Constants = require('../../constants')

module.exports = {
  generateLeaderboard: (bot) => {
    let count = 1
    r.table('analytics').orderBy('exp').limit(Constants.Leaderboards.cutoff).then(data => {
      let result = []
      data.map(x => { // Dougley: Not too sure about the embed format here, might need to collect some feedback later on
        let user = bot.Users.get(x.id)
        result.push({
          raw: x,
          embed: {
            title: "Leaderboards - Place " + count,
            color: 3733813,
            description: user.username + '#' + user.discriminator,
            thumbnail: {
              url: user.avatar_url
            },
            fields: [
              {
                name: "EXP",
                value: x.exp
              }
            ]
          }
        })
        count++
      })
      return Promise.resolve(result)
    }).catch(Promise.reject)
  }
}