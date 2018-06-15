const Security = require('./../util/security');
const Models = require('bluckur-models');

// Singleton support
let instance = null;

class TransactionValidator {
  /**
   * [constructor description]
   * @param {MasterRepository} database    [description]
   * @param {TemporaryStorage} tempStorage [description]
   */
  constructor(database, tempStorage) {
    this.database = database;
    this.tempStorage = tempStorage;
    this.security = Security.getInstance();
  }

  /**
   * [validateAsync description]
   * @param  {Transaction} transaction         [description]
   * @param  {Transaction[]} pendingTransactions [description]
   * @param  {State} currentState        [description]
   * @return {Promise}                     [description]
   */
  validateAsync(transaction) {
    return new Promise((resolve, reject) => {
      if (this.validateProperties(transaction)) {
        this.validateSignatureAsync(transaction).then(() => {
          return this.validateAmountAsync(transaction);
        }).then(() => {
          resolve();
        }).catch((err) => {
          reject(err);
        });
      } else {
        reject(new Error('Properties are invalid'));
      }
    });
  }

  /**
   * [validateSignatureAsync description]
   * @param  {Transaction} transaction [description]
   * @return {Boolean}             [description]
   */
  validateSignatureAsync(transaction) {
    return new Promise((resolve, reject) => {
      const { signature, ...other } = transaction;
      this.security.verifyDetachedAsync(signature, other.sender, other).then((isValid) => {
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
  validateAmountAsync(transaction) {
    return new Promise((resolve, reject) => {
      this.database.getStateAsync(transaction.sender).then(({ coin: currentCoinBalance }) => {
        const pendingTransactions = this.tempStorage.getPendingTransactionsAsArray();
        const pendingCoinBalance = this.getPendingCoinBalance(transaction.sender, pendingTransactions);
        if (currentCoinBalance - pendingCoinBalance - transaction.amount >= 0) {
          resolve();
        } else {
          reject(new Error('Amount is invalid'));
        }
      });
    });
  }

  /**
   * [validateProperties description]
   * @param  {Transaction} transaction [description]
   * @return {Boolean}             [description]
   */
  validateProperties(transaction) {
    return Models.validateTransactionSchema(transaction) &&
      this.hasTruthyProperties(transaction) &&
      transaction.timestamp <= +new Date() && transaction.timestamp !== -1 &&
      transaction.amount > 0;
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
      return sender === recipient ? 0 : accumulator + (amount * multiplier);
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
   * @param  {MasterRepository} database    [description]
   * @param  {TemporaryStorage} tempStorage [description]
   * @return {TransactionValidator}             [description]
   */
  getInstance(database, tempStorage) {
    if (!instance) {
      if (!database || !tempStorage) {
        throw new Error('Invalid argument(s)');
      }
      instance = new TransactionValidator(database, tempStorage);
    }
    return instance;
  },
};
