const security = require('./../security/security').getInstance();

function TransactionService() { }

const T = TransactionService.prototype;

/**
 * [verifiySignatureAsync description]
 * @param  {Transaction} transaction [description]
 * @return {Promise}             [description]
 */
T.verifiySignatureAsync = function verifiySignatureAsync(transaction) {
  return new Promise((resolve, reject) => {
    const dataToVerify = this.convertToVerifiableData(transaction);
    security.verifyDetachedAsync(transaction.signature, transaction.sender, dataToVerify).then((isValid) => {
      if (isValid) {
        resolve();
      } else {
        reject(new Error('Transaction signature is invalid'));
      }
    }).catch((err) => {
      reject(err);
    });
  });
};

/**
 * [verifyAmount description]
 * @param  {Transaction} transaction         [description]
 * @param  {Array} pendingTransactions [description]
 * @param  {Number} state               [description]
 * @return {Boolean}                     [description]
 * @return {Error}                     [description]
 */
T.verifyAmount = function verifyAmount(transaction, pendingTransactions, state) {
  if (this.checkTransactionArguments(transaction)) {
    const pendingAmount = pendingTransactions.reduce((accumulator, pendingTransaction) => {
      if (pendingTransaction.sender === transaction.sender) {
        return accumulator + pendingTransaction.amount;
      }
      return accumulator + 0;
    });
    const remainingState = state - transaction.amount - pendingAmount;
    return remainingState >= 0 ? true :
      new Error('Not enough balance to send the transaction');
  }
  return new Error('Can\'t validate transaction with invalid arguments');
};

/**
 * [checkTransactionArguments description]
 * @param  {Transaction} transaction [description]
 * @return {Boolean}             [description]
 */
T.checkTransactionArguments = function checkTransactionArguments(transaction) {
  return (transaction === 'coin' || (transaction.signature && transaction.sender)) &&
    transaction.recipient &&
    transaction.amount &&
    transaction.amount > 0 &&
    transaction.timestamp !== -1 &&
    transaction.timestamp <= +new Date() &&
    transaction.type;
};

/**
 * [createTransactionData description]
 * @param  {Transaction} transaction [description]
 * @return {Object}             [description]
 */
T.convertToVerifiableData = function convertToVerifiableData(transaction) {
  if (this.checkTransactionArguments(transaction)) {
    return {
      recipient: transaction.recipient,
      amount: transaction.amount,
      timestamp: transaction.timestamp,
      type: transaction.type,
      sender: transaction.sender,
    };
  }
  return new Error('Transaction has invalid arguments');
};

module.exports = {
  /**
   * [createInstance description]
   * @return {TransactionService} [description]
   */
  createInstance() {
    return new TransactionService();
  },
};
