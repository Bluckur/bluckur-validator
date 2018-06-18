const Database = require('bluckur-database');
const BlockchainValidator = require('./validators/blockChainValidator');
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
    this.peer = new Peer();
    this.isBackup = process.env.IS_BACKUP === 'true';
    this.isStarted = false;
    this.database = Database.createInstance(this.isBackup);
    this.blockchainValidator = BlockchainValidator.getInstance();
    this.blockValidator = BlockValidator.getInstance(this.database);
    this.transactionValidator = TransactionValidator.getInstance(this.database);

    this.start();

    this.onBlockchainReply = this.onBlockchainReply.bind(this);
    this.onBlockchainRequestAsync = this.onBlockchainRequestAsync.bind(this);
  }

  /**
   * [start description]
   */
  start() {
    this.peer.initiate();
    this.startBlockchainRequestHandler();
    this.peer.onInitiated(() => {
      if (!this.isStarted) {
        this.initBlockchainAsync().then((isError) => {
          if (isError) console.log(isError);
          this.peer.sendSingleMessage('blockchain-request', {});
        });
        this.isStarted = true;
      }
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
            resolve(new Error('The blockchain has already been initialized'));
          }
        });
      } else {
        resolve(new Error('can\'t initalize blockchain when no backup'));
      }
    });
  }

  startBlockchainRequestHandler() {
    console.log('1');
    this.peer.addSingleMessageHandler(
      'blockchain-request',
      this.onBlockchainRequestAsync,
      this.onBlockchainReply,
    );
  }

  onBlockchainRequestAsync() {
    return new Promise((resolve, reject) => {
      console.log('Get the blockchain!');
      this.database.getBlockchainAsync().then((blocks) => {
        console.log(blocks)
        resolve(blocks);
      }).catch((err) => {
        console.log(err);
      });
    });
  }

  onBlockchainReply(blocks) {
    if (this.blockchainValidator.validate(blocks)) {
      let transactions = [];
      console.log(blocks)
      blocks.forEach((block) => {
        transactions = transactions.concat(block.transactions);
      });
      this.database.putBlocksAsync(blocks).then(() => {
        return this.database.updateGlobalStateAsync(transactions);
      }).catch((err) => {
        console.log(err);
      });
    } else {
      this.peer.sendSingleMessage('blockchain-request', '');
    }
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
