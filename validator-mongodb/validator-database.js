const mongoose = require('mongoose');

let db;
let globalStateSchema;
let blockSchema;
let globalStateModel;
let blockModel;

class ValidatorDB {
    constructor() {
        this.open();
    }

    open() {
        mongoose.connect('mongodb://ua23im3yvznz9lq:T91CXbcgV2NEE34Jimv1@bysrbdz7h9y84cy-mongodb.services.clever-cloud.com:27017/bysrbdz7h9y84cy');
        db = mongoose.connection;
        db.on('error', console.error.bind(console, '[INFO]: Not connected'));
        db.once('open', function () { console.log('[INFO]: Connected!') });
    }
    
    initSchemasAndModels(){
        blockSchema = mongoose.Schema({
            
        });
        globalStateSchema = mongoose.Schema({

        })
        blockModel = mongoose.model('Chain', blockSchema);
        globalStateModel = mongoose.model('GlobalSate', globalStateSchema);
    }

    // Put block class
    putBlock(){
    
    }

    // Put global state class
    putGlobalState(){

    }

    // Update global state class
    updateGlobalState(){

    }
}

module.exports = ValidatorDB;