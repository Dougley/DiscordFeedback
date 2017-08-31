const CommandFiles = require('../Commands/index.js')
let commands = []

for (let d in CommandFiles) {
  for (let o in CommandFiles[d].Commands) {
    commands[o] = CommandFiles[d].Commands[o]
  }
}

exports.Commands = commands
