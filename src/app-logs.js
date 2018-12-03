const program = require('commander')
const help = require('./help')
const fixHostUrl = require('./fixhosturl')
const connection = require('./connection')

module.exports = (config) => program
  .command('logs')
  .description('stream log messages from an application')
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
    'set the application to log'
  )
  .action((cmd) => {
    const host = fixHostUrl(cmd.host || process.env.TUMU_HOST)
    if (!host) return help.host()
    const app = cmd.app || process.env.TUMU_APP
    if (!app) return help.app()
    if (!config.hosts || !config.hosts[host]) return help.login(host)
    const token = cmd.token || config.hosts[host].token
    if (!token) return help.login(host)
    console.log(`\nStreaming logs from ${app}...\n`)
    const attempt = () => {
      const socket = connection(host, token, {
        open: () => socket.send('app_stream_logs', app),
        socketError: (err) => {
          if (err.code != 'ECONNREFUSED') console.error(err)
        },
        app_log_message: (args) => console.log(...args),
        app_error_message: (args) => console.error(...args),
        close: () => setTimeout(attempt, 200)
      })
    }
    attempt()
  })
