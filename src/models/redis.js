const Redis = require('ioredis')
const Config = require('../../config.js')

module.exports = new Redis(Config.Databases.redis)