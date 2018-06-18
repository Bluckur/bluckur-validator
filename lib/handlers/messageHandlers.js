module.exports = {
  startHandlers(self) {
    // Private
    function onBlockchainRequestAsync() {
      return new Promise((resolve, reject) => {
        self.database.getBlockchainAsync().then((blocks) => {
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
          self.database.deleteBlocksAsync(0, blocks.length - 1).then(() => {
            return self.database.putBlocksAsync(receivedBlocks);
          }).catch((err) => {
            console.log(err);
          });
        }
      } else {
        self.database.putBlocksAsync(receivedBlocks);
      }
    }

    function deleteAndPutGlobalState(receivedBlocks) {
      self.database.clearGlobalStateAsync().then(() => {
        let transactions = [];
        receivedBlocks.forEach((block) => {
          transactions = transactions.concat(block.transactions);
        });
        return self.database.updateGlobalStateAsync(transactions);
      }).then(() => {
        console.log('Blockchain and Global State updated');
      }).catch((err) => {
        console.log(err);
      });
    }

    function onBlockchainReply({ data: receivedBlocks }) {
      if (receivedBlocks.length > 0 && self.blockchainValidator.validate(receivedBlocks)) {
        const lastReceivedBlockHeader = receivedBlocks[receivedBlocks.length - 1].blockHeader;
        self.database.getBlockchainAsync().then((blocks) => {
          deleteAndPutBlockchain(receivedBlocks, blocks, lastReceivedBlockHeader);
          deleteAndPutGlobalState(receivedBlocks);
        });
      } else {
        self.peer.sendSingleMessage('blockchain-request', {});
      }
    }
    self.peer.addSingleMessageHandler('blockchain-request', onBlockchainRequestAsync, onBlockchainReply);
  },
};
