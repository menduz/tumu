const program = require('commander')
const readline = require('readline')
const help = require('../help')
const fixHostUrl = require('../fixhosturl')
const connection = require('../connection')

module.exports = (config) => program
  .command('app_rename')
  .description('change the name of a app')
  .option(
    '--host <host>',
    'set the tumu host to connect to e.g. https://example.com:8080/'
  )
  .option(
    '-a,--app <app>',
    'app to rename'
  )
  .option(
    '-t,--token <token>',
    'set the token token to use against the tumu host'
  )
  .action((cmd) => {
    const host = fixHostUrl(cmd.host || process.env.TUMU_HOST)
    if (!host) return help.host()
    if (!config.hosts || !config.hosts[host]) return help.login(host)
    const app = cmd.app || process.env.TUMU_APP
    if (!app) return help.app()
    const token = cmd.token || config.hosts[host].token
    if (!token) return help.login(host)
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl.question(`\n  Renaming app\n\n  Type new app name: `, (name) => {
      rl.close()
      const socket = connection(host, token, {
        open: () => socket.send('app_rename', { app, name }),
        app_renamed: () => {
          socket.close()
          console.log(`\n  App has been renamed\n`)
        }
      })
    })
  })
