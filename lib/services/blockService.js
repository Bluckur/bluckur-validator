const models = require('bluckur-models');
const security = require('./../security/security').getInstance();
const transactionService = require('./transactionService').createInstance();

function BlockService(levelDB) {
  this.levelDB = levelDB;
}

const B = BlockService.prototype;

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

module.exports = {
  createInstance() {
    return new BlockService();
  },
};
