const Cron = require('node-cron');
const models = require('bluckur-models');
const security = require('../lib/security/security').getInstance();
const Peer = require('../lib/p2p/peer');
const BlockSecurity = require('../lib/security/blockSecurity').getInstance();

class CreateBlockTask {
    createAndSend(validator, lastBlockHash, pendingTransactions, blockNumber) {
        const timestamp = Date.now();
        let proposedBlock = models.createBlockInstance({
            transactions: pendingTransactions,
            blockHeader: {
                version: 1,
                blockReward: 50,
                validator,
                parentHash: lastBlockHash,
                blockNumber,
                timestamp,
            },
        });
        BlockSecurity.getHashAsync(proposedBlock).then((blockhash) => {
            proposedBlock.blockHash = blockhash;
            // temporaryStorage.getInstance().addProposedBlock(proposedBlock);
            this.peer = new Peer();
            this.peer.broadcastMessage('proposedblock', proposedBlock);
        });
    }
}

module.exports = CreateBlockTask;