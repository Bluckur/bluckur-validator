const models = require('bluckur-models');
const security = require('./../../security/security').getInstance();

let instance = null;

function TransactionService(levelDB) {
  this.levelDB = levelDB;
}

const T = TransactionService.prototype;

T.verifyTransactionAsync = function verifyTransactionAsync(transaction, pendingGlobalState) {
  return new Promise((resolve, reject) => {
    this.verifiySignatureAsync(transaction).then(() => {
      const isValid = verifyAmount(transaction, pendingGlobalState);
      if (isValid instanceof Error) {
        reject(isValid);
      } else {
        resolve();
      }
    }).catch((err) => {
      console.log(err);
    });
  });
}

T.verifiySignatureAsync = function verifiySignatureAsync(transaction) {
  return new Promise((resolve, reject) => {
    if (this.checkTransactionArguments(transaction)) {
      const data = {
        recipient: transaction.recipient,
        amount: transaction.amount,
        timestamp: transaction.timestamp,
        type: transaction.type,
        sender: transaction.sender,
      }
      security.verifyDetachedAsync(transaction.signature, transaction.sender, data).then((isValid) => {
        if (isValid) {
          resolve();
        } else {
          reject(new Error('Transaction signature is invalid'));
        }
      }).catch((err) => {
        reject(err);
      });
    } else {
      reject(new Error('Can\'t validate transaction with invalid arguments'));
    }
});

T.verifyAmount = function verifyAmount(transaction, pendingGlobalState) {
  if (this.checkTransactionArguments(transaction)) {
      if (transaction.amount > pendingGlobalState[transaction.sender]) {
        return new Error('Transaction amount is bigger than total amount of sender');
      }
      return true;
  } else {
    return new Error('Can\'t validate transaction with invalid arguments');
  }
}

T.checkTransactionArguments = function checkTransactionArguments(transaction) {
  let coinArguments = true;
  if (transaction.type !== 'coin') {
      coinArguments = transaction.signature && transaction.sender;
  }
  return coinArguments &&
    transaction.recipient &&
    transaction.amount &&
    transaction.amount > 0
    transaction.timestamp !== -1 &&
    transaction.timestamp <= +new Date() &&
    transaction.type;
};

module.exports = {
  getInstance() {
    if (!instance) {
      instance = new TransactionService();
    }
    return instance;
  },
};
