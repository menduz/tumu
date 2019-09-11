const program = require('commander')
const readline = require('readline')
const help = require('../help')
const fixHostUrl = require('../fixhosturl')
const connection = require('../connection')

module.exports = (config) => program
  .command('workspace_status')
  .description('display information about a workspace')
  .option(
    '--host <host>',
    'set the tumu host to connect to e.g. https://example.com:8080/'
  )
  .option(
    '-w,--workspace <workspace>',
    'workspace to query'
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
    const socket = connection(host, token, {
      open: () => socket.send('workspace_status', workspace),
      workspace_status_complete: (status) => {
        socket.close()
        console.log()
        console.log('  Members')
        for (let member of status.members)
          console.log(`    ${member.emailAddress}`)
        console.log('')
      }
    })
  })
