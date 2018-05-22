const models = require('bluckur-models');
const blockService = require('./blockService').createInstance();

let instance = null;
// TODO: Transaction validation
function BlockchainService(publicKey, levelDB) {
  this.pendingBlock = this.createPendingBlockAsync();
  this.BLOCK_REWARD = 25;
  this.publicKey = publicKey;
  this.levelDB = levelDB;
}

const B = BlockchainService.prototype;

/**
 * [validateChainAsync description]
 * @return {Promise} [description]
 */
B.validateChainAsync = function validateChainAsync() {
  return new Promise((resolve, reject) => {
    this.lazyLoadBlockChainAsync().then((blocks) => { // TODO: Get full blockchain from LevelDB
      const blocks = [];
      const previousBlock = blocks[0];
      const promises = [];
      for (let i = 1; i < previousBlock.length; i += 1) {
        promises.push(blockService.validateBlockAsync(block, this.blocks[i - 1]));
      }
      return Promise.all(promises);
    }).then(() => {
      resolve(true);
    }).catch((err) => {
      reject(err);
    });
  });
};

B.addBlock = function addBlock(block) {
  this.pendingBlock = this.createPendingBlockAsync();
};

B.createPendingBlockAsync = function createPendingBlockAsync() {
  return new Promise((resolve, reject) => {
    this.lazyLoadBlockChainAsync().then((blocks) => { // TODO: Get full blockchain from LevelDB
      const lastBlock = blocks[blocks.length - 1];
      return models.createBlockInstance({
        blockHeader: blockService.createBlockHeader(this.publicKey, lastBlock),
      });
    }).catch((err) => {
      reject(err);
    });
  });
};

module.exports = {
  createInstance() {
    return new BlockchainService();
  },
};
