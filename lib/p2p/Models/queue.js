// This class mimics a FIFO collection in javascript

const InitialConnector = require('../initialconnector.js');
const ioClient = require('socket.io-client');
const { EventEmitter } = require('events');

module.exports = class Queue {
  constructor(length, data) {
    this.eventEmitter = new EventEmitter();
    this.max = 4;
    this.data = [];
    if (data !== undefined && data !== null) {
      data.forEach((element) => {
        if (element.ip && element.ip !== new InitialConnector().MyIP() && !this.contains(element.ip)) {
          this.data.unshift(element);
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
        record.client = ioClient.connect(`http://${record.ip}:8080`);
      }
      this.data.unshift(record);
      if (this.data.length > this.max) {
        this.remove();
      }
    }
    this.addClientReceives();
    this.eventEmitter.emit('peer-added', {});
  }

  addClientReceives() {
    if (this.receiver) {
      this.data.forEach((element) => {
        if (element.client && !element.client.initated) {
          this.receiver.addClientReceives(element.client);
          element.client.initated = true;
        }
      });
    }
  }

  remove() {
    const record = this.data.pop();
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
    for (let i = 0; i < this.data.length; i++) {
      if (this.data[i].ip === socket.handshake.address.substring(socket.handshake.address.lastIndexOf(':') + 1)) {
        value = i;
        break;
      }
    }
    if (value !== null) {
      this.data.splice(value, 1);
    }
  }

  removeIPRecord(ip) {
    let value = null;
    for (let i = 0; i < this.data.length; i++) {
      if (this.data[i].ip === ip) {
        value = i;
        break;
      }
    }
    if (value !== null) {
      this.data.splice(value, 1);
    }
  }

  flip() {
    this.data.reverse();
  }

  clearSockets() {
    const newArray = this.data.map((element) => {
      const newElement = {};
      newElement.ip = element.ip;
      return newElement;
    });
    return newArray;
  }

  copy() {
    const q = new Queue(this.max);
    q.data = this.data.map((element) => {
      element.ip;
    });
    return q;
  }

  isFull() {
    return this.max === this.size();
  }

  contains(ip) {
    return this.data.filter((element) => { return element.ip === ip; }).length > 0;
  }

  getNext() {
    if (this.data.length === 0) {
      return undefined;
    }
    if (this.data[this.next]) {
      const returnThis = this.data[this.next].client;
      this.next++;

      if (this.next >= this.size()) {
        this.next = 0;
      }

      return returnThis;
    }
    this.next = 0;
    return this.getNext();
  }
};
