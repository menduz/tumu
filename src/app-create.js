const program = require('commander')
const help = require('./help')
const fixHostUrl = require('./fixhosturl')
const connection = require('./connection')

module.exports = (config) => program
  .command('new')
  .description('create a new app')
  .option(
    '--host <host>',
    'set the tumu host to connect to e.g. https://example.com:8080/'
  )
  .option(
    '-t,--token <token>',
    'set the token token to use against the tumu host'
  )
  .action((cmd) => {
    const host = fixHostUrl(cmd.host || process.env.TUMU_HOST)
    if (!host) return help.host()
    if (!config.hosts || !config.hosts[host]) return help.login(host)
    const token = cmd.token || config.hosts[host].token
    if (!token) return help.login(host)
    const socket = connection(host, token, {
      open: () => socket.send('app_create'),
      app_created: (app) => {
        socket.close()
        console.log(`\n  Created new app ${app}\n`)
      }
    })
  })
