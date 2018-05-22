// Hier moet server en client zooi in gebeuren (het ontvangen en verzenden dus) eventueel kan hier ook de peer/sessie lijst bijgehouden worden.

'use strict';

const ioServer = require('socket.io');
const ioClient = require('socket.io-client')
const InitialConnector = require('./initialconnector.js')
const Queue = require('./Models/queue.js')
const Sender = require('./sender');
const Receiver = require('./receiver');

/**
 * Default message
 */
// const PQueue = new Queue(4); // Defines a queue for peers to save locally. 4 is maximum size.

let instance;

module.exports = class Peer {
    /**
     *
     * 
     */
    constructor() {
        //NOTE: We need to handle our own list and cannot use the list provided by socketio. Because we now also use it to check connectivity
        if (!instance) {
            instance = this;
            this.PeerQueue = new Queue(4);
            this.sleeping = false;
        }

        return instance;
    }

    initate() {
        this.port = 8080;
        // this.client = ioClient.connect('http://localhost:' + this.port);
        this.server = ioServer.listen(this.port);
        this.receiver = new Receiver(this.server, this.PeerQueue);
        this.sender = new Sender(this.server, this.receiver, this.PeerQueue);

        var initalconnector = new InitialConnector(2000); //Check every 2 secs for other peer when you are first peer.
        initalconnector.initiate().then((result) => {
            if (result.peerIp === "first") {
                this.waitTillConnection()
            }
            this.sender.sendNewPeerRequest(result.myIp, result.peerIp);
        }, (err) => {
            // console.log(err);
        })
    }

    waitTillConnection() {
        if (this.sleeping)
            setTimeout(() => {
                this.waitTillConnection()
            }, 2000)
    }
}