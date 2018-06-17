require('dotenv').config();
const Validator = require('./lib/validator').getInstance();

Validator.initBlockchainAsync().then(() => {
  console.log('fasfsf');
}).catch((err) => {
  console.log(err);
});
