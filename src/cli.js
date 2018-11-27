const program = require('commander')
const version = require('../package.json').version
const { homedir } = require('os')
const path = require('path')
const fs = require('fs')

let config = {}
const writeConfig = () =>
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
const readConfig = () =>
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
const configPath = path.join(homedir(), '.tumu.json')
if (!fs.existsSync(configPath)) writeConfig()
else readConfig()


program.version(version)


// verbs: login logout blank / publish log

console.log(config)