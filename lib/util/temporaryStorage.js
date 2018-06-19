const HashMap = require('hashmap');

class TemporaryStorage {
  constructor() {
    this.pendingTransactions = new HashMap();
    this.proposedBlocks = [];
  }

  clearProposedBlocks() {
    this.proposedBlocks = [];
  }

  addPendingTransaction(transaction) {
    this.pendingTransactions.set(transaction.id, transaction);
    return true;
  }

  addPendingTransactionFromMap(key, value) {
    this.pendingTransactions.set(key, value);
  }

  addPendingTransactions(transactions) {
    transactions.map((transaction) => { return this.addPendingTransaction(transaction); });
  }

  addProposedBlock(proposedBlock) {
    const existingBlock = this.proposedBlocks.find((b) => { return b.blockHeader.validator === proposedBlock.blockHeader.validator; });
    if (!existingBlock) {
      this.proposedBlocks.push(proposedBlock);
    }
  }

  getPendingTransactionsAsArray() {
    return this.pendingTransactions.values() || [];
  }

  getPendingTransactions() {
    return this.pendingTransactions;
  }

  getProposedBlocks() {
    return this.proposedBlocks;
  }
}

module.exports = (function () {
  let instance;

  function createInstance() {
    const temporaryStorage = new TemporaryStorage();
    return temporaryStorage;
  }

  return {
    getInstance() {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    },
  };
}());
