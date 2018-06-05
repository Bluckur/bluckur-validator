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
    transactions.map(transaction => this.addPendingTransaction(transaction));
  }

  addProposedBlock(proposedBlock) {
    const exists = false;
    const existingBlock = this.proposedBlocks.filter(block => block.id === proposedBlock.id);
    if (existingBlock.length === 0) {
      this.proposedBlocks.push(proposedBlock);
    }
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