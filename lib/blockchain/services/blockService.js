const models = require('bluckur-models');
const Security = require('./../../security/security');

let instance = null;

function BlockService() { }

const B = BlockService.prototype;

B.validateBlockAsync = function validateBlockAsync(block) {
  return new Promise((resolve, reject) => {
    // TODO: get chain from levelDB and validate block
  });
};

B.addTransaction = function addTransaction(block, transaction) {
  // Only add new Transaction if the block is not already finished
  if (!block.blockHeader.blockHash) {
    block.transactions.push(transaction);
  }
};

/**
 * [calculateBlockHashAsync description]
 * @param  {Block} block [description]
 * @return {Promise}       [description]
 */
B.calculateBlockHashAsync = function calculateBlockHashAsync(block) {
  return new Promise((resolve, reject) => {
    if (this.isValidBlockHeader(block.blockHeader)) {
      Security.hash(JSON.stringify(block)).then((hash) => {
        resolve(hash);
      }).catch((err) => {
        reject(err);
      });
    } else {
      reject(new Error('Can\'t calculate hash of invalid block'));
    }
  });
};

/**
 * [isValidBlockHeader description]
 * @param  {BlockHeader}  blockHeader [description]
 * @return {Boolean}             [description]
 */
B.isValidBlockHeader = function isValidBlockHeader(blockHeader) {
  return blockHeader.validator &&
    blockHeader.parentHash &&
    blockHeader.version &&
    blockHeader.timestamp !== -1 &&
    blockHeader.timestamp <= +new Date();
};

module.exports = {
  getInstance() {
    if (!instance) {
      instance = new BlockService();
    }
    return instance;
  },
};
