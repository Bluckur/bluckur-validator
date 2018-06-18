const Database = require('bluckur-database');
const BlockchainValidator = require('./validators/blockChainValidator');
const BlockValidator = require('./validators/blockValidator');
const Peer = require('../lib/p2p/peer');
const Models = require('bluckur-models');
const TransactionValidator = require('./validators/transactionValidator');
const Cron = require('node-cron');
const CreateBlockTask = require('../tasks/CreateBlockTask');
const Security = require('./security/Security');
const KeyStorage = require('./util/keyStorage');
const LotteryTask = require('../tasks/LotteryTask')
const Peer = require('./p2p/peer');
const MessageHandlers = require('./handlers/messageHandlers');

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
    this.security = Security.getInstance();
    this.keyStorage = new KeyStorage();
    this.blockTask = new CreateBlockTask();
    this.lotteryTask = new LotteryTask();
    //this.keyStorage.checkOrGenerateKeypair();
    this.victoriousblocks = [];
    this.victoriousblocksSchedulerStarted = false;

    Array.prototype.byCount = function () {
      var itm, a = [], L = this.length, o = {};
      for (var i = 0; i < L; i++) {
        itm = this[i];
        if (!itm) continue;
        if (o[itm] == undefined) o[itm] = 1;
        else ++o[itm];
      }
      for (var p in o) a[a.length] = p;
      return a.sort(function (a, b) {
        return o[b] - o[a];
      });
    }

    this.peer = new Peer();

    this.peer.initiate();

    // Called once on startup
    this.initBlockchainAsync();

    // Execute blockjob
    // TODO: Execute this job after receiving initial block :) 
    this.executeBlockJob();
  }

  test() {
    this.database.getGlobalStateAsync().then((globalState) => {
      console.log(globalState)
    })
  }

  executeBlockJob() {
    Cron.schedule("*/10 * * * *", () => {
      this.keyStorage.getKeypairAsync().then((resultKeyPair) => {
        this.database.getBlockchainAsync().then((resultBlock) => {

          let lastBlock = resultBlock[resultBlock.length - 1];
          let lasthash = lastBlock.blockHeader.blockHash;
          if (!lasthash) lasthash = "";
          this.blockTask.createAndSend(resultKeyPair.pubKey, lasthash, TemporaryStorage.getPendingTransactionsAsArray(), lastBlock.blockHeader.blockNumber + 1);
        })
      })
    });
  }

  initiateHandleRequests() {
    this.peer.addbroadcastMessageHandler("transaction", (message) => {
      this.handleNewTransactionAsync(message).then((result) => {
        console.log(result);
      }, (err) => {
        console.log(err);
      });
    })
    this.peer.addbroadcastMessageHandler("proposedblock", (message) => {
      this.blockValidator.validateAsync(message).then(() => {
        this.blockValidator.validateTransactionsAsync(message).then(() => {
          TemporaryStorage.addProposedBlock(message);
          this.database.getBlockchainAsync().then((resultBlock) => {
            let lastBlock = resultBlock[resultBlock.length - 1];
            let lasthash = lastBlock.blockHeader.blockHash;
            this.database.getGlobalStateAsync().then((globalState) => {
              this.lotteryTask.scheduleTask(lasthash, globalState);
            })
          });
        }, (err) => {
          console.log(err)
        })
      }, (err) => {
        console.log(err)
      })
    })
    this.peer.addbroadcastMessageHandler("victoriousblock", (block) => {
      this.victoriousblocks.push(block);
      if (!this.victoriousblocksSchedulerStarted) {
        this.victoriousblocksSchedulerStarted = true;
        setTimeout(() => {
          this.victoriousblocks.byCount();
          this.handleNewBlockAsync(this.victoriousblocks[0]).then(() =>{
            this.victoriousblocks = [];
            this.victoriousblocksSchedulerStarted = false;
          });
        }, 10000)
      }
    })
  }

  requestBlockchainAsync() {
    return new Promise((resolve, reject) => {

    });
  }

  /**
   * [start description]
   */
  start() {
    this.database.connectAsync().then(() => {
      this.peer.initiate();
      // Start all handlers
      MessageHandlers.startHandlers(this);

      this.peer.onInitiated(() => {
        if (!this.isStarted) {
          this.initBlockchainAsync().then(() => {
            this.requestBlockchain();
          });
          this.isStarted = true;
        }
      });
    }).catch((err) => {
      console.log(err);
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
            resolve(new Error('The blockchain has already been initialized'));
          }
        });
      } else {
        resolve(new Error('can\'t initalize blockchain when no backup'));
      }
    });
  }

  requestBlockchain() {
    console.log('Requesting blockchain ...');
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
