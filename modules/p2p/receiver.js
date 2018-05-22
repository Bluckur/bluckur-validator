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
                socket.on('new_connection', (message) => {
                    let copy = new Queue(4, this.PeerQueue.data);
                    copy.clearSockets();
                    if (this.PeerQueue.isFull()) {
                        copy.flip()
                    }
                    this.PeerQueue.add({
                        client: socket,
                        ip: message
                    })

                    socket.emit('init_connections', {
                        peers: copy
                    })

                    console.log("copy:")
                    console.log(copy)
                })
            });
        }
    }

    addClientReceives(client) {
        if (client) {
            client.on('init_connections', (received) => {
                let queue = new Queue(4, received.peers.data);

                queue.data.forEach(peer => {
                    peer.client = ioClient.connect('http://' + peer.ip + ':8080');
                    this.PeerQueue.add(peer)
                });
                this.PeerQueue.add({
                    client: ioClient.connect('http://' + new InitialConnector().InitialPeerIP() + ':8080'),
                    ip: new InitialConnector().InitialPeerIP()
                })
            })
            // DO I HAVE ENOUGH, DO I need to start calling for help
            console.log("PeerQueue")
            console.log(this.PeerQueue)
        }
    }
}

module.exports = Receiver;