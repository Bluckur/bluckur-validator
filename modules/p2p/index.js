const Peer = require('./peer')
const readlineSync = require('readline-sync');

let peer = new Peer();
peer.initiate();
while (!peer.initiated){

}
peer.addbroadcastMessageHandler("chat", (message) => {
	console.log(message)
})

while (true) {
	let message = readlineSync.question('toSend:');
	//console.log('send ' + message + '!');
	peer.broadcastMessage("chat", message)
}
