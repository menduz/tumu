const program = require('commander')
const help = require('./help')
const fixHostUrl = require('./fixhosturl')
const connection = require('./connection')

module.exports = (config, writeConfig) => program
  .command('logout [host]')
  .description('logout of a tumu host')
  .action((host, cmd) => {
    if (!host) host = process.env.TUMU_HOST
    if (!host) return help.host()
    host = fixHostUrl(host)
    if (!config.hosts[host] || !config.hosts[host].token) {
      if (config.hosts[host]) {
        delete config.hosts[host]
        writeConfig()
      }
      return console.log(`\n  Logged out of ${host}\n`)
    }
    const token = config.hosts[host].token
    const socket = connection(host, token, {
      open: () => socket.send('logout', {
        emailAddress: config.hosts[host].emailAddress,
        token: config.hosts[host].token
      }),
      logout_complete: () => {
        socket.close()
        delete config.hosts[host]
        writeConfig()
        console.log(`\n  Logged out of ${host}\n`)
      }
    })
  })