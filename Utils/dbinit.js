const Dash = require('rethinkdbdash')
const r = new Dash()

r.db('DFB').table('queue').then(() => {
  console.log('Database DFB exists, checking for tables...')
  checkGuilds().then((e) => {
    console.log(e)
    checkTags().then((e) => {
      console.log(e)
      checkUsers().then((e) => {
        console.log(e)
        drainAndExit()
      }).catch(e => {
        console.error(e)
      })
    }).catch(e => {
      console.error(e)
    })
  }).catch(e => {
    console.error(e)
  })
}).catch(e => {
  if (e.msg === 'None of the pools have an opened connection and failed to open a new one') {
    console.error('Could not connect to the RethinkDB instance, make sure it is running!')
    process.exit()
  } else if (e.msg === 'Database `DFB` does not exist.') {
    console.log('Creating database and tables, this may take a little while.')
    r.dbCreate('DFB').run().then(() => {
      checkGuilds().then((e) => {
        console.log(e)
        checkTags().then((e) => {
          console.log(e)
          checkUsers().then((e) => {
            console.log(e)
            drainAndExit()
          }).catch(e => {
            console.error(e)
            drainAndExit()
          })
        }).catch(e => {
          console.error(e)
          drainAndExit()
        })
      }).catch(e => {
        console.error(e)
        drainAndExit()
      })
    }).catch(e => {
      console.error(e)
      drainAndExit()
    })
  } else {
    console.error(e)
    process.exit()
  }
})

function checkGuilds () {
  return new Promise(function (resolve, reject) {
    r.db('DFB').tableCreate('queue').run().then(() => {
      resolve('Table queue has been created')
    }).catch(e => {
      if (e.msg === 'Table `DFB.queue` already exists.') {
        resolve('The table queue already exists.')
      } else {
        reject(e)
      }
    })
  })
}
function checkTags () {
  return new Promise(function (resolve, reject) {
    r.db('DFB').tableCreate('analytics').run().then(() => {
      resolve('Table analytics has been created')
    }).catch(e => {
      if (e.msg === 'Table `DFB.analytics` already exists.') {
        resolve('The table analytics already exists.')
      } else {
        reject(e)
      }
    })
  })
}

function checkUsers () {
  return new Promise(function (resolve, reject) {
    r.db('DFB').tableCreate('logs').run().then(() => {
      resolve('Table logs has been created')
    }).catch(e => {
      if (e.msg === 'Table `DFB.logs` already exists.') {
        resolve('The table logs already exists.')
      } else {
        reject(e)
      }
    })
  })
}

function drainAndExit () {
  r.getPoolMaster().drain().then(() => {
    process.exit()
  })
}
