const Block = require('./../models/block');

let instance = null;

/**
 * [BlockchainService description]
 * @constructor
 */
function BlockchainService(database) {
  this.database = database;
  this.blocks = [];
  this.pendingTransactions = [];
  this.potentialBlocks = [];
  this.lastConsumedBlockHash = null;
  this.globalState = null;
}

const B = BlockchainService.prototype;

B.addBlock = function addBlock() {
  // TODO:
  // this.database.saveBlock();
  this.blocks = [this.blocks, ...new Block()];
};

B.getBalanceOf = function getBalanceOf(publicKey) {
  if (this.globalState === null) {
    // TODO:
  }
  return this.globalState[publicKey];
};

module.exports = function getInstance(database) {
  if (instance === null) {
    instance = new BlockchainService(database);
  }
  return instance;
};
