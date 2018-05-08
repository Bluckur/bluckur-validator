// Hier moet server en client zooi in gebeuren (het ontvangen en verzenden dus) eventueel kan hier ook de peer/sessie lijst bijgehouden worden.

const ioServer = require('socket.io');
const ioClient = require('socket.io-client')
const Receiver = require('./receiver.js');


/**
 * Default message
 */
class Peer {
    /**
     *
     * @param  {{}} example
     * 
     * 
     */

    constructor() {
        this.port = 8888;
        this.sequenceNumberByClient = new Map(); // This is probably redundant due to io.sockets.clients();

    }

    start() {
        this.server = ioServer.listen(this.port);
        this.client = ioClient.connect('http://localhost:' + this.port);

        this.handleServer(this.port); // these will be removed
        this.handleClient();

    }

    handleServer(port) {

        // event fired every time a new client connects:
        this.server.on('connection', (socket) => {
            console.info(`Client connected [id=${socket.id}]`);
            // initialize this client's sequence number
            this.sequenceNumberByClient.set(socket, 1);
            // when socket disconnects, remove it from the list:
            socket.on('disconnect', () => {
                this.sequenceNumberByClient.delete(socket);
                console.info(`Client gone [id=${socket.id}]`);
            });
        });

        // sends each client its current sequence number
        setInterval(() => {
            for (const [client, sequenceNumber] of this.sequenceNumberByClient.entries()) {
                client.emit('seq-num', sequenceNumber +  " " + client.handshake.address);
                this.sequenceNumberByClient.set(client, sequenceNumber + 1);
            }
        }, 1000);
    }

    handleClient() {
        this.client.on('seq-num', (msg) => console.info(msg));
    }
}
new Peer().start();
module.exports = Peer;
