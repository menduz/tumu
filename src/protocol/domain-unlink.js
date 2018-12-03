const program = require('commander')
const readline = require('readline')
const help = require('../help')
const fixHostUrl = require('../fixhosturl')
const connection = require('../connection')

module.exports = (config) => program
  .command('domain_unlink')
  .description('remove a domain name to an app')
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
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl.question(`\n  Unlinking a domain name\n\n  Type domain name: `, (domain) => {
      rl.close()
      const socket = connection(host, token, {
        open: () => socket.send('domain_unlink', domain),
        domain_unlink_complete: (app) => {
          socket.close()
          console.log(`\n  Domain name unlinked\n`)
        }
      })
    })
  })
