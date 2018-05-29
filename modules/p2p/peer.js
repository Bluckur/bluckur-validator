// Hier moet server en client zooi in gebeuren (het ontvangen en verzenden dus) eventueel kan hier ook de peer/sessie lijst bijgehouden worden.

'use strict';

const ioServer = require('socket.io');
const ioClient = require('socket.io-client')
const InitialConnector = require('./initialconnector.js')
const Queue = require('./Models/queue.js')
const Sender = require('./sender');
const Receiver = require('./receiver');
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
            new InitialConnector().sleeping = false;
        }

        return instance;
    }

    initate() {
        this.port = 8080;
        this.client = ioClient.connect('http://localhost:' + this.port);
        this.server = ioServer.listen(this.port);
        this.receiver = new Receiver(this.server, this.PeerQueue);
        this.sender = new Sender(this.server, this.receiver, this.PeerQueue);
        this.receiver.setSender(this.sender);

        this.addMessageHandler("type", (message) => {
            console.log(message);
        })

        var initalconnector = new InitialConnector(2000); //Check every 2 secs for other peer when you are first peer.
        initalconnector.initiate().then((result) => {
            console.log(result)
            if (result.peerIp === "first") {
                new InitialConnector().sleeping = true
                this.waitTillConnection()
            } else if (result.peerIp !== "first") {
                this.sender.sendNewPeerRequest(result.myIp, result.peerIp);
            }
        }, (err) => {
            // console.log(err);
        })

        this.testSend();
    }

    // testSend(){
    //     setTimeout(() => {
    //         this.sendMessage("type", {
    //             content: "hihi"
    //         })
    //         this.testSend();
    //     }, 2000); 
    // }

    waitTillConnection() {
        if (new InitialConnector().sleeping) {
            setTimeout(() => {
                console.log("Waiting for first connection...")
                this.waitTillConnection()
            }, 2000)
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

    sendMessage(messageType, message) {
        message.type = messageType;
        message.id = uuid();
        this.sender.sendMessageToAll(message);
    }

    addMessageHandler(messageType, implementation) {
        this.receiver.addReceiveImplementation(messageType, implementation);
    }
}