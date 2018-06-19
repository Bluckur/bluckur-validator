const Database = require('bluckur-database').getInstance(process.env.IS_BACKUP === 'true');
const BlockchainValidator = require('./validators/blockChainValidator');
const BlockValidator = require('./validators/blockValidator');
const TransactionValidator = require('./validators/transactionValidator');
const Cron = require('node-cron');
const CreateBlockTask = require('../tasks/CreateBlockTask');
const Security = require('./security/security');
const KeyStorage = require('./util/keyStorage');
const LotteryTask = require('../tasks/LotteryTask');
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
    this.blockchainValidator = BlockchainValidator.getInstance();
    this.blockValidator = BlockValidator.getInstance(Database);
    this.transactionValidator = TransactionValidator.getInstance(Database);

    // Function binds
    this.onBlockchainReply = this.onBlockchainReply.bind(this);
    this.onBlockchainRequestAsync = this.onBlockchainRequestAsync.bind(this);

    // Start it all
    this.start();

    this.security = Security.getInstance();
    this.keyStorage = new KeyStorage();
    this.blockTask = new CreateBlockTask();
    this.lotteryTask = new LotteryTask();
    // this.keyStorage.checkOrGenerateKeypair();
    this.victoriousblocks = [];
    this.victoriousblocksSchedulerStarted = false;
    this.fetchBlockchainTries = 0;
  }


  /**
     * [start description]
     */
  start() {
    Database.connectAsync().then(() => {
      this.peer.initiate();
      // Start all handlers
      this.peer.addSingleMessageHandler('blockchain-request', this.onBlockchainRequestAsync, this.onBlockchainReply);

      this.peer.onInitiated(() => {
        if (!this.isStarted) {
          this.initBlockchainAsync().then(() => {
            this.initiateHandleRequests();
            this.executeBlockJob();
            this.requestBlockchain();
          });
          this.isStarted = true;
        }
      });
    }).catch((err) => {
      console.log(err);
    });
  }

  executeBlockJob() {
    Cron.schedule('*/1 * * * *', () => {
      this.keyStorage.getKeypairAsync().then((resultKeyPair) => {
        Database.getBlockchainAsync().then((resultBlock) => {
          const lastBlock = resultBlock[resultBlock.length - 1];
          let lasthash = lastBlock.blockHeader.blockHash;
          if (!lasthash) lasthash = '';
          this.blockTask.createAndSend(resultKeyPair.pubKey, lasthash, TemporaryStorage.getPendingTransactionsAsArray(), lastBlock.blockHeader.blockNumber + 1);
          Database.getGlobalStateAsync().then((globalState) => {
            this.lotteryTask.scheduleTask(lasthash, globalState);
          });
        });
      });
    });
  }

  initiateHandleRequests() {
    this.peer.addbroadcastMessageHandler('transaction', (message) => {
      this.handleNewTransactionAsync(message.data).then((result) => {
      }, (err) => {
        console.log(err);
      });
    });
    this.peer.addbroadcastMessageHandler('proposedblock', (message) => {
      this.blockValidator.validateAsync(message.data).then(() => {
        this.blockValidator.validateTransactionsAsync(message.data).then(() => {
          TemporaryStorage.addProposedBlock(message.data);
        }, (err) => {
          console.log(err);
        });
      }, (err) => {
        console.log(err);
      });
    });
    this.peer.addbroadcastMessageHandler('victoriousblock', (message) => {
      this.victoriousblocks.push(message.data);
      if (!this.victoriousblocksSchedulerStarted) {
        this.victoriousblocksSchedulerStarted = true;
        setTimeout(() => {
          this.victoriousblocks.byCount();
          this.handleNewBlockAsync(this.victoriousblocks[0]).then(() => {
            this.victoriousblocks = [];
            this.victoriousblocksSchedulerStarted = false;
          });
        }, 10000);
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
        return Database.putBlocksAsync([block]);
      }).then(() => {
        return Database.updateGlobalStateAsync(block.transactions);
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
        Database.getBlockchainAsync().then((blocks) => {
          // Only initialize a blockchain if there aren't any blocks
          if (blocks.length === 0) {
            // Create and save the genenis block
            let genesisTransactions = [];
            GenesisBlockBuilder.buildAsync().then((genesisBlock) => {
              genesisTransactions = genesisBlock.transactions;
              return Database.putBlocksAsync([genesisBlock]);
            }).then(() => {
              return Database.updateGlobalStateAsync(genesisTransactions);
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

  onBlockchainRequestAsync() {
    console.log('Blockchain request received');
    return new Promise((resolve, reject) => {
      Database.getBlockchainAsync().then((blocks) => {
        resolve(blocks);
      }).catch((err) => {
        reject(err);
      });
    });
  }

  deleteAndPutBlockchain(receivedBlocks, blocks, lastReceivedBlockHeader) {
    if (blocks.length > 0) {
      const lastBlockHeader = blocks[blocks.length - 1].blockHeader;
      if (lastBlockHeader.blockHash !== lastReceivedBlockHeader.blockHash || blocks.length !== receivedBlocks.length) {
        const blockNumbers = [];
        for (let i = 0; i < (blocks.length - 1); i += 1) {
          blockNumbers.push(i);
        }
        Database.deleteBlocksAsync(blockNumbers).then(() => {
          return Database.putBlocksAsync(receivedBlocks);
        }).catch((err) => {
          console.log(err);
        });
      }
    } else {
      Database.putBlocksAsync(receivedBlocks);
    }
  }

  deleteAndPutGlobalState(receivedBlocks) {
    Database.clearGlobalStateAsync().then(() => {
      let transactions = [];
      receivedBlocks.forEach((block) => {
        transactions = transactions.concat(block.transactions);
      });
      return Database.updateGlobalStateAsync(transactions);
    }).then(() => {
      console.log('Blockchain and Global State updated');
    }).catch((err) => {
      console.log(err);
    });
  }

  onBlockchainReply({ data: receivedBlocks }) {
    console.log(`Blockchain received with length ${receivedBlocks.length}`);
    if (receivedBlocks.length > 0 && this.blockchainValidator.validate(receivedBlocks)) {
      const lastReceivedBlockHeader = receivedBlocks[receivedBlocks.length - 1].blockHeader;
      Database.getBlockchainAsync().then((blocks) => {
        this.deleteAndPutBlockchain(receivedBlocks, blocks, lastReceivedBlockHeader);
        this.deleteAndPutGlobalState(receivedBlocks);
      });
    } else { setTimeout(() => { this.requestBlockchain(); }, 1000); }
  }

  requestBlockchain() {
    console.log('Request blockchain');
    this.peer.sendSingleMessage('blockchain-request', {});
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

/* eslint-disable */
Array.prototype.byCount = function byCount() {
    let itm;
    const a = [];
    const L = this.length;
    const o = {};
    for (let i = 0; i < L; i++) {
        itm = this[i];
        if (!itm) continue;
        if (o[itm] === undefined) o[itm] = 1;
        else ++o[itm];
    }
    for (const p in o) a[a.length] = p;
    return a.sort((a, b) => {
        return o[b] - o[a];
    });
};
/* eslint-enable */
