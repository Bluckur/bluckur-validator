const BlockService = require('./services/blockService');
const TransactionService = require('./services/transactionService');
const TemporaryStorage = require('./util/temporaryStorage');
const Database = require('bluckur-database');

function Validator() {
  // this.database = new Database(this.process.env.IS_BACKUP);
  this.database = new Database();
  this.blockService = BlockService.createInstance();
  this.transactionService = TransactionService.createInstance();
  this.temporaryStorage = TemporaryStorage.getInstance();
  this.addTransactionAsync = this.addTransactionAsync.bind(this);
}

const V = Validator.prototype;

/**
 * [initBlockchainAsync description]
 * @return {Promise} [description]
 */
V.initBlockchainAsync = function initBlockchainAsync() {
  /* eslint-disable */
  return new Promise((resolve, reject) => {
    const publicKey = '75821586eeee3dc40f7ef83df809c9a38de017ed3adaed8130becd267f5eeffb';
    let genesisBlock = {};
    this.blockService.createGenesisBlockAsync(publicKey).then((block) => {
      genesisBlock = block;
      return this.database.putBlock(genesisBlock);
    }).then(() => {
      return this.updateGlobalStateAsync(genesisBlock.transactions);
    }).then(() => {
      resolve();
    }).catch((err) => {
      reject(err);
    });
  });
  /* eslint-enable */
};

/**
 * [addTransactionAsync description]
 * @param {Transaction} transaction [description]
 * @return {Promise} [description]
 */
V.addPendingTransactionAsync = function addPendingTransactionAsync(transaction) {
  /* eslint-disable */
  return new Promise((resolve, reject) => {
    this.transactionService.verifiySignatureAsync(transaction).then(() => {
      return this.database.getAccountBalance(transaction.sender);
    }).then((state) => {
        const { pendingTransactions } = this.temporaryStorage;
        const result = this.transactionService.verifyAmount(transaction, pendingTransactions, state);
        if (result instanceof Error) {
          reject(result);
        } else {
          pendingTransactions.push(transaction);
          resolve(result);
        }
    }).catch((err) => {
      reject(err);
    });
  });
  /* eslint-enable */
};

/**
 * [updateGlobalStateAsync description]
 * @param  {Array} transactions [description]
 * @return {Promise}              [description]
 */
V.updateGlobalStateAsync = function updateGlobalStateAsync(transactions) {
  return new Promise((resolve, reject) => {
    const transactionItems = [];
    transactions.forEach((transaction) => {
      transaction.push.apply(this.createTransactionItems(transaction));
    });
    this.database.updateAccountWallet(transactionItems).then((isUpdated) => {
      if (isUpdated) {
        resolve(isUpdated);
      } else {
        reject(new Error('Global state update failed'));
      }
    }).catch((err) => {
      reject(err);
    });
  });
};

/**
 * [createTransactionItems description]
 * @param  {Transaction} transaction [description]
 * @return {Object}             [description]
 */
V.createTransactionItems = function createTransactionItems(transaction) {
  // Add a transaction item for receiving value and spending value
  return [
    {
      pubKey: transaction.sender,
      coin: transaction.type === 'coin' ? transaction.amount * -1 : 0,
      stake: transaction.type === 'stake' ? transaction.amount * -1 : 0,
    },
    {
      pubKey: transaction.receiver,
      coin: transaction.type === 'coin' ? transaction.amount : 0,
      stake: transaction.type === 'stake' ? transaction.amount : 0,
    },
  ];
};

module.exports = {
  createInstance() {
    return new Validator();
  },
};
