//Handle all messages to send, regardless of them being form the 'server' or 'client'
const InitialConnector = require('./initialconnector.js')
const ioClient = require('socket.io-client')

class Sender {
    constructor(ioServer, receiver){
        this.server = ioServer;
        this.receiver = receiver;

        //Example server send:
        //socket will come from the Queue
        //socket.emit("message_isAlive", "Yes, I am online")

        //Example client send:
        //client.emit('seq-num', sequenceNumber);

        //Only add connections to queue which are made by sender...

        //ToDo: NSSocket??
    }

    sendNewPeerRequest(myIp, peerIp){
        console.log(myIp + " - " + peerIp)
        var client = ioClient.connect('http://localhost:8080'); //ToDo: add client receive events and change ip + port And maybe make generic newClient method
        this.receiver.addClientReceives(client);
    }
}

module.exports = Sender;