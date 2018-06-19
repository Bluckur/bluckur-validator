const models = require('bluckur-models');
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

        receivedBlocks.forEach((block) => {
            const validator = block.blockHeader.validator;
            if (stakeHashMap.has(validator)) {
                tickets += stakeHashMap.get(validator);
                candidatesHashMap.set(validator, stakeHashMap.get(validator));
                candidateBlocksHashMap.set(validator, block);
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
        return new Block();
    }
}

module.exports = Lottery;