const Models = require('bluckur-models');
const HashMap = require('hashmap');
const seedrandom = require('seedrandom');
const Database = require('bluckur-database').getInstance(process.env.IS_BACKUP === 'true');

class Lottery {
  /**
     * Method to pick the winning block
     * @param {Array} receivedBlocks [The received blocks that need to participate into the lottery]
     * @param {String} previousBlockId [The hash / id of the last block in the ledger]
     * @param {GlobalStateUser} globalStateUsers [List of all the global state users from the Database]
     */
  pickWinner(receivedBlocks, previousBlockId, globalStateUsers) {
    const stakeHashMap = {};

    globalStateUsers.forEach(({ publicKey, stake }) => {
      stakeHashMap[publicKey] = stake;
    });

    const candidatesHashMap = new HashMap();
    const candidateBlocksHashMap = new HashMap();

    let tickets = 0;

    receivedBlocks.forEach((block) => {
      const { validator } = block.blockHeader;
      if (Object.keys(stakeHashMap).find((s) => { return s === validator; })) {
        tickets += stakeHashMap[validator];
        candidatesHashMap.set(validator, stakeHashMap[validator]);
        candidateBlocksHashMap.set(validator, block);
      } else {
        console.log(`Validator in else: ${validator}`);
        Database.putStatesAsync([Models.createStateInstance({
          publicKey: validator,
          coin: 0,
          stake: 0,
        })]);
      }
    });

    const randomNumber = seedrandom(previousBlockId)() * tickets;

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
  }
}
module.exports = Lottery;
