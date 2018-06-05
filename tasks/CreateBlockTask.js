var schedule = require('node-schedule');
var models = require('bluckur-models');
var security = require('../lib/security/security');
var temporaryStorage = require('../logic/temporaryStorage');

class CreateBlockTask {
    scheduleTask(validator, lastBlockHash, pendingTransactions, blockNumber) {
        var createBlockSchedule = schedule.scheduleJob('0 * * * * *', function () {
            var proposedBlock;

            if(!lastBlockHash.trim() === ""){
                proposedBlock = models.createBlockInstance({
                    transactions : pendingTransactions,
                    blockHeader : {
                        validator : validator,
                        parentHash : lastBlockHash,
                        blockNumber : blockNumber,
                        blockHash : security.hash(validator + lastBlockHash + blockNumber + Date.now(), pendingTransactions),
                        timestamp : Date.now()
                    }
                })
            } else {
                proposedBlock = models.createBlockInstance({
                    transactions : pendingTransactions,
                    blockHeader : {
                        validator : validator,
                        blockNumber : blockNumber,
                        blockHash : security.hash(validator + lastBlockHash + blockNumber + Date.now(), pendingTransactions),
                        timestamp : Date.now()
                    }
                })
            }

            temporaryStorage.getInstance().addProposedBlock(proposedBlock);

            //TODO: Send proposed block over the network
        });
    }
}

module.exports = CreateBlockTask;