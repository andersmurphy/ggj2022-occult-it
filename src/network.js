import Peer from 'peerjs'
import state from './state'

let peer = null
let hostId = 'occult-77-peer-to-peer'

export class NetCommandId {
  static game = 'game'
  static player = 'player'
  static pipe = 'pipe'
  static connectToPeers = 'connectToPeers'
  static removePlayer = 'removePlayer'
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
        // Keep track of connections
        console.log("Connecting to host ", conn)
        connections.add(conn)
        peer.on('connection', (clientConnection) => {
          connections.add(clientConnection)
          console.log("Another client connected to this client")

          clientConnection.on('open', () => {
            console.log("Connection opened from another client", clientConnection)
            const otherClientId = clientConnection.peer
            console.log("otherClientId: ", otherClientId)
            clientConnection.on('data', (data) => {
              // Add to clients inState
              //console.log("Client: Got data from another client: ", data)
              inState.push(data)
            })
          })

          clientConnection.on('close', () => onConnectionClosed(clientConnection))
        })

        conn.on('open', () => {
          connected = true
          console.log("Connected to host as client", conn)
          const clientId = conn.provider.id
          console.log("ClientId: ", clientId)
          conn.on('data', (data) => {
            // Add to clients inState
            //console.log("Client: Got data: ", data)
            if (data.command == NetCommandId.connectToPeers) {
              data.peers.forEach(peer => {
                makePeerConnection(peer)
              });
            } else {
              inState.push(data)
            }
          })
        })

        conn.on('close', () => onConnectionClosed(conn))
      }, 1000)
  })

  // HOST CODE
  peer.on('open', (id) => {
    connected = true

    if (isHost()) {
      console.log('Peer opened as host')
    } else {
      console.error('Unexpectedly had host peer opened as client')
    }
  })

  peer.on('connection', (conn) => {
    // Keep track of connections
    connections.add(conn)
    conn.on('open', () => {
      console.log("A client connected", conn)
      conn.on('data', (data) => {
        // Add to Host inState
        inState.push(data)
      })
      const otherConnections = [...connections].filter(c => c.connectionId != conn.connectionId)

      if (otherConnections.length > 0) {
        const otherPeerIds = otherConnections.map(c => c.peer)

        console.log("Sending peer-ids of others to this new client")
        console.log("Others: ", otherPeerIds)

        conn.send({
          command: NetCommandId.connectToPeers,
          peers: otherPeerIds,
        })
      }

      console.log("Sending Initial State ", state)
      conn.send({
        command: NetCommandId.game,
        state: state
      })
    })

    conn.on('close', () => onConnectionClosed(conn))
  })
}

function makePeerConnection(peerId) {
  let conn = peer.connect(peerId)
  // Keep track of connections
  console.log("Connected to other client ", conn)
  connections.add(conn)
  conn.on('open', () => {
    console.log("Connection opened to another client", conn)
    conn.on('data', (data) => {
      // Add to clients inState
      //console.log("Client: Got data from another client: ", data)
      inState.push(data)
    })
  })

  conn.on('close', () => onConnectionClosed(conn))
}

function onConnectionClosed(conn) {
  console.log("Connection did close: ", conn)
  if (connections.delete(conn)) {
    inState.push({
      command: NetCommandId.removePlayer,
      id: conn.peer
    })
  }
}

window.connect = connect
