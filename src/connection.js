const WebSocket = require('ws')

const socketError = (err) => {
  if (err.code == 'ECONNREFUSED')
    console.error(`\n  Connection to tumu host refused`)
  else
    console.error()


  console.error(` `, err)
  console.error()
}

module.exports = (host, token, callbacks) => {
  if (!callbacks.socketError) callbacks.socketError = socketError
  let fin = false
  const socket = new WebSocket(host, { headers: { Token: token }})
  socket.on('open', () => callbacks.open())
  socket.on('error', (err) => {
    if (fin) return
    socket.terminate()
    callbacks.socketError(err)
  })
  socket.on('message', (data) => {
    let payload = null
    try { payload = JSON.parse(data) }
    catch (e) {
      socket.terminate()
      callbacks.socketError('protocol violation')
      return
    }
    if (!Array.isArray(payload) || payload.length != 2) {
      socket.terminate()
      callbacks.socketError('protocol violation')
      return
    }
    if (callbacks[payload[0]]) callbacks[payload[0]](payload[1])
    else if (payload[0] == 'error') {
      socket.terminate()
      callbacks.socketError(payload[1])
    }
    else callbacks.socketError(`callback not found ${payload[0]}`)
  })
  if (callbacks.close) socket.on('close', callbacks.close)
  return {
    send: (command, params) => socket.send(JSON.stringify([command, params])),
    close: () => socket.terminate()
  }
}