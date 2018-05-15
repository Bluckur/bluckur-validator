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
                    
                }

            })
        }, 10000);
    }
}

module.exports = LotteryTask;