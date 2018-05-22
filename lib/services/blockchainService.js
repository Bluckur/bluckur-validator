const Models = require('bluckur-models');
const blockService = require('./blockService').createInstance();

function BlockchainService(publicKey) {
  this.BLOCK_REWARD = 25;
  this.publicKey = publicKey;
}

const B = BlockchainService.prototype;

/**
 * [validateChainAsync description]
 * @return {Promise} [description]
 */
B.validateChainAsync = function validateChainAsync(blocks) {
  return new Promise((resolve, reject) => {
    const previousBlock = blocks[0];
    const promises = [];
    for (let i = 1; i < previousBlock.length; i += 1) {
      promises.push(blockService.validateBlockAsync(this.block[i], this.blocks[i - 1].blockHeader));
    }
    Promise.all(promises).then(() => {
      resolve(true);
    }).catch((err) => {
      reject(err);
    });
  });
};


/**
 * [createGenesisBlock description]
 * @return {Promise} [description]
 */
B.buildGenesisBlock = function buildGenesisBlock() {
  return new Promise((resolve, reject) => {
    const genisisBlock = Models.createBlockInstance({
      blockHeader: Models.createBlockHeaderInstance({
        blockNumber: 0,
        validator: '6422896f230161b322ad4faa0a15712cb7d95f7a1e69487ae03a388a75d3a27b',
        timestamp: +new Date(),
        blockReward: this.BLOCK_REWARD,
        parentHash: '0',
      }),
    });
    genisisBlock.transactions.push(Models.createTransactionInstance({
      recipient: '6422896f230161b322ad4faa0a15712cb7d95f7a1e69487ae03a388a75d3a27b',
      amount: 69,
      timestamp: +new Date(),
      type: 'coin',
    }));
    genisisBlock.transactions.push(Models.createTransactionInstance({
      recipient: '6422896f230161b322ad4faa0a15712cb7d95f7a1e69487ae03a388a75d3a27b',
      amount: 1,
      timestamp: +new Date(),
      type: 'stake',
    }));
    blockService.calculateBlockHashAsync(genisisBlock).then((hash) => {
      genisisBlock.blockHeader.blockHash = hash;
      genisisBlock.transactions.forEach((transaction) => {
        console.log(transaction);
        transaction.blockHash = hash; // eslint-disable-line no-param-reassign
      });
      resolve(genisisBlock);
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
