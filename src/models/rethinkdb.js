const Dash = require('rethinkdbdash')
const Config = require('../../config.js')

module.exports = new Dash(Config.Databases.rethinkdb)