const BlockService = require('./blockService');

function BlockchainService(publicKey) {
  this.BLOCK_REWARD = 25;
  this.publicKey = publicKey;
  this.blockService = BlockService.createInstance();
}

const B = BlockchainService.prototype;

/**
 * [validateChainAsync description]
 * @return {Promise} [description]
 */
B.validateChainAsync = function validateChainAsync(blocks) {
  return new Promise((resolve, reject) => {
    const promises = [];
    for (let i = 1; i < blocks.length; i += 1) {
      const currentBlock = this.block[i];
      const previousBlockHeader = this.blocks[i - 1].blockHeader;
      promises.push(this.blockService.validateBlockAsync(currentBlock, previousBlockHeader));
    }
    // Wait for all blocks to be validated
    Promise.all(promises).then(() => {
      resolve(true);
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
