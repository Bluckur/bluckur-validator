const BlockchainService = require('./services/blockchainService');
const TransactionService = require('./services/transactionService');
const TemporaryStorage = require('./util/temporaryStorage');

function Validator(publicKey) {
  this.blockchainService = BlockchainService.createInstance(publicKey);
  this.transactionService = TransactionService.createInstance();
  this.temporaryStorage = TemporaryStorage.getInstance();
  this.addTransaction = this.addTransaction.bind(this);
}

const V = Validator.prototype;

V.initBlockchain = function initBlockchain() {
  this.blockchainService.createGenesisBlockAsync().then((genisisBlock) => {
    console.log(genisisBlock);
  }).catch((err) => {
    console.log(err);
  });
};

V.addTransaction = function addTransaction(transaction) {
  this.transactionService.verifiySignatureAsync(transaction).then(() => {
    const globalState = {}; // TODO: LevelDB
    const { pendingTransactions } = this.temporaryStorage;
    const result = this.transactionService.verifyAmount(transaction, pendingTransactions, globalState);
    if (result instanceof Error) {
      console.log(result);
    } else {
      pendingTransactions.push(transaction);
    }
  }).catch((err) => {
    console.log(err);
  });
};

module.exports = {
  createInstance() {
    return new Validator();
  },
};
