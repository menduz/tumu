const program = require('commander')
const readline = require('readline')
const help = require('../help')
const fixHostUrl = require('../fixhosturl')
const connection = require('../connection')

module.exports = (config, writeConfig) => program
  .command('login [host]')
  .description('authenticate with a tumu host')
  .option(
    '-t,--token <token>',
    'set the token token to use against the tumu host'
  )
  .action((host, cmd) => {
    if (!host) host = process.env.TUMU_HOST
    if (!host) return help.host()
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
        login_complete: (token) => {
          socket.close()
          config.hosts[host].emailAddress = emailAddress
          config.hosts[host].token = token
          writeConfig()
          console.log(`\n  Successfully logged into ${host}\n`)
        },
        login_secret_generated: (secret) => {
          const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
          rl.question(`\n  Here is your authenticator secret\n  Use this secret to generate a one time code\n  ${secret}\n\n  Type authenticator code: `, (code) => {
            rl.close()
            socket.send('login_code', { emailAddress, code })
          })
        },
        login_challenge: () => {
          const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
          rl.question(`  Type authenticator code: `, (code) => {
            rl.close()
            socket.send('login_code', { emailAddress, code })
          })
        },
        login_failure: () => {
          socket.close()
          console.error('\n  Authentication failed\n')
        }
      })
    })
  })