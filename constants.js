// WOW THESE THINGS HAVE THEIR OWN FILE NOW
// THIS SHOULD'VE HAPPEND WHEN I STARTED THIS PROJECT
// WOW

module.exports = { 
  UVRegex: /https?:\/\/[\w.]+\/forums\/(\d{6,})(?:-[\w-]+)?\/suggestions\/(\d{7,})(?:-[\w-]*)?/,
  AutoRole: {
    enabled: true,
    thresholds: {
      // RoleID: EXP
    },
    addons: {
      // RoleID: [{Datapoint: Threshold}]
    },
    decay: {
      enabled: true, // should EXP decay at all?
      threshold: 7, // how many days should somebody be inactive for their EXP to start decaying?
      speed: 1.25, // how fast should EXP decay once they've hit the inactivity mark?
      exponential: true // should decay be exponential?
    }
  },
  UVChannels: {
    default: false, // false = ignore !sumbit commands in uncategorized channels. supply a category ID to default to that category. leave blank to submit uncategorized, if possible
    channels: {
      // ChannelID: UVcategoryID
    }
  },
  DefaultPerms: {
    users: {
      '107904023901777920': 10,
      '110813477156720640': 10
    },
    roles: {
      '268815351360389121': 10,
      '268815286067527690': 10
    }
  },
  Timeouts: { // everything is in ms
    messagedelete: 2500
  },
  Debugging: {
    enable: false,
    mocking: {
      email: 'notdougley@example.com', // email addres returned by getMail, getMail is designed to only work on production
    }
  }
}