const Security = require('./../util/security');
const Models = require('bluckur-models');

// Singleton support
let instance = null;

class BlockValidator {
  /**
   * [constructor description]
   * @param {MasterRepository} database [description]
   */
  constructor(database) {
    this.database = database;
    this.security = Security.getInstance();
  }

  /**
   * [validateAsync description]
   * @param  {Block} block [description]
   * @return {Promise}       [description]
   */
  validateAsync(block) {
    return new Promise((resolve, reject) => {
      if (this.validateProperties(block)) {
        this.validateHashAsync(block).then(() => {
          return this.validateParentHashAsync(block);
        }).then(() => {
          resolve();
        }).catch((err) => {
          reject(err);
        });
      } else {
        reject(new Error('Properties are invalid'));
      }
    });
  }

  /**
   * [validateHashAsync description]
   * @param  {Block} block [description]
   * @return {Promise}       [description]
   */
  validateHashAsync(block) {
    return new Promise((resolve, reject) => {
      const { blockHash, ...other } = block;
      this.security.hashAsync(other).then((hash) => {
        if (hash === blockHash) {
          resolve();
        } else {
          reject(new Error('Hash is invalid'));
        }
      });
    });
  }

  /**
   * [validateParentHashAsync description]
   * @param  {Block} block [description]
   * @return {Promise}       [description]
   */
  validateParentHashAsync(block) {
    return new Promise((resolve, reject) => {
      this.getPreviousBlockHashAsync(block).then((previousBlockHash) => {
        if (previousBlockHash === block.blockHeader.parentHash) {
          resolve();
        } else {
          reject(new Error('Parent hash is invalid'));
        }
      });
    });
  }

  /**
   * [validateProperties description]
   * @param  {Block} block [description]
   * @return {Boolean}       [description]
   */
  validateProperties(block) {
    const { blockHeader } = block;
    return Models.validateBlockSchema(block) &&
      this.hasTruthyProperties(block) &&
      blockHeader.timestamp <= +new Date() && blockHeader.timestamp !== -1;
  }

  /**
   *
   * @param  {Block} block [description]
   * @return {Promise}       [description]
   */
  getPreviousBlockHashAsync(block) {
    return new Promise((resolve, reject) => {
      this.database.getBlockAsync(block.blockHeader.blockNumber - 1).then((previousBlock) => {
        resolve(previousBlock.blockHeader.blockHash);
      }).catch((err) => {
        reject(err);
      });
    });
  }

  /**
   * [hasTruthyProperties description]
   * @param  {Block}  block [description]
   * @return {Boolean}       [description]
   */
  hasTruthyProperties(block) {
    const { transactions, blockHeader } = block;
    return transactions &&
      blockHeader &&
      blockHeader.version &&
      blockHeader.blockNumber &&
      blockHeader.validator &&
      blockHeader.timestamp &&
      blockHeader.blockReward &&
      blockHeader.blockHash &&
      blockHeader.parentHash;
  }
}

module.exports = {
  /**
   * [getInstance description]
   * @param  {MasterRepository} database [description]
   * @return {BlockValidator}          [description]
   */
  getInstance(database) {
    if (!instance) {
      if (!database) {
        throw new Error('Invalid argument(s)');
      }
      instance = new BlockValidator();
    }
    return instance;
  },
};
