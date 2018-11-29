# Tumu
Javascript Serverless CLI

Connects to [Tumu Host](https://github.com/tcoats/tumu-host) instances.

```bash
yarn add global tumu
```

Store your parameters in a .env file:

```bash
# .env file
TUMU_HOST=localhost:8080
TUMU_APP=perky-nana
TUMU_FILE=index.js
```

```bash
tumu login
tumu new
tumu
tumu logs
tumu logout
```

Or provide everything on the command line:

```bash
tumu login localhost:8080
tumu --host localhost:8080 new
tumu --host localhost:8080 --app perky-nana index.js
tumu --host localhost:8080 --app perky-nana logs
tumu --host localhost:8080 logout
```

# Todo
- [x] Reconnect logs
- [ ] Stop / start apps
- [ ] Code from stdin
