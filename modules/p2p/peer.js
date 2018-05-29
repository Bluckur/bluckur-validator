// Hier moet server en client zooi in gebeuren (het ontvangen en verzenden dus) eventueel kan hier ook de peer/sessie lijst bijgehouden worden.

'use strict';

const ioServer = require('socket.io');
const ioClient = require('socket.io-client')
const InitialConnector = require('./initialconnector.js')
const Queue = require('./Models/queue.js')
const Sender = require('./sender');
const Receiver = require('./receiver');
const Disconnector = require('./disconnector')
const uuid = require('uuid/v1');

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
            this.port = 8080;
            new InitialConnector().sleeping = false;
        }

        return instance;
    }

    initiate() {
        this.server = ioServer.listen(this.port);
        this.sender = new Sender(this.server, this.receiver, this.PeerQueue);
        this.disconnector = new Disconnector(this.sender, this.server, this.PeerQueue, this);
        this.receiver = new Receiver(this.server, this.PeerQueue, this.disconnector);
        this.receiver.setSender(this.sender);
        this.sender.setReceiver(this.receiver);

        this.addMessageHandler("type", (message) => {
            console.log(message);
            console.log(this.PeerQueue.clearSockets())
        })

        this.startInitialConnector();
        this.testSend();
    }

    startInitialConnector(){
        var initalconnector = new InitialConnector(2000); //Check every 2 secs for other peer when you are first peer.
        initalconnector.initiate().then((result) => {
            if (result.peerIp === "first") {
                new InitialConnector().sleeping = true
                this.waitTillConnection()
            } else if (result.peerIp !== "first") {
                this.sender.sendNewPeerRequest(result.myIp, result.peerIp);
            }
        }, (err) => {
            // console.log(err);
        })
    }

    testSend() {
        setTimeout(() => {
            this.sendMessage("type", {
                content: "hihi"
            })
            this.testSend();
        }, 5000);
    }

    waitTillConnection() {
        if (new InitialConnector().sleeping) {
            setTimeout(() => {
                console.log("Waiting for first connection...")
                this.waitTillConnection()
            }, 2000)
        }
    }

    sendMessage(messageType, message) {
        message.type = messageType;
        message.id = uuid();
        this.sender.sendMessageToAll(message);
    }

    addMessageHandler(messageType, implementation) {
        this.receiver.addReceiveImplementation(messageType, implementation);
    }
}