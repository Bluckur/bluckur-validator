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
                    let copy = new Queue(4, this.PeerQueue.data);
                    copy.clearSockets();
                    if (this.PeerQueue.isFull()) {
                        copy.flip()
                        PeerQueue.remove()
                        this.PeerQueue.add({
                            client: socket,
                            ip: message
                        })

                    } else {
                        this.PeerQueue.add({
                            client: socket,
                            ip: message
                        })
                    }
                    console.log(copy)
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
                let queue = new Queue(4, received.peers.data);
                queue.add({
                    ip: new InitialConnector().InitialPeerIP()
                })
                queue.data.forEach(peer => {
                    peer.client = ioClient.connect('http://' + peer.ip + ':8080');
                    this.PeerQueue.add(peer)
                });
                console.log(this.PeerQueue);
            })
            // DO I HAVE ENOUGH
        }
    }
}

module.exports = Receiver;