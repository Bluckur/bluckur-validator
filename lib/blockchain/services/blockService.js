const models = require('bluckur-models');
const security = require('./../../security/security').getInstance();
const transactionService = require('./transactionService');

let instance = null;

function BlockService(levelDB) {
  this.levelDB = levelDB;
}

const B = BlockService.prototype;

/**
 * [addTransaction description]
 * @param {Block} block       [description]
 * @param {Transaction} transaction [description]
 * @return {Boolean} [description]
 * @return {Error} [description]
 */
B.addTransaction = function addTransaction(block, transaction) {
  // Only add new Transaction if the block is not already finished
  if (!block.blockHeader.blockHash) {
    block.transactions.push(transaction);
    return true;
  }
  return new Error('Transaction can\'t be added to invalid block');
};

/**
 * [calculateBlockHashAsync description]
 * @param  {Block} block [description]
 * @return {Promise}       [description]
 */
B.calculateBlockHashAsync = function calculateBlockHashAsync(block) {
  return new Promise((resolve, reject) => {
    if (this.checkHeaderArguments(block.blockHeader)) {
      security.hashAsync(JSON.stringify(block)).then((hash) => {
        resolve(hash);
      }).catch((err) => {
        reject(err);
      });
    } else {
      reject(new Error('Can\'t calculate hash of invalid block header arguments'));
    }
  });
};

/**
 * [isValidBlockHeader description]
 * @param  {BlockHeader}  blockHeader [description]
 * @return {Boolean}             [description]
 */
B.checkHeaderArguments = function checkHeaderArguments(blockHeader) {
  return blockHeader.validator &&
    blockHeader.parentHash &&
    blockHeader.version &&
    blockHeader.timestamp !== -1 &&
    blockHeader.timestamp <= +new Date();
};

/**
 * [validateBlockAsync description]
 * @param  {[type]} block               [description]
 * @param  {[type]} previousBlockHeader [description]
 * @return {[type]}                     [description]
 */
B.validateBlockAsync = function validateBlockAsync(block, previousBlockHeader) {
  return new Promise((resolve, reject) => {
    if (this.checkHeaderArguments(block.blockHeader)) {
      const { blockHeader } = block;
      this.calculateBlockHashAsync(block).then((hash) => {
        if (blockHeader.blockHash === hash &&
            blockHeader.parentHash === previousBlockHeader.blockHash &&
            blockHeader.timestamp > previousBlockHeader.timestamp) {
          resolve(true);
        } else {
          reject(new Error('Can\'t validate block header with invalid block hash'));
        }
      }).catch((err) => {
        reject(err);
      });
    } else {
      reject(new Error('Can\'t validate block header with invalid arguments'));
    }
  });
};

B.createBlockHeader = function createBlockHeader(publicKey, previousBlock) {
  return models.createBlockHeaderInstance({
    version: '1',
    blockNumber: previousBlock.blockHeader.blockNumber,
    validator: this.publicKey,
    parentHash: previousBlock.blockHeader.parentHash,
  });
};

module.exports = {
  getInstance() {
    if (!instance) {
      instance = new BlockService();
    }
    return instance;
  },
};
