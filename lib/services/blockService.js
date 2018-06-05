const Models = require('bluckur-models');
const Security = require('./../security/security');

function BlockService() {
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
 * @param  {Block} block               [description]
 * @param  {BlockHeader} previousBlockHeader [description]
 * @return {Promise}                     [description]
 */
B.validateBlockAsync = function validateBlockAsync(block, previousBlockHeader) {
  return new Promise((resolve, reject) => {
    const { blockHeader } = block;
    if (this.checkBlockHeaderArguments(blockHeader)) {
      this.calculateBlockHashAsync(block).then((hash) => {
        if (this.validateWithPreviousHash(hash, blockHeader, previousBlockHeader)) {
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
 * [validateWithPreviousHash description]
 * @param  {string} hash                [description]
 * @param  {BlockHeader} blockHeader         [description]
 * @param  {BlockHeader} previousBlockHeader [description]
 * @return {Boolean}                     [description]
 */
B.validateWithPreviousHash = function validateWithPreviousHash(hash, blockHeader, previousBlockHeader) {
  return blockHeader.blockHash === hash &&
    blockHeader.parentHash === previousBlockHeader.blockHash &&
    blockHeader.timestamp > previousBlockHeader.timestamp;
};

/**
 * [isValidBlockHeader description]
 * @param  {BlockHeader}  blockHeader [description]
 * @return {Boolean}             [description]
 */
B.checkBlockHeaderArguments = function checkBlockHeaderArguments(blockHeader) {
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
    // Add the genesis transactions to the genesis block
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
    // Hash the genesis block and add it to the block header
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
  /**
   * [createInstance description]
   * @return {BlockService} [description]
   */
  createInstance() {
    return new BlockService();
  },
};
