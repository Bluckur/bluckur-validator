const Database = require('bluckur-database');
const BlockchainValidator = require('./validators/blockchainValidator');
const BlockValidator = require('./validators/blockValidator');
const TransactionValidator = require('./validators/transactionValidator');

// Uitility
const GenesisBlockBuilder = require('./util/genesisBlockBuilder').getInstance();
const TemporaryStorage = require('./util/temporaryStorage').getInstance();

// Singleton support
let instance = null;

class Validator {
  constructor() {
    this.database = Database.createInstance(process.env.IS_BACKUP);
    this.blockchainValidator = BlockchainValidator.getInstance();
    this.blockValidator = BlockValidator.getInstance(this.database);
    this.transactionValidator = TransactionValidator.getInstance(this.database);
  }

  /**
   * [initBlockchainAsync description]
   * @return {Promise} [description]
   */
  initBlockchainAsync() {
    return new Promise((resolve, reject) => {
      this.database.getBlockAsync(0).then((block) => {
        if (!block) {
          if (process.env.IS_BACKUP) {
            GenesisBlockBuilder.buildAsync().then((genesisBlock) => {
              return this.database.putBlocksAsync([genesisBlock]);
            }).then(() => {
              resolve();
            }).catch((err) => {
              reject(err);
            });
          } else {
            reject(new Error('Only a backup validator can initialize the blockchain'));
          }
        } else {
          reject(new Error('The blockchain has already been initialized'));
        }
      });
    });
  }
}

module.exports = {
  getInstance() {
    if (!instance) {
      instance = new Validator();
    }
    return instance;
  },
};
