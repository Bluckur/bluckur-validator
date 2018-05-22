const schedule = require('node-schedule');
const models = require('bluckur-models');
const temporaryStorage = require('../logic/temporaryStorage');
const lottery = require('../util/lottery');
const HashMap = require('hashmap');

class LotteryTask {
    scheduleTask(previousHash, globalStateUsers){
        var createBlockSchedule = setInterval(() => {
            var chosenBlock = lottery.pickWinner(temporaryStorage.getInstance().getProposedBlocks(), previousHash, globalStateUsers);

            temporaryStorage.getInstance().getProposedBlocks().map((block) => {
                var notValidatedTransactions = new HashMap();
                block.transactions.map((transaction) => {
                    notValidatedTransactions.set(transaction.id, transaction);
                });

                if(block.transactions.length > chosenBlock.transactions.length){
                    chosenBlock.transactions.map((transactionFromChosenBlock) => {
                        notValidatedTransactions.remove(transactionFromChosenBlock.id);
                    });
                }

                notValidatedTransactions.forEach(function(value, key) {
                    temporaryStorage.getInstance().addPendingTransaction(value, key);
                });

                //TODO: Add transactions and block to the global state.
            });

            temporaryStorage.getInstance().clearProposedBlocks();
        }, 10000);
    }
}

module.exports = LotteryTask;