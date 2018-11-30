const body = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Tumu</title>
  </head>
  <body>
    <script>
      let url = window.location.hostname
      if (window.location.protocol == 'https:') url = 'wss://' + url
      else url = 'ws://' + url
      if (window.location.port) url += ':' + window.location.port
      console.log('Connecting to ', url)
      const socket = new WebSocket(url)
      socket.addEventListener('open', () => {
        socket.send('Hello Server!')
      })
      socket.addEventListener('message', (e) => {
        console.log('Message from server ', e.data)
      })
    </script>
  </body>
</html>`

hub.on('http', (res, req) => {
  console.log(Date.now(), req.url.href, req.body)
  res.emit('writeHtml', body)
})

hub.on('websocket', (socket, req) => {
  socket
    .on('open', () => {
      console.log('OPEN')
    })
    .on('message', (message) => {
      console.log('Message from client', message)
      socket.emit('send', 'Hello Client!')
    })
    .on('error', (err) => {
      console.error(err)
    })
})

const connection = websocket('ws://clayish-neuroeconomical-galapagostortoise.tumu.com:8080/')
  .on('open', () => {
    connection.send('Hello Server, from myself!')
  })
  .on('message', (message) => console.log('Message from server, me!', message))

schedule(Date.now() + 5000, () =>
  console.log('Five seconds after starting'))

fetch('https://jsonplaceholder.typicode.com/todos/1')
  .then((res) => console.log(res.data))

store.put('key', 'value').then(() => {
  store.get('key').then((value) => console.log(value))
})
