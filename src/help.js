module.exports = {
login: (host) => console.error(`
  Not logged into ${host}

  1. Run \`tumu login <host>\` to login
`),
host: () => console.error(`
  The tumu host to connect to is not specified — please fix by:

  1. Passing --host to this command
  2. Specifying a TUMU_HOST environment variable
  3. Or setting TUMU_HOST in an .env file


  If you want to setup a tumu host follow the instructions here
  https://github.com/tcoats/tumu-host

`),
workspace: () => console.error(`
  The workspace is not specified — please fix by:

  1. Passing --workspace to this command
  2. Specifying a TUMU_WORKSPACE environment variable
  3. Or setting TUMU_WORKSPACE in an .env file


  If you need a new workspace run \`tumu workspace_create\`

`),
app: () => console.error(`
  The app is not specified — please fix by:

  1. Passing --app to this command
  2. Specifying a TUMU_APP environment variable
  3. Or setting TUMU_APP in an .env file


  If you need a new app run \`tumu app_create\`

`),
inpit: () => console.error(`
  An input file is not specified — please fix by:

  1. Passing a file path to this command
  2. Specifying a TUMU_INPUT environment variable
  3. Or setting TUMU_INPUT in an .env file
`)
}