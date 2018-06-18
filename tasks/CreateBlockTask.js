const schedule = require('node-schedule');
const models = require('bluckur-models');
const security = require('../lib/security/security');
const temporaryStorage = require('../logic/temporaryStorage');

class CreateBlockTask {
  scheduleTask(validator, lastBlockHash, pendingTransactions, blockNumber) {
    const createBlockSchedule = schedule.scheduleJob('0 * * * * *', () => {
      let proposedBlock;

      if (!lastBlockHash.trim() === '') {
        proposedBlock = models.createBlockInstance({
          transactions: pendingTransactions,
          blockHeader: {
            validator,
            parentHash: lastBlockHash,
            blockNumber,
            blockHash: security.hash(validator + lastBlockHash + blockNumber + Date.now(), pendingTransactions),
            timestamp: Date.now(),
          },
        });
      } else {
        proposedBlock = models.createBlockInstance({
          transactions: pendingTransactions,
          blockHeader: {
            validator,
            blockNumber,
            blockHash: security.hash(validator + lastBlockHash + blockNumber + Date.now(), pendingTransactions),
            timestamp: Date.now(),
          },
        });
      }

      temporaryStorage.getInstance().addProposedBlock(proposedBlock);

      // TODO: Send proposed block over the network
    });
  }
}

module.exports = CreateBlockTask;
