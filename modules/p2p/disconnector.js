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

    handleServerDisconnection(socket) {
        socket.on('disconnect', () => {
            if (this.server.ourSockets.includes(socket)) {
                var index = this.server.ourSockets.indexOf(socket);
                if (index > -1) {
                    this.server.ourSockets.splice(index, 1);
                }
            }

            this.PeerQueue.delete(socket);
            if (this.PeerQueue.size() === 0) {
                this.handleZeroQueueSize();
            } else if (this.PeerQueue.size() < 3) {
                this.handleTooLittleConnections(socket);
            }

        });
    }

    handleZeroQueueSize() {
        if (new InitialConnector().finishedOnce) {
            this.server.ourSockets.forEach(element => {
                element.disconnect();
            });
            this.server.close();
            this.peer.initiate();
        }
    }

    handleTooLittleConnections(socket) {
        var address = socket.handshake.address;
        console.log('Disconnection from ' + address.address + ':' + address.port);
        this.sender.sendHelpRequest(address.address);
    }
}