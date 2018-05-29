const BlockService = require('./services/blockService');
const TransactionService = require('./services/transactionService');
const TemporaryStorage = require('./util/temporaryStorage');

function Validator() {
  this.blockService = BlockService.createInstance();
  this.transactionService = TransactionService.createInstance();
  this.temporaryStorage = TemporaryStorage.getInstance();
  this.addTransactionAsync = this.addTransactionAsync.bind(this);
}

const V = Validator.prototype;

V.initBlockchainAsync = function initBlockchainAsync() {
  return new Promise((resolve, reject) => {
    this.blockService.createGenesisBlockAsync('75821586eeee3dc40f7ef83df809c9a38de017ed3adaed8130becd267f5eeffb').then((genisisBlock) => {
      resolve(genisisBlock);
    }).catch((err) => {
      reject(err);
    });
  });
};

V.addTransactionAsync = function addTransactionAsync(transaction) {
  return new Promise((resolve, reject) => {
    this.transactionService.verifiySignatureAsync(transaction).then(() => {
      const globalState = {}; // TODO: LevelDB
      const { pendingTransactions } = this.temporaryStorage;
      const result = this.transactionService.verifyAmount(transaction, pendingTransactions, globalState);
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
};

module.exports = {
  createInstance() {
    return new Validator();
  },
};
