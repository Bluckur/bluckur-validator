const hashMap = require("hashmap");

class TemporaryStorage {

    constructor(){
        this.pendingTransactions = new HashMap();
        this.proposedBlocks = [];
    }

    clearProposedBlocks(){
        this.proposedBlocks = [];
    }

    addPendingTransaction(transaction){
        this.pendingTransactions.set(transaction.id, transaction);
    }

    addPendingTransactionFromMap(key, value){
        this.pendingTransactions.set(key, value);
    }

    addPendingTransactions(transactions){
        transactions.map((transaction) => {
            this.addPendingTransaction(transaction);
        })
    }

    addProposedBlock(proposedBlock){
        var exists = false;
        const existingBlock = this.proposedBlocks.filter(block => block.id === proposedBlock.id);
        if(existingBlock.length === 0){ 
            this.proposedBlocks.push(proposedBlock);
        }
    }

    getPendingTransactions(){
        return this.pendingTransactions;
    }

    getProposedBlocks(){
        return this.proposedBlocks;
    }
}

module.exports = (function () {
    var instance;
 
    function createInstance() {
        var temporaryStorage = new TemporaryStorage();
        return temporaryStorage;
    }
 
    return {
        getInstance: function () {
            if (!instance) {
                instance = createInstance();
            }
            return instance;
        }
    };
})();