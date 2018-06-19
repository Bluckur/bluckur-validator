const Models = require('bluckur-models');
const TemporaryStorage = require('./../util/temporaryStorage').getInstance();
const TransactionSecurity = require('./../security/transactionSecurity').getInstance();

// Singleton support
let instance = null;

class TransactionValidator {
  /**
     * [constructor description]
     * @param {MasterRepository} database    [description]
     * @param {TemporaryStorage} tempStorage [description]
     */
  constructor(database) {
    this.database = database;
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
      TransactionSecurity.verifySignatureAsync(transaction).then((isValid) => {
        if (isValid) {
          if (transaction.type === 'stake') {
            if (transaction.sender !== process.env.PUBKEY_ADMIN) {
              reject(new Error('Sender is not admin'));
            }
          }
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
      if (transaction.type !== 'stake') {
        this.database.getStateAsync(transaction.sender).then(({ coin: currentCoinBalance }) => {
          const pendingTransactions = TemporaryStorage.getPendingTransactionsAsArray();
          const pendingCoinBalance = this.getPendingCoinBalance(transaction.sender, pendingTransactions);
          console.log(pendingCoinBalance + currentCoinBalance - transaction.amount);
          if (pendingCoinBalance + currentCoinBalance - transaction.amount >= 0) {
            resolve();
          } else {
            reject(new Error('Amount is invalid'));
          }
        }).catch((err) => {
          reject(new Error('Amount is invalid'))
        }); 
      } else {
        resolve();
      }
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
            transaction.timestamp !== -1 &&
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
    }, 0);
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
  getInstance(database) {
    if (!instance) {
      if (!database) {
        throw new Error('Invalid argument(s)');
      }
      instance = new TransactionValidator(database);
    }
    return instance;
  },
};
