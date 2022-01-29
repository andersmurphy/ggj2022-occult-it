import Peer from 'peerjs'

let hostId = 'occult-2'

let peer = new Peer(hostId)
peer.on('error', function(err) {
  peer = new Peer()
  setTimeout(() =>
    {
      let conn = peer.connect(hostId)
      conn.on('open', () => {
        console.log('Conneted to host!')
        conn.on('data', (data) => {
          console.log('Received', data)
        })
        conn.send(peer.id + ' connected!')
      })
    }, 1000)
})

peer.on('connection', (conn) => {
  conn.on('open', () => {
    conn.on('data', (data) => {
      console.log('Received', data)
    })
  })
})
