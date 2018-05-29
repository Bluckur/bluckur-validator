// Hier moet server en client zooi in gebeuren (het ontvangen en verzenden dus) eventueel kan hier ook de peer/sessie lijst bijgehouden worden.

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

    handleServerDisconnection(socket){
        socket.on('disconnect', () => {
                    
            this.PeerQueue.delete(socket);
            if (this.PeerQueue.size() < 3)
            {
                //shout
                this.handleTooLittleConnections(socket);
            }
            if (this.PeerQueue.size() === 0)
            {
               this.handleZeroQueueSize();
            } 
        });
    }

    handleZeroQueueSize(){
        this.server.clients().forEach(element => {
            element.destroy();
        });
        this.server.close();
        this.peer.initiate();
    }

    handleTooLittleConnections(socket){
        var address = socket.handshake.address;
        console.log('Disconnection from ' + address.address + ':' + address.port);
        this.sender.sendHelpRequest(address.address);
    }
}