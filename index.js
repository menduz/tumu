#!/usr/bin/env node

require('dotenv').config()
const program = require('commander')
const version = require('./package.json').version
const { homedir } = require('os')
const { join } = require('path')
const fs = require('fs')
const readline = require('readline')
const WebSocket = require('ws')

let config = { hosts: {} }
const configPath = join(homedir(), '.tumu.json')
const writeConfig = () =>
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
const readConfig = () =>
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
if (!fs.existsSync(configPath)) writeConfig()
else readConfig()
if (!config.hosts) {
  config.hosts = {}
  writeConfig()
}

program.version(version)

const loginHelp = (host) => console.error(`
  Not logged into ${host}

  1. Run \`tumu login <host>\` to login
`)
const hostHelp = () => console.error(`
  The tumu host to connect to is not specified — please fix by:

  1. Passing --host to this command
  2. Specifying a TUMU_HOST environment variable
  3. Or setting TUMU_HOST in an .env file


  If you want to setup a tumu host follow the instructions here
  https://github.com/tcoats/tumu-host

`)
const appHelp = () => console.error(`
  The app is not specified — please fix by:

  1. Passing --app to this command
  2. Specifying a TUMU_APP environment variable
  3. Or setting TUMU_APP in an .env file


  If you need a new app run \`tumu new\`

`)
const inputHelp = () => console.error(`
  An input file is not specified — please fix by:

  1. Passing a file path to this command
  2. Specifying a TUMU_INPUT environment variable
  3. Or setting TUMU_INPUT in an .env file
`)

const fixHostUrl = (host) => {
  if (!host) return host
  if (host.indexOf('ws://') == -1) return `ws://${host}`
  return host
}
const connection = (host, token, callbacks) => {
  let fin = false
  const socket = new WebSocket(host, { headers: { Token: token }})
    socket.on('open', () => callbacks.open())
    socket.on('error', (err) => {
      if (fin) return
      socket.terminate()
      callbacks.error(err)
    })

    socket.on('message', (data) => {
      let payload = null
      try { payload = JSON.parse(data) }
      catch (e) {
        socket.terminate()
        callbacks.error('protocol violation')
        return
      }
      if (!Array.isArray(payload) || payload.length != 2) {
        socket.terminate()
        callbacks.error('protocol violation')
        return
      }
      if (callbacks[payload[0]]) callbacks[payload[0]](payload[1])
      else callbacks.error('protocol violation')
    })
  return {
    send: (command, params) => socket.send(JSON.stringify([command, params])),
    close: () => socket.terminate()
  }
}
const socketError = (err) => {
  if (err.code == 'ECONNREFUSED')
    console.error(`\n  Connection to tumu host refused`)

  console.error(err)
  console.error()
}

program
  .command('login [host]')
  .description('authenticate with a tumu host')
  .option(
    '-t,--token <token>',
    'set the token token to use against the tumu host'
  )
  .action((host, cmd) => {
    if (!host) host = process.env.TUMU_HOST
    if (!host) return hostHelp()
    host = fixHostUrl(host)
    if (!config.hosts[host]) config.hosts[host] = {}
    if (config.hosts[host].token)
      return console.log(`\n  Currently logged into ${host}\n`)
    console.log(`\n  Logging into ${host}\n`)
    const getEmailAddress = config.hosts[host].emailAddress
      ? Promise.resolve(config.hosts[host].emailAddress)
      : new Promise((resolve, reject) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
        rl.question(`  Type email address: `, (emailAddress) => {
          rl.close()
          resolve(emailAddress)
        })
      })
    getEmailAddress.then((emailAddress) => {
      const socket = connection(host, null, {
        open: () => socket.send('login', emailAddress),
        error: socketError,
        login: (token) => {
          socket.close()
          config.hosts[host].emailAddress = emailAddress
          config.hosts[host].token = token
          writeConfig()
          console.log(`\n  Successfully logged into ${host}\n`)
        },
        secret: (secret) => {
          const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
          rl.question(`\n  Here is your authenticator secret\n  Use this secret to generate a one time code\n  ${secret}\n\n  Type authenticator code: `, (code) => {
            rl.close()
            socket.send('code', { emailAddress, code })
          })
        },
        challenge: () => {
          const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
          rl.question(`  Type authenticator code: `, (code) => {
            rl.close()
            socket.send('code', { emailAddress, code })
          })
        },
        failed: () => {
          socket.close()
          console.error('\n  Authentication failed\n')
        }
      })
    })
  })

program
  .command('logout [host]')
  .description('logout of a tumu host')
  .action((host, cmd) => {
    if (!host) host = process.env.TUMU_HOST
    if (!host) return hostHelp()
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
      error: socketError,
      logout: () => {
        socket.close()
        delete config.hosts[host]
        writeConfig()
        console.log(`\n  Logged out of ${host}\n`)
      }
    })
  })

program
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
    if (!host) return hostHelp()
    if (!config.hosts || !config.hosts[host]) return loginHelp(host)
    const token = cmd.token || config.hosts[host].token
    if (!token) return loginHelp(host)
    const socket = connection(host, token, {
      open: () => socket.send('new'),
      error: socketError,
      new: (app) => {
        socket.close()
        console.log(`\n  Created new app ${app}\n`)
      }
    })
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
    const host = fixHostUrl(cmd.host || process.env.TUMU_HOST)
    if (!host) return hostHelp()
    const app = cmd.app || process.env.TUMU_APP
    if (!app) return appHelp()
    if (!config.hosts || !config.hosts[host]) return loginHelp(host)
    const token = cmd.token || config.hosts[host].token
    if (!token) return loginHelp(host)
    if (!input) input = process.env.TUMU_FILE
    if (!input) return inputHelp()
    if (!fs.existsSync(input))
      return console.error(`\n  Input file not found: ${input}\n`)
    const code = fs.readFileSync(input, 'utf8')
    if (!code) return console.error(`\n  Could not read input file: ${input}\n`)
    console.log()
    let count = 1
    process.stdout.write(`  Publishing — ${count}`)
    let handle = setInterval(() => {
      count++
      process.stdout.clearLine()
      process.stdout.cursorTo(0)
      process.stdout.write(`  Publishing — ${count}`)
    }, 1000)
    const socket = connection(host, token, {
      open: () => socket.send('publish', { app, code }),
      error: (err) => {
        socket.close()
        clearInterval(handle)
        process.stdout.clearLine()
        process.stdout.cursorTo(0)
        socketError(err)
      },
      publish: () => {
        socket.close()
        clearInterval(handle)
        process.stdout.clearLine()
        process.stdout.cursorTo(0)
        console.log(`  Published ${app}\n`)
      }
    })
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
    const host = fixHostUrl(cmd.host || process.env.TUMU_HOST)
    if (!host) return hostHelp()
    const app = cmd.app || process.env.TUMU_APP
    if (!app) return appHelp()
    if (!config.hosts || !config.hosts[host]) return loginHelp(host)
    const token = cmd.token || config.hosts[host].token
    if (!token) return loginHelp(host)
    // TODO: communicate with host
    console.log(`\nStreaming logs from ${app}...\n`)
    const socket = connection(host, token, {
      open: () => socket.send('logs'),
      error: socketError,
      log: console.log
    })
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