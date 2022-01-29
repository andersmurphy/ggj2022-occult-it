import Peer from 'peerjs'

let yourId = document.getElementById('yourId')

let sendButton = document.getElementById('sendButton')
let sendInput  = document.getElementById('sendInput')
let connectButton = document.getElementById('connectButton')
let userId = document.getElementById('userId')

const setupConnection = (conn) => {
  conn.on('open', function() {
    conn.on('data', function(data) {
      console.log('Received', data)
    })
    // this is what we would use to send data to the other peer
    sendButton.addEventListener(
      'click', () => conn.send(sendInput.value), false)
  })
}

const connectToOtherPeer = (peer, peerId) => {
  conn = peer.connect(peerId)
  setupConnection(conn)
}

connectButton.addEventListener(
  'click', () => connectToOtherPeer(peer, userId.value), false)

const setupPeer = (peer) => {
  peer.on('connection', function(conn) {
    setupConnection(conn)
  })
}

let hostId = 'occult'
let peer = new Peer(hostId)
peer.on('open', function(id) {
  yourId.textContent = id
})

peer.on('error', function(err) {
  peer = new Peer()
  peer.on('open', function(id) {
    yourId.textContent = id
  })
})

setupPeer(peer)
