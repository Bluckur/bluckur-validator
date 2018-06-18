module.exports = {
  getHandlers(database, peer, blockchainValidator) {
    // Private
    function onBlockchainRequestAsync() {
      return new Promise((resolve, reject) => {
        this.database.getBlockchainAsync().then((blocks) => {
          resolve({ data: blocks });
        }).catch((err) => {
          reject(err);
        });
      });
    }

    function deleteAndPutBlockchain(receivedBlocks, blocks, lastReceivedBlockHeader) {
      if (blocks.length > 0) {
        const lastBlockHeader = blocks[blocks.length - 1].blockHeader;
        if (lastBlockHeader.blockHash !== lastReceivedBlockHeader.blockHash) {
          this.database.deleteBlocksAsync(0, blocks.length - 1).then(() => {
            return this.database.putBlocksAsync(receivedBlocks);
          }).catch((err) => {
            console.log(err);
          });
        }
      } else {
        this.database.putBlocksAsync(receivedBlocks);
      }
    }

    function deleteAndPutGlobalState(receivedBlocks) {
      this.database.clearGlobalStateAsync().then(() => {
        let transactions = [];
        receivedBlocks.forEach((block) => {
          transactions = transactions.concat(block.transactions);
        });
        return this.database.updateGlobalStateAsync(transactions);
      }).then(() => {
        console.log('Blockchain and Global State updated');
      }).catch((err) => {
        console.log(err);
      });
    }

    function onBlockchainReply({ data: receivedBlocks }) {
      if (receivedBlocks.length > 0 && blockchainValidator.validate(receivedBlocks)) {
        const lastReceivedBlockHeader = receivedBlocks[receivedBlocks.length - 1].blockHeader;
        this.database.getBlockchainAsync().then((blocks) => {
          deleteAndPutBlockchain(receivedBlocks, blocks, lastReceivedBlockHeader);
          deleteAndPutGlobalState(receivedBlocks);
        });
      } else {
        this.peer.sendSingleMessage('blockchain-request', {});
      }
    }

    return {
      startHandlers() {
        peer.addSingleMessageHandler('blockchain-request', onBlockchainRequestAsync, onBlockchainReply);
      },
    };
  },
};
