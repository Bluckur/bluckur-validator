const Message = require('../modules/message.js');

/**
 * [Sender description]
 * @param       {Node} node [description]
 * @constructor
 */
function Sender(node) {
  this.node = node;
}

/**
 * [description]
 */
Sender.prototype.requestPeers = async function () {
  const message = new Message(this.node, 'request_peers', {
    recipientId: this.node.id,
  });
  this.node.broadcast.write(JSON.stringify(message));
};

/**
 *
 * @param {[]} peers
 * @param {string} recipientId
 */
Sender.prototype.sendPeers = async function (peers, recipientId) {
  const message = new Message(this.node, 'reply_peers', {
    peers,
  });
  message.addRecipient(recipientId);
  this.node.broadcast.write(JSON.stringify(message));
};

/**
 *
 * @param {json} transaction
 */
Sender.prototype.broadcastTransaction = async function (transaction) {
  // For testing purposes
  const message = new Message(this.node, 'new_transaction', {
    transactionData: transaction,
  });
  this.node.broadcast.write(JSON.stringify(message));
};

Sender.prototype.broadcastMessage = async function (messageparam) {
  // For testing purposes
  const message = new Message(this.node, 'message', {
    message: messageparam,
  });
  this.node.broadcast.write(JSON.stringify(message));
};

module.exports = Sender;
