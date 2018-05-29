const Models = require('bluckur-models');
const Security = require('./../security/security');

function BlockService(levelDB) {
  this.levelDB = levelDB;
  this.security = Security.getInstance();
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
      this.security.hashAsync(JSON.stringify(block)).then((hash) => {
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

/**
 * [createGenesisBlock description]
 * @return {Promise} [description]
 */
B.createGenesisBlockAsync = function createGenesisBlockAsync(publicKey) {
  return new Promise((resolve, reject) => {
    const genisisBlock = Models.createBlockInstance({
      blockHeader: Models.createBlockHeaderInstance({
        blockNumber: 0,
        validator: publicKey,
        timestamp: +new Date(),
        blockReward: this.BLOCK_REWARD,
        parentHash: '0',
      }),
    });
    genisisBlock.transactions.push(Models.createTransactionInstance({
      recipient: publicKey,
      amount: 69,
      timestamp: +new Date(),
      type: 'coin',
    }));
    genisisBlock.transactions.push(Models.createTransactionInstance({
      recipient: publicKey,
      amount: 1,
      timestamp: +new Date(),
      type: 'stake',
    }));
    this.calculateBlockHashAsync(genisisBlock).then((hash) => {
      genisisBlock.blockHeader.blockHash = hash;
      genisisBlock.transactions.forEach((transaction) => {
        transaction.blockHash = hash; // eslint-disable-line no-param-reassign
      });
      resolve(genisisBlock);
    }).catch((err) => {
      reject(err);
    });
  });
};

module.exports = {
  createInstance() {
    return new BlockService();
  },
};
