const program = require('commander')
const help = require('./help')
const fixHostUrl = require('./fixhosturl')
const connection = require('./connection')

module.exports = (config) => program
  .command('enable')
  .description('enable an app')
  .option(
    '--host <host>',
    'set the tumu host to connect to e.g. https://example.com:8080/'
  )
  .option(
    '-t,--token <token>',
    'set the token token to use against the tumu host'
  )
  .option(
    '-a,--app <app>',
    'set the application to enable'
  )
  .action((cmd) => {
    const host = fixHostUrl(cmd.host || process.env.TUMU_HOST)
    if (!host) return help.host()
    const app = cmd.app || process.env.TUMU_APP
    if (!app) return help.app()
    if (!config.hosts || !config.hosts[host]) return help.login(host)
    const token = cmd.token || config.hosts[host].token
    if (!token) return help.login(host)
    const socket = connection(host, token, {
      open: () => socket.send('app_enable', app),
      app_enable_complete: () => {
        socket.close()
        console.log(`\n  ${app} enabled\n`)
      }
    })
  })
