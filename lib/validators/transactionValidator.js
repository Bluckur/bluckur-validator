const Security = require('./../util/security');
const Models = require('bluckur-models');

// singleton support
let instance = null;

class TransactionValidator {
  /**
   * [constructor description]
   */
  constructor() {
    this.security = Security.getInstance();
  }

  /**
   * [validateAsync description]
   * @param  {Transaction} transaction         [description]
   * @param  {Transaction[]} pendingTransactions [description]
   * @param  {State} currentState        [description]
   * @return {Promise}                     [description]
   */
  validateAsync(transaction, pendingTransactions, currentState) {
    return new Promise((resolve, reject) => {
      if (this.validateProperties(transaction)) {
        this.validateSignatureAsync(transaction).then(() => {
          if (this.verifyAmount(transaction, pendingTransactions, currentState)) {
            resolve();
          } else {
            reject(new Error('Amount is invalid'));
          }
        }).catch((err) => {
          reject(err);
        });
      } else {
        reject(new Error('Properties are invalid'));
      }
    });
  }

  /**
   * [validateProperties description]
   * @param  {Transaction} transaction [description]
   * @return {Boolean}             [description]
   */
  validateProperties(transaction) {
    return this.hasTruthyProperties(transaction) &&
      Models.validateTransactionSchema(transaction) &&
      transaction.timestamp <= +new Date() &&
      transaction.timestamp !== -1 && transaction.amount > 0;
  }

  /**
   * [validateSignatureAsync description]
   * @param  {Transaction} transaction [description]
   * @return {Boolean}             [description]
   */
  validateSignatureAsync(transaction) {
    return new Promise((resolve, reject) => {
      const { signature, ...tail } = transaction;
      this.security.verifyDetachedAsync(signature, tail.sender, tail).then((isValid) => {
        if (isValid) {
          resolve();
        } else {
          reject(new Error('Signature is invalid'));
        }
      }).catch((err) => {
        reject(err);
      });
    });
  }

  /**
   * [validateAmount description]
   * @param  {Transaction} transaction         [description]
   * @param  {Transaction[]} pendingTransactions [description]
   * @param  {State} currentState        [description]
   * @return {Boolean}                     [description]
   */
  validateAmount(transaction, pendingTransactions, currentState) {
    const pendingCoinBalance = this.getPendingCoinBalance(transaction.sender, pendingTransactions);
    return currentState.coin - pendingCoinBalance - transaction.amount >= 0;
  }

  /**
   * [getPendingCoinBalance description]
   * @param  {String} publicKey           [description]
   * @param  {Transaction[]} pendingTransactions [description]
   * @return {Float}                     [description]
   */
  getPendingCoinBalance(publicKey, pendingTransactions) {
    return pendingTransactions.reduce((accumulator, { sender, recipient, amount }) => {
      const multiplier = sender === publicKey ? -1 : (recipient === publicKey ? 1 : 0); // eslint-disable-line no-nested-ternary
      return accumulator + (amount * multiplier);
    });
  }

  /**
   * [hasTruthyProperties description]
   * @param  {Transaction}  transaction [description]
   * @return {Boolean}             [description]
   */
  hasTruthyProperties(transaction) {
    return transaction.signature &&
      transaction.amount &&
      transaction.timestamp &&
      transaction.type &&
      transaction.blockHash &&
      transaction.recipient &&
      transaction.sender;
  }
}

module.exports = {
  /**
   * [getInstance description]
   * @return {TransactionValidator} [description]
   */
  getInstance() {
    if (!instance) {
      instance = new TransactionValidator();
    }
    return instance;
  },
};
