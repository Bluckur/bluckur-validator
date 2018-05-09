const BlockChain = require('./../models/blockChain');

let instance = null;

/**
 * [BlockchainService description]
 * @constructor
 */
function BlockchainService() {
  this.blockchain = new BlockChain();
}

const B = BlockchainService.prototype;

module.exports = function getInstance() {
  if (instance === null) {
    instance = new BlockchainService();
  }
  return instance;
};
