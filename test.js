const Database = require('./services/database.js');

const db = new Database();

db.put('0x0EE620DeBEBcecDd4dd84920eF50215c35088915', 10);
db.get('0x0EE620DeBEBcecDd4dd84920eF50215c35088915').then((result) => {
  console.log(result);
});
// db.update('0x0EE620DeBEBcecDd4dd84920eF50215c35088915', 15)
//   .then(() => {
//     db.get('0x0EE620DeBEBcecDd4dd84920eF50215c35088915').then((result) => {
//       console.log(result);
//     });
//   });