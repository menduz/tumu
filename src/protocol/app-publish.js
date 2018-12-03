const fs = require('fs')
const program = require('commander')
const help = require('../help')
const fixHostUrl = require('../fixhosturl')
const connection = require('../connection')

module.exports = (config) => program
  .command('publish [input]')
  .description('publish javascript to a tumu host')
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
    'set the application to publish'
  )
  .action((input, cmd) => {
    const host = fixHostUrl(cmd.host || process.env.TUMU_HOST)
    if (!host) return help.host()
    const app = cmd.app || process.env.TUMU_APP
    if (!app) return help.app()
    if (!config.hosts || !config.hosts[host]) return help.login(host)
    const token = cmd.token || config.hosts[host].token
    if (!token) return help.login(host)
    const processCode = (code) => {
      if (!code) {
        if (!input) input = process.env.TUMU_FILE || 'index.js'
        if (!input) return inputHelp()
        if (!fs.existsSync(input))
          return console.error(`\n  Input file not found: ${input}\n`)
        code = fs.readFileSync(input, 'utf8')
        if (!code) return console.error(`\n  Could not read input file: ${input}\n`)
      }
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
        open: () => socket.send('app_publish', { app, code }),
        error: (err) => {
          socket.close()
          clearInterval(handle)
          process.stdout.clearLine()
          process.stdout.cursorTo(0)
          console.error(err)
        },
        app_publish_complete: () => {
          socket.close()
          clearInterval(handle)
          process.stdout.clearLine()
          process.stdout.cursorTo(0)
          console.log(`  Published ${app}\n`)
        }
      })
    }
    if (process.stdin.isTTY) return processCode()
    let handle = setTimeout(processCode, 50)
    let code = ''
    process.stdin.on('readable', () => {
      clearTimeout(handle)
      handle = null
      const chunk = process.stdin.read()
      if (chunk != null) code += chunk
    })
    process.stdin.on('end', () => processCode(code))
  })
