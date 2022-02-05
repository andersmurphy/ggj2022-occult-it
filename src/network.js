import Peer from 'peerjs'
import state from './state'

let peer = null
let hostId = 'occult-77'

export class NetCommandId {
  static game = 'game'
  static player = 'player'
  static pipe = 'pipe'
}

let connections = new Set()

let connected = false

// Queue of inState
export const inState = []
let outState = {}

export const getNetworkId = () => peer ? peer.id : null;

export const isConnected = () => connected

export const singlePlayer = () => peer == null

export const isHost = () => peer ? peer.id == hostId : false;

export const setOutState = (newState) => {
  if (singlePlayer()) return
  outState = newState
  // Send outState to all Peers
  //console.log("Broadcasting: ", outState)
  connections.forEach((conn) => conn.send(outState))
}

export function connect() {
  // Id of the Host. Change this if you are having weird issues.
  // Chances are someone else who may be running an old Client
  // is the Host.

  peer = new Peer(hostId)
  // Latest outState stored for new Clients

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
          console.log("Peer opened as client")
          conn.on('data', (data) => {
            // Add to clients inState
            //console.log("Got data: ", data)
            inState.push(data)
          })
        })
      }, 1000)
  })

  peer.on('open', (id) => {
    connected = true

    if (isHost()) {
      console.log('Peer opened as host')
    } else {
      console.error('Unexpectedly had host peer opened as client')
    }
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
        // Forward Data to Peers Except current Conn
        let currentConn = conn
        connections.forEach((conn) =>
          // Don't send data to current connection
          {if (conn.connectionId !== currentConn.connectionId) conn.send(data)})
      })
      console.log("Sending Initial State ", state)
      conn.send({
        command: NetCommandId.game,
        state: state
      })
    })
  })
}

window.connect = connect
