const Database = require('bluckur-database');
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
        this.database = Database.createInstance(this.isBackup);
        this.blockchainValidator = BlockchainValidator.getInstance();
        this.blockValidator = BlockValidator.getInstance(this.database);
        this.transactionValidator = TransactionValidator.getInstance(this.database);

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
    }


    /**
     * [start description]
     */
    start() {
        this.database.connectAsync().then(() => {
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
                this.database.getBlockchainAsync().then((resultBlock) => {
                    const lastBlock = resultBlock[resultBlock.length - 1];
                    let lasthash = lastBlock.blockHeader.blockHash;
                    if (!lasthash) lasthash = '';
                    this.blockTask.createAndSend(resultKeyPair.pubKey, lasthash, TemporaryStorage.getPendingTransactionsAsArray(), lastBlock.blockHeader.blockNumber + 1);
                });
            });
        });
    }

    initiateHandleRequests() {
        this.peer.addbroadcastMessageHandler('transaction', (message) => {
            this.handleNewTransactionAsync(message.data).then((result) => {
                console.log(result);
            }, (err) => {
                console.log(err);
            });
        });
        this.peer.addbroadcastMessageHandler('proposedblock', (message) => {
            this.blockValidator.validateAsync(message.data).then(() => {
                this.blockValidator.validateTransactionsAsync(message.data).then(() => {
                    TemporaryStorage.addProposedBlock(message.data);
                    this.database.getBlockchainAsync().then((resultBlock) => {
                        const lastBlock = resultBlock[resultBlock.length - 1];
                        const lasthash = lastBlock.blockHeader.blockHash;
                        this.database.getGlobalStateAsync().then((globalState) => {
                            this.lotteryTask.scheduleTask(lasthash, globalState);
                        });
                    });
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
                this.database.getBlockchainAsync().then((blocks) => {
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

    onBlockchainRequestAsync() {
        console.log('Blockchain request received');
        return new Promise((resolve, reject) => {
            this.database.getBlockchainAsync().then((blocks) => {
                resolve(blocks);
            }).catch((err) => {
                reject(err);
            });
        });
    }

    deleteAndPutBlockchain(receivedBlocks, blocks, lastReceivedBlockHeader) {
        if (blocks.length > 0) {
            const lastBlockHeader = blocks[blocks.length - 1].blockHeader;
            if (lastBlockHeader.blockHash !== lastReceivedBlockHeader.blockHash) {
                this.database.deleteBlocksAsync(0, blocks.length - 1).then(() => {
                    return this.database.putBlocksAsync(receivedBlocks);
                }).catch((err) => {
                    console.log(err);
                });
            }
        } else {
            this.database.putBlocksAsync(receivedBlocks);
        }
    }

    deleteAndPutGlobalState(receivedBlocks) {
        this.database.clearGlobalStateAsync().then(() => {
            let transactions = [];
            receivedBlocks.forEach((block) => {
                transactions = transactions.concat(block.transactions);
            });
            return this.database.updateGlobalStateAsync(transactions);
        }).then(() => {
            console.log('Blockchain and Global State updated');
        }).catch((err) => {
            console.log(err);
        });
    }

    onBlockchainReply({ data: receivedBlocks }) {
        console.log('Blockchain received');
        if (receivedBlocks.length > 0 && this.blockchainValidator.validate(receivedBlocks)) {
            const lastReceivedBlockHeader = receivedBlocks[receivedBlocks.length - 1].blockHeader;
            this.database.getBlockchainAsync().then((blocks) => {
                this.deleteAndPutBlockchain(receivedBlocks, blocks, lastReceivedBlockHeader);
                this.deleteAndPutGlobalState(receivedBlocks);
            });
        } else {
            this.peer.sendSingleMessage('blockchain-request', {});
        }
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