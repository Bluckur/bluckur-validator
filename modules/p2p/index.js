const Peer = require('./peer')
const readlineSync = require('readline-sync');

let peer = new Peer();
peer.initiate();
peer.addbroadcastMessageHandler("chat", (message) => {
	console.log(message.messageContent)
})

wait();

function wait() {
	setTimeout(() => {
		if (peer.initated()) {
			let message = readlineSync.question('toSend:');
			let messageObject = { messageContent: message }
			//console.log('send ' + message + '!');
			peer.broadcastMessage("chat", messageObject)
		}
		wait()
	}, 100);
}