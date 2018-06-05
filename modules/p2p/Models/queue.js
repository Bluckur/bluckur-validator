// This class mimics a FIFO collection in javascript

const InitialConnector = require('../initialconnector.js')
const ioClient = require('socket.io-client')

module.exports = class Queue {
    constructor(length, data) {
        this.max = 4;
        this.data = [];
        if (data !== undefined && data !== null) {
            data.forEach(element => {
                if (element.ip && element.ip !== new InitialConnector().MyIP() && !this.contains(element.ip)) {
                    this.data.unshift(element)
                }
            });
        }
        this.next = 0;
    }

    setReceiver(receiver) {
        this.receiver = receiver;
    }

    add(record) {
        if (record.ip && record.ip !== new InitialConnector().MyIP() && !this.contains(record.ip)) {
            if (record.client === undefined) {
                record.client = ioClient.connect('http://' + record.ip + ':8080')
            }
            this.data.unshift(record);
            if (this.data.length > this.max) {
                this.remove();
            }
        }
        this.addClientReceives();
    }

    addClientReceives() {
        if (this.receiver) {
            this.data.forEach(element => {
                if (element.client && !element.client.initated) {
                    this.receiver.addClientReceives(element.client);
                    element.client.initated = true;
                }
            });
        }
    }

    remove() {
        let record = this.data.pop();
        record.client.emit('disconnect');
    }

    first() {
        if (this.data.length > 0) {
            return this.data[0];
        }
        return undefined;
    }

    last() {
        if (this.data.length > 0) {
            return this.data[this.data.length - 1];
        }
        return undefined;
    }

    size() {
        return this.data.length;
    }

    delete(socket) {
        let value = null;
        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i].ip === socket.handshake.address.substring(socket.handshake.address.lastIndexOf(":") + 1)) {
                value = i;
                break;
            }
        }
        if (value !== null) {
            console.log(socket.handshake.address.substring(socket.handshake.address.lastIndexOf(":") + 1) + " has been removed from the clientlist")
            this.data.splice(value, i);
        }
    }

    removeIPRecord(ip) {
        let value = null;
        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i].ip === ip) {
                value = i;
                break;
            }
        }
        if (value !== null) {
            console.log('Received ip of disconnected user. Removing from list: ' + ip )
            this.data.splice(value, i);
        }
    }

    flip() {
        this.data.reverse();
    }

    clearSockets() {
        let newArray = this.data.map(element => {
            let newElement = {};
            newElement.ip = element.ip;
            return newElement
        });
        return newArray
    }

    copy() {
        let q = new Queue(this.max)
        q.data = this.data.map(element => {
            ip: element.ip
        });
        return q
    }

    isFull() {
        return this.max === this.size()
    }

    contains(ip) {
        return this.data.filter(element => element.ip === ip).length > 0;
    }

    getNext() {
        if (this.data[this.next]) {
            let returnThis = this.data[this.next].client;
            this.next++;

            if (this.next >= this.size()) {
                this.next = 0;
            }

            return returnThis;
        }else{
            this.next = 0;
            return this.getNext();
        }
    }
}