const Cron = require('node-cron');
const models = require('bluckur-models');
const temporaryStorage = require('../lib/util/temporaryStorage');
const lottery = require('../util/lottery');
const HashMap = require('hashmap');
const Peer = require('../lib/p2p/peer');

class LotteryTask {
    scheduleTask(previousHash, globalStateUsers) {
        var createBlockSchedule = setInterval(() => {
            var chosenBlock = new lottery().pickWinner(temporaryStorage.getInstance().getProposedBlocks(), previousHash, globalStateUsers);

            temporaryStorage.getInstance().getProposedBlocks().map((block) => {
                var notValidatedTransactions = new HashMap();
                block.transactions.map((transaction) => {
                    notValidatedTransactions.set(transaction.id, transaction);
                });

                if (block.transactions && chosenBlock.transactions && block.transactions.length > chosenBlock.transactions.length) {
                    chosenBlock.transactions.map((transactionFromChosenBlock) => {
                        notValidatedTransactions.remove(transactionFromChosenBlock.id);
                    });
                }

                notValidatedTransactions.forEach(function(value, key) {
                    temporaryStorage.getInstance().addPendingTransaction(value, key);
                });
            });

            temporaryStorage.getInstance().clearProposedBlocks();
            this.peer = new Peer();
            this.peer.broadcastMessage("victoriousblock", chosenBlock);

        }, 10000);
    }
}

module.exports = LotteryTask;