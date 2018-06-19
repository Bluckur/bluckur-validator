/** */
class Messager {
    /**
     *
     * @param {*} socket
     */
    constructor(socket) {
        this.socket = socket;
    }

    /**
     *
     * @param {*} message
     */
    log(message) {
        const currentdate = new Date();
        const datetime = currentdate.getDate() + '/' +
            (currentdate.getMonth() + 1) + '/' +
            currentdate.getFullYear() + ' ' +
            currentdate.getHours() + ':' +
            currentdate.getMinutes() + ':' +
            currentdate.getSeconds();
        this.socket.emit('logging', '(' + datetime + '): ' + message);
        console.log('(' + datetime + '): ' + message);
    }

    /**
     *
     * @param {*} event
     * @param {*} message
     */
    notify(event, message) {
        this.socket.emit(event, message);
    }
}

module.exports = Messager;