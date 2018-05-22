const models = require('bluckur-models');
const security = require('./../security/security').getInstance();

function TransactionService(levelDB) {
  this.levelDB = levelDB;
}

const T = TransactionService.prototype;

T.verifiySignatureAsync = function verifiySignatureAsync(transaction) {
  return new Promise((resolve, reject) => {
    if (this.checkTransactionArguments(transaction)) {
      security.verifyDetachedAsync(transaction.signature, transaction.sender, {
        recipient: transaction.recipient,
        amount: transaction.amount,
        timestamp: transaction.timestamp,
        type: transaction.type,
        sender: transaction.sender,
      }).then((isValid) => {
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
};

/**
 * [verifyAmount description]
 * @param  {[type]} sender       [description]
 * @param  {[type]} amount       [description]
 * @param  {[type]} pendingBlock [description]
 * @param  {[type]} globalState  [description]
 * @return {[type]}              [description]
 */
T.verifyAmount = function verifyAmount(transaction, pendingTransactions, globalState) {
  if (this.checkTransactionArguments(transaction)) {
    let remainingBalance = globalState[transaction.sender];
    remainingBalance -= transaction.amount;
    pendingTransactions.forEach((pendingTransaction) => {
      if (pendingTransaction.sender === transaction.sender) {
        remainingBalance -= pendingTransaction.amount;
      }
    });
    return remainingBalance >= 0 ? true : new Error('Not enough balance to send the transaction');
  }
  return new Error('Can\'t validate transaction with invalid arguments');
};

T.checkTransactionArguments = function checkTransactionArguments(transaction) {
  let coinArguments = true;
  if (transaction.type !== 'coin') {
    coinArguments = transaction.signature && transaction.sender;
  }
  return coinArguments &&
    transaction.recipient &&
    transaction.amount &&
    transaction.amount > 0 &&
    transaction.timestamp !== -1 &&
    transaction.timestamp <= +new Date() &&
    transaction.type;
};

module.exports = {
  createInstance() {
    return new TransactionService();
  },
};
