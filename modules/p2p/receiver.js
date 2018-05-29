//Handle all messages received, regardless of them being form the 'server' or 'client'
const Queue = require('./Models/queue')
const InitialConnector = require('./initialconnector')
const ioClient = require('socket.io-client')
const Peer = require('./peer')

class Receiver {
    constructor(ioServer, PeerQueue, disconnector) {
        this.server = ioServer;
        this.PeerQueue = PeerQueue;
        this.receivedMessages = [];
        this.handleServerReceives();
        this.receiveHandlers = new Map();
        this.disconnector = disconnector;
    }

    setSender(sender) {
        this.sender = sender;
    }

    addReceiveImplementation(messageType, implementation) {
        this.receiveHandlers.set(messageType, implementation);
    }

    handleServerReceives() {
        if (this.server) {
            // event fired every time a new client connects:
            this.server.on('connection', (socket) => {

               

                socket.on('message_isAlive', (message) => {
                    socket.emit("message_isAlive", "Yes, I am online")
                })
                socket.on('new_connection', (message) => {
                    if (this.server.ourSockets === undefined) {
                        this.server.ourSockets = [];
                    }
    
                    this.server.ourSockets.push(socket);

                    this.disconnector.handleServerDisconnection(socket);
                    
                    new InitialConnector().sleeping = false // This is needed to stop the sleeping of the peer if he was first
                    let copy = new Queue(4, this.PeerQueue.clearSockets());
                    if (this.PeerQueue.isFull()) {
                        copy.flip()
                    }

                    this.PeerQueue.add({
                        client: ioClient.connect('http://' + message + ':8080'),
                        ip: message
                    })

                    socket.emit('init_connections', {
                        peers: copy
                    })

                })
                socket.on('help_request', (message) => {
                    let copy = new Queue(4, this.PeerQueue.clearSockets());

                    if (!this.PeerQueue.contains(message.ip)) {
                        this.PeerQueue.add({
                            client: ioClient.connect('http://' + message.ip + ':8080'),
                            ip: message.ip
                        })
                    }

                    socket.emit('help_response', {
                        peers: copy
                    })
                })

                socket.on('message', (message) => {
                    if (this.receivedMessages.filter(m => message.id === m.id).length === 0) {
                        this.receivedMessages.push(message);
                        this.sender.sendMessageToAll(message);

                        var implementation = this.receiveHandlers.get(message.type);
                        if (implementation !== undefined && typeof implementation === 'function') {
                            implementation(message);
                        } else {
                            console.log("No implementation found for message with type: " + message.type);
                        }
                    }

                })
            });
        }
    }

    addClientReceives(client) {
        if (client) {
            client.on('init_connections', (received) => {
                let queue = received.peers;

                queue.data.forEach(peer => {
                    peer.client = ioClient.connect('http://' + peer.ip + ':8080');
                    this.PeerQueue.add(peer)
                });

                this.PeerQueue.add({
                    client: ioClient.connect('http://' + new InitialConnector().InitialPeerIP() + ':8080'),
                    ip: new InitialConnector().InitialPeerIP()
                })

                this.sender.sendHelpRequest();
            })

            client.on('help_response', (received) => {
                let queue = received.peers;
                queue.data.forEach(peer => {
                    peer.client = ioClient.connect('http://' + peer.ip + ':8080');
                    this.PeerQueue.add(peer)
                });
            })

        }
    }
}

module.exports = Receiver;