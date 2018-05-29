//Handle all messages to send, regardless of them being form the 'server' or 'client'
const InitialConnector = require('./initialconnector.js')
const ioClient = require('socket.io-client')
const Peer = require('./peer')

class Sender {
    constructor(ioServer, receiver, PeerQueue) {
        this.server = ioServer;
        this.receiver = receiver;
        this.PeerQueue = PeerQueue;
        this.helpRequesterStarted = false;

        //Example server send:
        //socket will come from the Queue
        //socket.emit("message_isAlive", "Yes, I am online")

        //Example client send:
        //client.emit('seq-num', sequenceNumber);        thisConnector = this;


        //Only add connections to queue which are made by sender...

        //ToDo: NSSocket??
    }

    sendNewPeerRequest(myIp, peerIp) {
        console.log(myIp + " - " + peerIp)
        var client = ioClient.connect('http://' + peerIp + ':8080'); //ToDo: add client receive events and change ip + port And maybe make generic newClient method
        this.receiver.addClientReceives(client);
        client.emit("new_connection", myIp)
    }

    sendHelpRequest(disconnected) {
        var self = this;
        if (self.PeerQueue.size() < 3) {
            if (!this.helpRequesterStarted) {
                this.helpRequesterStarted = true;
                setTimeout(() => {
                    toSend = {
                        disconnected: disconnected,
                        ip: new InitialConnector().MyIP()
                    }

                    currentClient = self.PeerQueue.getNext();

                    currentClient.emit("help_request", toSend);
                    self.sendHelpRequest(disconnected)

                }, 5000)
            }
        } else {
            self.helpRequesterStarted = false;
        }
    }

    sendMessageToAll(message) {
        this.PeerQueue.data.forEach(element => {
            element.client.emit('message', message);
        });
    }
}

module.exports = Sender;