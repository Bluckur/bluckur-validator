//Handle all messages received, regardless of them being form the 'server' or 'client'

class Receiver {
    constructor(ioServer){
        this.server = ioServer;

        this.handleServerReceives();
    }

    handleServerReceives(){
        if (this.server) {
            // event fired every time a new client connects:
            this.server.on('connection', (socket) => {
                socket.on('disconnect', () => {
                    //ToDo: Do something with disconnector i think. Maybe move this. We'll see later...
                });

                socket.on('message_isAlive', (message) => {
                    socket.emit("message_isAlive", "Yes, I am online")
                })
            });
        }
    }

    addClientReceives(client){
        if (client) {
            client.on('seq-num', (msg) => console.info(msg));
        }
    }
}

module.exports = Receiver;