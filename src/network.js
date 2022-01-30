import Peer from 'peerjs'
import state from './state'

// Id of the Host. Change this if you are having weird issues.
// Chances are someone else who may be running an old Client
// is the Host.
let hostId = 'occult-77-jock'

let peer = new Peer(hostId)
let connections = new Set()
// Latest outState stored for new Clients
let outState = {}

export class NetCommandId {
  static game = 'game'
  static player = 'player'
  static pipe = 'pipe'
}

// Queue of inState
export const inState = []

export const getNetworkId = () => peer ? peer.id : null;

export const isHost = () => peer ? peer.id == hostId : false;

export const setOutState = (newState) => {
  outState = newState
  // Send outState to all Peers
  //console.log("Broadcasting: ", outState)
  connections.forEach((conn) => conn.send(outState))
}

// CLIENT CODE
// On failing to become the Host a peer becomes a Client
peer.on('error', function(err) {
  console.log("Trying to be a client")
  peer = new Peer()
  setTimeout(() =>
    {
      let conn = peer.connect(hostId)
      // Keep track of connections in the case of the client this
      // will only ever be one.
      console.log("Conn ", conn)
      connections.add(conn)
      conn.on('open', () => {
        console.log("Opened")
        conn.on('data', (data) => {
          // Add to clients inState
          //console.log("Got data: ", data)
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
    console.log(`${conn} connected`, conn)
    conn.on('data', (data) => {
      // Add to Host inState
      inState.push(data)
      // Forward Data to Peers
      connections.forEach((conn) => conn.send(data))
    })
    console.log("Sending Initial State ", state)
    conn.send({
      command: NetCommandId.game,
      state: state
    })
  })
})
