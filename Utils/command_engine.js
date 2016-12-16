const CommandFiles = require('../Commands/index.js')
let commands = []

for (var d in CommandFiles) {
  for (var o in CommandFiles[d].Commands) {
    commands[o] = CommandFiles[d].Commands[o]
  }
}

exports.Commands = commands
