// Hier moet server en client zooi in gebeuren (het ontvangen en verzenden dus) eventueel kan hier ook de peer/sessie lijst bijgehouden worden.
const InitialConnector = require('./initialconnector');
const uuid = require('uuid/v1');
/**
 * Default message
 */
let thisConnector;
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

  setReceiverDisconnectImpl(receiver) {
    receiver.addBroadcastReceiveImplementation('disconnection', (message) => {
      this.PeerQueue.removeIPRecord(message.ip);
      this.checkQueue(message.ip);
    });
  }

  addServerDisconnectionHandler(socket) {
    if (!socket.customInitiated) {
      socket.on('disconnect', () => {
        if (this.server.ourSockets.includes(socket)) {
          const index = this.server.ourSockets.indexOf(socket);
          if (index > -1) {
            this.server.ourSockets.splice(index, 1);
          }
        }

        const disconnect_message = {
          type: 'disconnection',
          id: uuid(),
          ip: socket.handshake.address.substring(socket.handshake.address.lastIndexOf(':') + 1),
        };
        this.sender.sendMessageToAll(disconnect_message);

        this.PeerQueue.delete(socket);
        this.checkQueue(socket.handshake.address.substring(socket.handshake.address.lastIndexOf(':') + 1));
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
      this.server.ourSockets.forEach((element) => {
        element.disconnect();
      });
      this.server.ourSockets = [];
      this.peer.startInitialConnector();
    }
  }

  handleTooLittleConnections(ip) {
    if (ip) {
      this.sender.disconnectedIP.unshift(ip);
    }
    this.sender.sendHelpRequest();
  }
};
