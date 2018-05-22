//Handle all messages received, regardless of them being form the 'server' or 'client'
const Peer = require('./peer')
const Queue = require('././Models/queue')
const InitialConnector = require('./initialconnector')
const ioClient = require('socket.io-client')

class Receiver {
    constructor(ioServer, disconnector) {
        this.server = ioServer;

        this.handleServerReceives();
    }

    handleServerReceives() {
        if (this.server) {
            // event fired every time a new client connects:
            this.server.on('connection', (socket) => {
                socket.on('disconnect', () => {
                    //ToDo: Do something with disconnector i think. Maybe move this. We'll see later...
                });

                socket.on('message_isAlive', (message) => {
                    socket.emit("message_isAlive", "Yes, I am online")
                })
                socket.on('new_peer', (message) => {
                    if (PeerQueue.isFull()) {
                        let copy = Peer.PeerQueue.copy()
                        copy.flip()
                        PeerQueue.remove()
                        Peer.PeerQueue.add({
                            client: socket,
                            ip: message
                        })

                    } else {
                        let copy = Peer.PeerQueue.copy()
                        Peer.PeerQueue.add({
                            client: socket,
                            ip: message
                        })
                    }
                    socket.emit('new_peer', {
                        peers: toSend,
                        ip: InitialConnector.MyIP()
                    })
                })
            });
        }
    }

    addClientReceives(client) {
        if (client) {
            client.on('new_peer', (received) => {
                console.log("Received QUEUE:" + received.peers)
                if (!received.peers.isFull()) {
                    received.peers.remove()
                    received.peers.add({
                        ip: InitialConnector.MyIP()
                    })
                }
                received.peers.forEach(peer => {
                    peer.client = ioClient.connect('http://' + peer.ip + ':8080'); //ToDo: add client receive events and change ip + port And maybe make generic newClient method
                    Peer.PeerQueue.add(peer)
                });
                console.log("FINAL QUEUE:" + Peer.PeerQueue())
            })
            // DO I HAVE ENOUGH
        }
    }
}

module.exports = Receiver;