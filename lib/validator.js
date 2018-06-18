const Database = require('bluckur-database');
const BlockchainValidator = require('./validators/blockchainValidator');
const BlockValidator = require('./validators/blockValidator');
const Peer = require('../modules/p2p/peer');
const Models = require('bluckur-models');
const TransactionValidator = require('./validators/transactionValidator');

// Uitility
const GenesisBlockBuilder = require('./util/genesisBlockBuilder').getInstance();
const TemporaryStorage = require('./util/temporaryStorage').getInstance();

// Singleton support
let instance = null;

class Validator {
  constructor() {
    this.isBackup = process.env.IS_BACKUP === 'true';
    this.database = Database.createInstance(this.isBackup);
    this.blockchainValidator = BlockchainValidator.getInstance();
    this.blockValidator = BlockValidator.getInstance(this.database);
    this.transactionValidator = TransactionValidator.getInstance(this.database);
    this.peer = new Peer();

    this.peer.initiate();
    
    // Called once on startup
    this.initBlockchainAsync();
  }

  initiateHandleRequests(){
    this.peer.addbroadcastMessageHandler("transaction", (message) => {
      this.handleNewTransactionAsync(message).then((result) => {
        console.log(result);
      }, (err) => {
        console.log(err);
      });
      /*const t1 = Models.createTransactionInstance({
        recipient: 'testietostie123',
        amount: 5,
        timestamp: +new Date(),
        type: 'coin',
        sender: process.env.PUBKEY_ADMIN,
        blockHash: 'iets',
      });*/
      
    })
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
   * [handleNewCoinTransactionAsync description]
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
