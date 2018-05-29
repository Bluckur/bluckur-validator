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
                    new InitialConnector().sleeping = false // This is needed to stop the sleeping of the peer if he was first
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

                    console.log("my peer queue:")
                    console.log(this.PeerQueue)
                })
                socket.on('help_request', (message) => {
                    // JAVA CODE
                    // IPQueue copy = SessionData.getInstance().copyQueue(SessionData.getInstance().getSessionIPQueue());
                    // checkAndConnect(sessionIP);
                    // return new SharedMessage<>(copy, "", MessageType.HELP); //  Return queue

                    let copy = new Queue(4, this.PeerQueue.data);
                    copy.clearSockets();
                    this.checkAndConect(message)
                    socket.emit('help_response', {
                        peers: copy
                    })

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
                console.log("INIT PEER : ", new InitialConnector().InitialPeerIP())
                this.PeerQueue.add({
                    client: ioClient.connect('http://' + new InitialConnector().InitialPeerIP() + ':8080'),
                    ip: new InitialConnector().InitialPeerIP()
                })
                console.log("PeerQueue")
                console.log(this.PeerQueue)
                // DO I HAVE ENOUGH, DO I need to start calling for help

            })

            client.on('help_response', (received) => {
                //JAVA CODE

                // IPQueue helpQueue = new IPQueue(Global.QUEUE_SIZE);
                // Collection<String> helpIps = (Collection<String>) message.getContent();
                // for (String s : helpIps) {
                //     helpQueue.add(s);
                // }
                // WebSocketClientWrapper.getWrapper().addConnections(helpQueue);
                // if (WebSocketClientWrapper.getWrapper().doIHaveEnoughHandlers()) {
                //     WebSocketClientWrapper.getWrapper().stopClientHelpRequester();
                // }


                let queue = new Queue(4, received.peers.data);
                queue.data.forEach(peer => {
                    peer.client = ioClient.connect('http://' + peer.ip + ':8080');
                    this.PeerQueue.add(peer)
                });

                // DO I HAVE ENOUGH

            })

        }
    }


    checkAndConect(ip) {
        let contained
        this.PeerQueue.forEach(element => {
            if (element.ip === ip) {
                contained = true
            }
        });
        if (!contained) {
            this.PeerQueue.add({
                client: ioClient.connect('http://' + ip + ':8080'),
                ip: ip
            })
        }
    }

}

module.exports = Receiver;