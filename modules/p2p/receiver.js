//Handle all messages received, regardless of them being form the 'server' or 'client'
const Queue = require('./Models/queue')
const InitialConnector = require('./initialconnector')
const ioClient = require('socket.io-client')
const Peer = require('./peer')
const uuid = require('uuid/v1');

class Receiver {
    constructor(ioServer, PeerQueue, disconnector) {
        this.server = ioServer;
        this.PeerQueue = PeerQueue;
        this.receivedMessages = [];
        this.handleServerReceives();
        this.receiveHandlers = new Map();
        this.receivedIamBack = [];
        this.disconnector = disconnector;

        this.addReceiveImplementation('i_am_back', () => {
            let value = null;
            for (var i = 0; i < this.sender.disconnectedIP.length; i++) {
                if (this.sender.disconnectedIP[i].ip === ip) {
                    value = i;
                    break;
                }
            }
            if (value !== null) {
                this.sender.disconnectedIP.splice(value, 1);
                console.log(this.sender.disconnectedIP)
            }
        });
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
                let socketIP = socket.handshake.address.substring(socket.handshake.address.lastIndexOf(":") + 1);

                socket.on('new_connection', (message) => {
                    if (this.server.ourSockets === undefined) {
                        this.server.ourSockets = [];
                    }

                    this.server.ourSockets.push(socket);
                    this.disconnector.addServerDisconnectionHandler(socket);

                    new InitialConnector().sleeping = false // This is needed to stop the sleeping of the peer if he was first
                    let copy = new Queue(4, this.PeerQueue.clearSockets());
                    if (this.PeerQueue.isFull()) {
                        copy.flip()
                    }

                    this.PeerQueue.add({
                        ip: message
                    })

                    let i_am_back_message = {
                        type: 'i_am_back',
                        id = uuid()
                    };
                    this.sender.sendMessageToAll(i_am_back_message);

                    socket.emit('init_connections', {
                        peers: copy
                    })

                })
                socket.on('help_request', (message) => {
                    if (this.server.ourSockets === undefined) {
                        this.server.ourSockets = [];
                    }

                    this.server.ourSockets.push(socket);
                    this.disconnector.addServerDisconnectionHandler(socket);
                    let copy = new Queue(4, this.PeerQueue.clearSockets());

                    this.PeerQueue.add({
                        ip: message.ip
                    })

                    socket.emit('help_response', {
                        peers: copy,
                        disconnectedIP: message.disconnectedIP
                    })

                    this.disconnector.checkQueue();
                })

                socket.on('message', (message) => {
                    if (this.server.ourSockets === undefined) {
                        this.server.ourSockets = [];
                    }

                    this.server.ourSockets.push(socket);
                    this.disconnector.addServerDisconnectionHandler(socket);
                    if (this.receivedMessages.filter(m => message.id === m.id).length === 0) {
                        this.receivedMessages.push(message);
                        this.sender.sendMessageToAll(message);

                        var implementation = this.receiveHandlers.get(message.type);
                        if (implementation !== undefined && typeof implementation === 'function') {
                            implementation(message);
                        } else {
                            console.log("No implementation found for message with type: " + message.type);
                        }

                        this.disconnector.checkQueue();
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
                    this.PeerQueue.add(peer)
                });

                this.PeerQueue.add({
                    client: ioClient.connect('http://' + new InitialConnector().InitialPeerIP() + ':8080'),
                    ip: new InitialConnector().InitialPeerIP()
                })

                this.disconnector.checkQueue();
            })

            client.on('help_response', (received) => {
                let queue = received.peers;
                queue = new Queue(4, queue.data);

                if (received.disconnectedIP) {
                    received.disconnectedIP.forEach(element => {
                        if (received.disconnectedIP.indexOf(element)) {
                            queue.removeIPRecord(element)
                        }
                    });
                }
                queue.data.forEach(peer => {
                    this.PeerQueue.add(peer)
                });
            })

        }
    }
}

module.exports = Receiver;