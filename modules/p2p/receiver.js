//Handle all messages received, regardless of them being form the 'server' or 'client'
const Queue = require('./Models/queue')
const InitialConnector = require('./initialconnector')
const ioClient = require('socket.io-client')
const Peer = require('./peer')

class Receiver {
    constructor(ioServer, PeerQueue) {
        this.server = ioServer;
        this.PeerQueue = PeerQueue;
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
                    let copy = [];
                    if (this.PeerQueue.isFull()) {
                        copy = this.PeerQueue.copy()
                        copy.flip()
                        PeerQueue.remove()
                        this.PeerQueue.add({
                            client: socket,
                            ip: message
                        })

                    } else {
                        copy = this.PeerQueue.copy()
                        this.PeerQueue.add({
                            client: socket,
                            ip: message
                        })
                    }
                    socket.emit('new_peer', {
                        peers: copy,
                        ip: new InitialConnector().MyIP()
                    })
                })
            });
        }
    }

    addClientReceives(client) {
        if (client) {
            client.on('new_peer', (received) => {
                console.log(received.peers)
                let queue = new Queue(4, received.peers.data);
                queue.add({
                    ip: new InitialConnector().MyIP()
                })

                queue.data.forEach(peer => {
                    peer.client = ioClient.connect('http://' + peer.ip + ':8080');
                    this.PeerQueue.add(peer)
                });
                console.log("FINAL QUEUE:" + Peer.PeerQueue())
            })
            // DO I HAVE ENOUGH
        }
    }
}

module.exports = Receiver;