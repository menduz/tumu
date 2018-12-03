const program = require('commander')
const help = require('../help')
const fixHostUrl = require('../fixhosturl')
const connection = require('../connection')

module.exports = (config) => program
  .command('status')
  .description('display workspace and app status')
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
      open: () => socket.send('status'),
      status: (status) => {
        socket.close()
        console.log()
        if (status.workspaces.length == 0) return console.log('  No workspaces\n\n\n   If you need a new workspace run `tumu workspace_create`')
        for (let workspace of status.workspaces) {
          console.log(`  Workspace: ${workspace.name} · ${workspace.workspaceId}`)
          for (let app of workspace.apps) {
            console.log(`    App: ${app.name} · ${app.appId}${app.disabled ? ' · disabled' : ''}`)
            for (let domain of app.domains) console.log(`      ${domain}`)
          }
        }
        console.log()
      }
    })
  })
