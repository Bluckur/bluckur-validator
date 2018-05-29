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
V.addTransactionAsync = function addTransactionAsync(transaction) {
  return new Promise((resolve, reject) => {
    this.transactionService.verifiySignatureAsync(transaction).then(() => {
      this.database.getAccountBalance(transaction.sender).then((state) => {
        console.log(`My balance is: ${state}`);
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
    }).catch((err) => {
      reject(err);
    });
  });
};

V.updateGlobalStateAsync = function updateGlobalStateAsync(transactions) {
  return new Promise((resolve, reject) => {
    const promises = [];
    transactions.forEach((transaction) => {
      promises.push(this.updateTransactionStateAsync(transaction));
    });
    Promise.all(promises).then(() => {
      resolve();
    }).catch((err) => {
      reject(err);
    });
  });
};

V.updateTransactionStateAsync = function updateTransactionStateAsync(transaction) {
  return new Promise((resolve, reject) => {
    const { recipient: pubKey, amount } = transaction;
    this.database.updateAccountBalance(pubKey, amount).then((isUpdated) => {
      if (!isUpdated) {
        this.database.putAccountBalance(pubKey, amount).then((isPut) => {
          if (isPut) {
            console.log(`Amount put in globalstate: ${amount}`);
            resolve();
          } else {
            reject();
          }
        });
      } else {
        console.log(`Amount updated in globalstate: ${amount}`);
        resolve();
      }
    });
  });
};

module.exports = {
  createInstance() {
    return new Validator();
  },
};
