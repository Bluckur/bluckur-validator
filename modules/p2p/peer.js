// Hier moet server en client zooi in gebeuren (het ontvangen en verzenden dus) eventueel kan hier ook de peer/sessie lijst bijgehouden worden.

'use strict';

const ioServer = require('socket.io');
const ioClient = require('socket.io-client')
const InitialConnector = require('./initialconnector.js')
const Queue = require('./Models/queue.js')

/**
 * Default message
 */
const PQueue = new Queue(4); // Defines a queue for peers to save locally. 4 is maximum size.

class Peer {
    /**
     *
     * 
     */
    constructor() {
        //NOTE: We need to handle our own list and cannot use the list provided by socketio. Because we now also use it to check connectivity
        this.port = 8080;
        this.client = ioClient.connect('http://localhost:' + this.port);
        this.server = ioServer.listen(this.port);

        // this.handleServer();
        // this.handleClient();

        var initalconnector = new InitialConnector();
        initalconnector.initiate().then((result) => {
            console.log(result);
        }, (err) =>{
            console.log(err);
        })
    }

    static get PeerQueue(){
        return PQueue;
    }

    handleServer() {
        if (this.server) {
            // event fired every time a new client connects:
            this.server.on('connection', (socket) => {

                socket.on('disconnect', () => {
                    
                });
                socket.on('message_isAlive', (message) => {
                    socket.emit("message_isAlive", "Yes, I am online")
                })
            });

            // sends each client its current sequence number
            // setInterval(() => {
            //     for (const [client, sequenceNumber] of this.sequenceNumberByClient.entries()) {
            //         client.emit('seq-num', sequenceNumber);
            //         this.sequenceNumberByClient.set(client, sequenceNumber + 1);
            //     }
            // }, 1000);
        }
    }

    handleClient() {
        if (this.client) {
            this.client.on('seq-num', (msg) => console.info(msg));
        }
    }
}


new Peer();

module.exports = Peer;