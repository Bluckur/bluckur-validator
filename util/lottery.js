const models = require('bluckur-models');
const HashMap = require('hashmap');
const seedrandom = require('seedrandom');

class Lottery{

    /**
     * Method to pick the winning block
     * @param {Array} receivedBlocks [The received blocks that need to participate into the lottery]
     * @param {String} previousBlockId [The hash / id of the last block in the ledger]
     * @param {GlobalStateUser} globalStateUsers [List of all the global state users from the Database]
     */
    pickWinner(receivedBlocks , previousBlockId, globalStateUsers){
        var stakeHashMap = new HashMap();

        globalStateUsers.map((globalStateUser) => {
            stakeHashMap.set(globalStateUser.publicKey, globalStateUser.stake)
        });

        var candidatesHashMap = new HashMap();
        var candidateBlocksHashMap = new HashMap();

        var tickets = 0;

        receivedBlocks.map((block) =>{
            if(stakeHashMap.has(block.validator)){
                tickets = tickets + stakeHashMap.get(block.validator);
                candidateHashMap.set(block.validator, stakeHashMap.get(block.validator))
                candidateBlocksHashMap.set(block.validator, block)  
            }
        });

        var randomNumber = seedrandom(previousBlockId)();

        var bottomMargin = 0;
        var upperMargin = 0;
        var candidatePointer = 0;

        while(upperMargin < randomNumber){
            var publicKey = candidatesHashMap.keys()[candidatePointer];
            var stake = candidatesHashMap.get(publicKey);
            upperMargin = upperMargin + stake;
            if(bottomMargin <= randomNumber && upperMargin >= randomNumber){
                return candidateBlocksHashMap.get(publicKey);
            }
            bottomMargin = bottomMargin + stake;
            candidatePointer = candidatePointer + 1;
        }
        return new Block();
    }
}

module.exports = Lottery;