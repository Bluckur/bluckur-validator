const Models = require('bluckur-models');
const HashMap = require('hashmap');
const seedrandom = require('seedrandom');

class Lottery {
  /**
     * Method to pick the winning block
     * @param {Array} receivedBlocks [The received blocks that need to participate into the lottery]
     * @param {String} previousBlockId [The hash / id of the last block in the ledger]
     * @param {GlobalStateUser} globalStateUsers [List of all the global state users from the Database]
     */
  pickWinner(receivedBlocks, previousBlockId, globalStateUsers) {
    const stakeHashMap = new HashMap();

    globalStateUsers.map((globalStateUser) => {
      stakeHashMap.set(globalStateUser.publicKey, globalStateUser.stake);
    });

    const candidatesHashMap = new HashMap();
    const candidateBlocksHashMap = new HashMap();

    let tickets = 0;

    receivedBlocks.map((block) => {
      if (stakeHashMap.has(block.validator)) {
        tickets += stakeHashMap.get(block.validator);
        candidateHashMap.set(block.validator, stakeHashMap.get(block.validator));
        candidateBlocksHashMap.set(block.validator, block);
      }
    });

    const randomNumber = seedrandom(previousBlockId)();

    let bottomMargin = 0;
    let upperMargin = 0;
    let candidatePointer = 0;

    while (upperMargin < randomNumber) {
      const publicKey = candidatesHashMap.keys()[candidatePointer];
      const stake = candidatesHashMap.get(publicKey);
      upperMargin += stake;
      if (bottomMargin <= randomNumber && upperMargin >= randomNumber) {
        return candidateBlocksHashMap.get(publicKey);
      }
      bottomMargin += stake;
      candidatePointer += 1;
    }
    return Models.createBlockInstance({});
  }
}

module.exports = Lottery;
