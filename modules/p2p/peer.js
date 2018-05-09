// Hier moet server en client zooi in gebeuren (het ontvangen en verzenden dus) eventueel kan hier ook de peer/sessie lijst bijgehouden worden.

const ioServer = require('socket.io');
const ioClient = require('socket.io-client'),

    /**
     * Default message
     */
    class Peer {
        /**
         *
         * 
         */

        constructor() {
            this.client = ioClient.connect('http://localhost:8000');
            this.sequenceNumberByClient = new Map();
            this.server = io.listen(port);
            this.handleServer(port);
            this.handleClient();
        }

        handleServer(port) {
            if (server) {
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
                    for (const [client, sequenceNumber] of sequenceNumberByClient.entries()) {
                        client.emit('seq-num', sequenceNumber);
                        sequenceNumberByClient.set(client, sequenceNumber + 1);
                    }
                }, 1000);
            }
        }

        handleClient() {
            if (this.client) {
                this.client.on('seq-num', (msg) => console.info(msg));
            }
        }
    }

module.exports = Peer;