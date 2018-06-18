// Hier moet server en client zooi in gebeuren (het ontvangen en verzenden dus) eventueel kan hier ook de peer/sessie lijst bijgehouden worden.

const ioServer = require('socket.io');
const ioClient = require('socket.io-client');
const InitialConnector = require('./initialconnector.js');
const Queue = require('./Models/queue.js');
const Sender = require('./sender');
const Receiver = require('./receiver');
const Disconnector = require('./disconnector');
const uuid = require('uuid/v1');
const { EventEmitter } = require('events');

const eventEmitter = new EventEmitter();

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
        // NOTE: We need to handle our own list and cannot use the list provided by socketio. Because we now also use it to check connectivity
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
        this.PeerQueue.setReceiver(this.receiver);
        this.disconnector.setReceiverDisconnectImpl(this.receiver);

        this.addbroadcastMessageHandler('testMessage', (message) => {
            console.log(message.content);
        });

        this.startInitialConnector();
        // this.testSend();
    }

    onInitiated(callback) {
        this.PeerQueue.eventEmitter.on('peer-added', () => {
            if (this.PeerQueue.size() > 0) {
                callback();
            }
        });
    }

    startInitialConnector() {
        const initalconnector = new InitialConnector(2000); // Check every 2 secs for other peer when you are first peer.
        initalconnector.initiate().then((result) => {
            if (result.peerIp === 'first') {
                new InitialConnector().sleeping = true;
                this.waitTillConnection();
            } else if (result.peerIp !== 'first') {
                this.sender.sendNewPeerRequest(result.myIp, result.peerIp);
            }
        }, (err) => {
            // console.log(err);
        });
    }

    testSend() {
        setTimeout(() => {
            this.broadcastMessage('testMessage', {
                content: 'This is a test message. Everyone will receive this.',
            });
            this.testSend();
        }, 5000);
    }

    waitTillConnection() {
        if (new InitialConnector().sleeping) {
            setTimeout(() => {
                console.log('Waiting for first connection...');
                this.waitTillConnection();
            }, 2000);
        }
    }

    sendSingleMessage(messageType, data) {
        this.sender.sendSingleMessage({
            data,
            type: messageType,
            id: uuid(),
        });
    }

    /**
     *
     * @param {String} messageType The type to handle
     * @param {Function} handleRequest Handle request. This needs to return a response which can be handled in the response. If the response is not returned, undefined exceptions may occur
     * @param {*} handleResponse Handle the repsonse.
     */
    addSingleMessageHandler(messageType, handleRequest, handleResponse) {
        this.receiver.addSingleMessageReceiveImplementation(messageType, handleRequest, handleResponse);
    }

    broadcastMessage(messageType, data) {
        this.sender.sendMessageToAll({
            data,
            type: messageType,
            id: uuid(),
        });
    }

    addbroadcastMessageHandler(messageType, implementation) {
        this.receiver.addBroadcastReceiveImplementation(messageType, implementation);
    }
};