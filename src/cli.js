#!/usr/bin/env node

require('dotenv').config()
const program = require('commander')
const version = require('../package.json').version
const { homedir } = require('os')
const { join } = require('path')
const fs = require('fs')

let config = { hosts: {} }
const configPath = join(homedir(), '.tumu.json')
const writeConfig = () =>
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
if (!fs.existsSync(configPath)) writeConfig()
else config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
if (!config.hosts) {
  config.hosts = {}
  writeConfig()
}

program.version(version)

require('./protocol/login')(config, writeConfig)
require('./protocol/logout')(config, writeConfig)

require('./protocol/status')(config, writeConfig)

require('./protocol/workspace-create')(config, writeConfig)
require('./protocol/workspace-rename')(config, writeConfig)
require('./protocol/workspace-delete')(config, writeConfig)
require('./protocol/workspace-invite')(config, writeConfig)
require('./protocol/workspace-leave')(config, writeConfig)

require('./protocol/app-create')(config, writeConfig)
require('./protocol/app-enable')(config, writeConfig)
require('./protocol/app-disable')(config, writeConfig)
require('./protocol/app-delete')(config, writeConfig)
require('./protocol/app-rename')(config, writeConfig)
require('./protocol/app-logs')(config, writeConfig)
require('./protocol/app-code')(config, writeConfig)
require('./protocol/app-publish')(config, writeConfig)

require('./protocol/domain-link')(config, writeConfig)
require('./protocol/domain-unlink')(config, writeConfig)

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