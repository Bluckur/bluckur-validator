const Cron = require('node-cron');
const models = require('bluckur-models');
const security = require('../lib/security/security').getInstance();
const Peer = require('../lib/p2p/peer');

class CreateBlockTask {
  createAndSend(validator, lastBlockHash, pendingTransactions, blockNumber) {
      let proposedBlock;
      let timestamp = Date.now();

      security.hashAsync(validator + lastBlockHash + blockNumber + timestamp, pendingTransactions).then((result) =>{
        if (!lastBlockHash.trim() === '') {
          proposedBlock = models.createBlockInstance({
            transactions: pendingTransactions,
            blockHeader: {
              validator: validator,
              parentHash: lastBlockHash,
              blockNumber: blockNumber,
              blockHash: result,
              timestamp: timestamp,
            },
          });
        } 
        else {
          proposedBlock = models.createBlockInstance({
            transactions: pendingTransactions,
            blockHeader: {
              validator: validator,
              blockNumber, blockNumber,
              blockHash: result,
              timestamp: timestamp,
            },
          });
        }
  
        // temporaryStorage.getInstance().addProposedBlock(proposedBlock);
        this.peer = new Peer();
        this.peer.broadcastMessage("proposedblock", proposedBlock);
      });
  }
}

module.exports = CreateBlockTask;
