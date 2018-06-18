const Database = require('bluckur-database');
const BlockchainValidator = require('./validators/blockchainValidator');
const BlockValidator = require('./validators/blockValidator');
const TransactionValidator = require('./validators/transactionValidator');
const Peer = require('./p2p/peer');

// Uitility
const GenesisBlockBuilder = require('./util/genesisBlockBuilder').getInstance();
const TemporaryStorage = require('./util/temporaryStorage').getInstance();

// Singleton support
let instance = null;

class Validator {
  constructor() {
    this.peer = new Peer().initiate();
    this.isBackup = process.env.IS_BACKUP === 'true';
    this.database = Database.createInstance(this.isBackup);
    this.blockchainValidator = BlockchainValidator.getInstance();
    this.blockValidator = BlockValidator.getInstance(this.database);
    this.transactionValidator = TransactionValidator.getInstance(this.database);

    // Called once on startup
    this.initBlockchainAsync().catch((err) => {
      console.log(err);
    });
  }

  requestBlockchainAsync() {
    return new Promise((resolve, reject) => {

    });
  }

  /**
   * [handleNewBlockAsync description]
   * @param  {Block} block [description]
   * @return {Promise}       [description]
   */
  handleNewBlockAsync(block) {
    return new Promise((resolve, reject) => {
      this.blockValidator.validateAsync(block).then(() => {
        return this.database.putBlocksAsync([block]);
      }).then(() => {
        return this.database.updateGlobalStateAsync(block.transactions);
      }).then(() => {
        resolve();
      }).catch((err) => {
        reject(err);
      });
    });
  }

  /**
   * [handleNewTransactionAsync description]
   * @param  {Transaction} transaction [description]
   * @return {Promise}             [description]
   */
  handleNewTransactionAsync(transaction) {
    return new Promise((resolve, reject) => {
      this.transactionValidator.validateAsync(transaction).then(() => {
        TemporaryStorage.addPendingTransaction(transaction);
        resolve();
      }).catch((err) => {
        reject(err);
      });
    });
  }

  /**
   * [initBlockchainAsync description]
   * @return {Promise} [description]
   */
  initBlockchainAsync() {
    return new Promise((resolve, reject) => {
      // Only a backup validator can initialize the blockchain
      if (this.isBackup) {
        this.database.getBlockchainAsync(0).then((blocks) => {
          // Only initialize a blockchain if there aren't any blocks
          if (blocks.length === 0) {
            // Create and save the genenis block
            let genesisTransactions = [];
            GenesisBlockBuilder.buildAsync().then((genesisBlock) => {
              genesisTransactions = genesisBlock.transactions;
              return this.database.putBlocksAsync([genesisBlock]);
            }).then(() => {
              return this.database.updateGlobalStateAsync(genesisTransactions);
            }).then(() => {
              resolve();
            }).catch((err) => {
              reject(err);
            });
          } else {
            reject(new Error('The blockchain has already been initialized'));
          }
        });
      } else {
        reject(new Error('Only a backup validator can initialize the blockchain'));
      }
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
