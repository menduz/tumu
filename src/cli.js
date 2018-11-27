require('dotenv').config()
const program = require('commander')
const version = require('../package.json').version
const { homedir } = require('os')
const path = require('path')
const fs = require('fs')

let config = { hosts: {} }
const configPath = path.join(homedir(), '.tumu.json')
const writeConfig = () =>
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
const readConfig = () =>
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
if (!fs.existsSync(configPath)) writeConfig()
else readConfig()

program.version(version)

const loginHelp = '\n  Run `tumu login <host>` to login\n'
const hostHelp = '\n  Host not supplied\n  Use --host or specify TUMU_HOST as an environment variable\n'
const appHelp = '\n  App not supplied\n  Use --app or specify TUMU_APP as an environment variable\n'

program
  .command('login [host]')
  .description('authenticate with a tumu host')
  .option(
    '-t,--token <token>',
    'set the token token to use against the tumu host'
  )
  .action((host, cmd) => {
    if (!host) host = process.env.TUMU_HOST
    if (!host) return console.error(loginHelp)
    console.log('login')
  })

program
  .command('logout [host]')
  .description('logout of a tumu host')
  .action((host, cmd) => {
    if (!host) host = process.env.TUMU_HOST
    if (!host) return console.error('host not supplied')
    console.log('logout')
  })

program
  .command('publish [input]')
  .description('publish javascript to a tumu host')
  .option(
    '--host <host>',
    'set the tumu host to connect to e.g. https://example.com:8080/'
  )
  .option(
    '-a,--app <app>',
    'set the application to publish'
  )
  .option(
    '-t,--token <token>',
    'set the token token to use against the tumu host'
  )
  .action((input, cmd) => {
    const host = cmd.host || process.env.TUMU_HOST
    if (!host) return console.error(hostHelp)
    const app = cmd.app || process.env.TUMU_APP
    if (!app) return console.error(appHelp)
    console.log('publish')
    console.log(process.env.TUMU_HOST)
  })

program
  .command('logs')
  .description('stream log messages from an application')
  .option(
    '--host <host>',
    'set the tumu host to connect to e.g. https://example.com:8080/'
  )
  .option(
    '-a,--app <app>',
    'set the application to publish'
  )
  .option(
    '-t,--token <token>',
    'set the token token to use against the tumu host'
  )
  .action((cmd) => {
    const host = cmd.host || process.env.TUMU_HOST
    if (!host) return console.error(hostHelp)
    const app = cmd.app || process.env.TUMU_APP
    if (!app) return console.error(appHelp)
    if (!config.hosts || !config.hosts[host])
      return console.error(loginHelp)
    const token = cmd.token || config.hosts[host].token
    if (!token) return console.error(loginHelp)
    console.log('logs')
  })

program
  .command('help [command]')
  .description('display help information for a command')
  .action((command) => (program.commands.find(c => c.name() === command) || program).help())

program.on('--help', () => console.log('\n  Run `tumu help <command>` for more information on specific commands\n'))

const args = process.argv
if (args[2] === '--help' || args[2] === '-h') args[2] = 'help'
if (!args[2] || !program.commands.some(c => c.name() === args[2]))
  args.splice(2, 0, 'publish')

program.parse(args)