const program = require('commander')
const readline = require('readline')
const help = require('../help')
const fixHostUrl = require('../fixhosturl')
const connection = require('../connection')

module.exports = (config) => program
  .command('workspace_invite')
  .description('create someone to a workspace')
  .option(
    '--host <host>',
    'set the tumu host to connect to e.g. https://example.com:8080/'
  )
  .option(
    '-w,--workspace <workspace>',
    'workspace to give access to'
  )
  .option(
    '-t,--token <token>',
    'set the token token to use against the tumu host'
  )
  .action((cmd) => {
    const host = fixHostUrl(cmd.host || process.env.TUMU_HOST)
    if (!host) return help.host()
    if (!config.hosts || !config.hosts[host]) return help.login(host)
    const workspace = cmd.workspace || process.env.TUMU_WORKSPACE
    if (!workspace) return help.workspace()
    const token = cmd.token || config.hosts[host].token
    if (!token) return help.login(host)
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl.question(`\n  Inviting someone to workspace\n\n  Type their email address: `, (emailAddress) => {
      rl.close()
      const socket = connection(host, token, {
        open: () => socket.send('workspace_invite', { workspace, emailAddress }),
        workspace_invite_complete: () => {
          socket.close()
          console.log(`\n  Invitation sent\n`)
        }
      })
    })
  })
