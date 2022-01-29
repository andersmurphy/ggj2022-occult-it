import Peer from 'peerjs'

// Id of the Host. Change this if you are having weird issues.
// Chances are someone else who may be running an old Client
// is the Host.
let hostId = 'occult-5'

let peer = new Peer(hostId)
let connections = new Set()
// Latest outState stored for new Clients
let outState = null
// Queue of inState
let inState = []

export const setOutState = (newState) => {
  outState = newState
  // Send outState to Peers
  // This will be all Clients in the case of the Host
  // This will be to the Host in the case of a Client
  connections.forEach((conn) => conn.send(outState))
}

// CLIENT CODE
// On failing to become the Host a peer becomes a Client
peer.on('error', function(err) {
  peer = new Peer()
  setTimeout(() =>
    {
      let conn = peer.connect(hostId)
      // Keep track of connections in the case of the client this
      // will only ever be one.
      connections.add(conn)
      conn.on('open', () => {
        conn.on('data', (data) => {
          // Add to clients inState
          inState.push(data)
        })
      })
    }, 2000)
})

// HOST CODE
peer.on('connection', (conn) => {
  // Keep track of connections
  connections.add(conn)
  conn.on('open', () => {
    conn.on('data', (data) => {
      // Add to Host inState
      inState.push(data)
    })
    // Send Host outState to client on connection
    conn.send(outState)
  })
})
