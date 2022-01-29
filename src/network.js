import Peer from 'peerjs'

let hostId = 'occult-2'
let sendButton = document.getElementById('sendButton')
let sendInput  = document.getElementById('sendInput')

let peer = new Peer(hostId)
peer.on('error', function(err) {
  peer = new Peer()
  setTimeout(() =>
    {
      let conn = peer.connect(hostId)
      conn.on('open', function() {
        console.log('conneted to host!')
        conn.on('data', function(data) {
          console.log('Received', data)
        })
        // this is what we would use to send data to the other peer
        sendButton.addEventListener(
          'click', () => conn.send(sendInput.value), false)
      })
    }, 1000)
})

peer.on('connection', function(conn) {
  conn.on('open', function() {
    conn.on('data', function(data) {
      console.log('Received', data)
    })
    // this is what we would use to send data to the other peer
    sendButton.addEventListener(
      'click', () => conn.send(sendInput.value), false)
  })
})
