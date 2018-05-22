const models = require('bluckur-models');
const blockService = require('./blockService').getInstance();

let instance = null;
// TODO: Transaction validation, Blockchain validation
function BlockchainService(publicKey, levelDB) {
  this.pendingBlock = this.createPendingBlockAsync();
  this.BLOCK_REWARD = 25;
  this.publicKey = publicKey;
  this.levelDB = levelDB;
}

const B = BlockchainService.prototype;

B.validateChainAsync = function validateChainAsync() {
  return new Promise((resolve, reject) => {
    this.lazyLoadBlockChainAsync().then((blocks) => {
      const blocks = []; // TODO: Get full blockchain from LevelDB
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
    this.lazyLoadBlockChainAsync().then((blocks) => {
      const lastBlock = blocks[blocks.length - 1];
      return models.createBlockInstance({
        blockHeader: blockService.createBlockHeader(this.publicKey, lastBlock),
      });
    }).catch((err) => {
      reject(err);
    });
  });
};

B.lazyLoadBlockChainAsync = function lazyLoadBlockChainAsync() {
  return new Promise((resolve, reject) => {
    if (!this.blocks) {
      // TODO: load from levelDB
      reject(new Error('404'));
    } else {
      resolve(this.blocks);
    }
  });
};


B.lazyLoadGlobalStateAsync = function lazyLoadGlobalStateAsync() {
  return new Promise((resolve, reject) => {
    if (!this.globalState) {
      // TODO: load from levelDB
      reject(new Error('404'));
    } else {
      resolve(this.globalState);
    }
  });
};

module.exports = {
  getInstance() {
    if (!instance) {
      instance = new BlockchainService();
    }
    return instance;
  },
};
