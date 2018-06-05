// Hier moet server en client zooi in gebeuren (het ontvangen en verzenden dus) eventueel kan hier ook de peer/sessie lijst bijgehouden worden.
const InitialConnector = require('./initialconnector');
/**
 * Default message
 */
var thisConnector;
let instance;

module.exports = class Disconnector {
    /**
     *
     * 
     */

    constructor(sender, server, PeerQueue, peer) {
        this.sender = sender;
        this.server = server;
        this.PeerQueue = PeerQueue;
        this.peer = peer;
    }

    addServerDisconnectionHandler(socket) {
        if (!socket.customInitiated) {
            socket.on('disconnect', () => {
                console.log(socket.handshake.address.substring(socket.handshake.address.lastIndexOf(":") + 1) + " HAS LEFT OUR SERVER"); //ToDo: do not remove socket.. Remove client
                if (this.server.ourSockets.includes(socket)) {
                    var index = this.server.ourSockets.indexOf(socket);
                    if (index > -1) {
                        console.log(socket.handshake.address.substring(socket.handshake.address.lastIndexOf(":") + 1) + " has been removed from ourSockets list")
                        this.server.ourSockets.splice(index, 1);
                    }
                }

                this.PeerQueue.delete(socket);
                this.checkQueue(socket.handshake.address.substring(socket.handshake.address.lastIndexOf(":") + 1));
            });
            socket.customInitiated = true;
        }
    }

    checkQueue(ip) {
        if (this.PeerQueue.size() === 0) {
            this.handleZeroQueueSize();
        } else if (this.PeerQueue.size() < 3) {
            this.handleTooLittleConnections(ip);
        }
    }

    handleZeroQueueSize() {
        if (new InitialConnector().finishedOnce && !(new InitialConnector().sleeping)) {
            this.server.ourSockets.forEach(element => {
                element.disconnect();
            });
            this.server.ourSockets = [];
            this.peer.startInitialConnector();
        }
    }

    handleTooLittleConnections(ip) {
        this.sender.sendHelpRequest(ip);
    }
}