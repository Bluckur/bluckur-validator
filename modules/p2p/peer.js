// Hier moet server en client zooi in gebeuren (het ontvangen en verzenden dus) eventueel kan hier ook de peer/sessie lijst bijgehouden worden.

'use strict';

const ioServer = require('socket.io');
const ioClient = require('socket.io-client')
const InitialConnector = require('./initalconnector.js')

/**
 * Default message
 */
class Peer {
    /**
     *
     * 
     */

    constructor() {
        //NOTE: We need to handle our own list and cannot use the list provided by socketio. Because we now also use it to check connectivity
        this.port = 8080;
        this.client = ioClient.connect('http://localhost:' + this.port);
        this.sequenceNumberByClient = new Map();
        this.server = ioServer.listen(this.port);

        this.handleServer();
        this.handleClient();

        var initalconnector = new InitialConnector();
        initalconnector.initate( () => {
            console.log("My ip:" + initalconnector.getMyIP() + " - Peer ip: " + initalconnector.getInitialPeerIP());
        });
    }

    handleServer() {
        if (this.server) {
            // event fired every time a new client connects:
            this.server.on('connection', (socket) => {
                console.info(`Client connected [id=${socket.id}]`);
                // initialize this client's sequence number
                this.sequenceNumberByClient.set(socket, 1); // ToDo: Only add if it's not a keep-alive message
                // when socket disconnects, remove it from the list:
                socket.on('disconnect', () => {
                    this.sequenceNumberByClient.delete(socket);
                    console.info(`Client gone [id=${socket.id}]`);
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