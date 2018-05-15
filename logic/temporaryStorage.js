const hashMap = require("hashmap");

class TemporaryStorage {

    constructor(){
        if(this.pendingTransactions === undefined){
            this.pendingTransactions = new HashMap();
        } 
        if(this.proposedBlocks === undefined){
            this.proposedBlocks = [];
        }
    }

    clearProposedBlocks(){
        this.proposedBlocks = [];
    }

    addPendingTransaction(transaction){
        this.pendingTransactions.set(transaction.id, transaction);
    }

    addPendingTransactions(transactions){
        transactions.map((transaction) => {
            this.addPendingTransaction(transaction);
        })
    }

    addProposedBlock(proposedBlock){
        var exists = false;
        this.proposedBlocks.map((block) => {
            if(proposedBlock.id === block.id){
                exists = true;
            }
        })

        if(!exists){
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