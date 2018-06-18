// Hier moet server en client zooi in gebeuren (het ontvangen en verzenden dus) eventueel kan hier ook de peer/sessie lijst bijgehouden worden.

/**
 * Default message
 */
let thisConnector;
let instance;

module.exports = class InitialConnector {
  /**
     *
     *
     */

    constructor(firstTimeout) {
        if (!instance) {
            this.ip = "http://192.168.1.4:8082";
            this.myIp = undefined;
            this.peerIp = undefined;
            this.timeout = firstTimeout;
            this.sleeping = false;
            this.finishedOnce = false;
            instance = this;
        }
        return instance;
    }

  MyIP() {
    return this.myIp;
  }

  InitialPeerIP() {
    return this.peerIp;
  }

  initiate() {
    thisConnector = this;

    const promise = new Promise((resolve, reject) => {
      thisConnector.handleRegisterIP().then((result) => {
        if (thisConnector.myIp !== undefined && thisConnector.peerIp !== undefined) {
          resolve({
            peerIp: thisConnector.peerIp,
            myIp: thisConnector.myIp,
          });
        } else {
          reject(Error('Rejected no IP'));
        }
      }, (err) => {
        console.log(err);
      });
    });

    return promise;
  }

  sendRequest(path, errorImpl, successImpl) {
    const request = require('request');
    request(this.ip + path, (error, response, body) => {
      if (error != null || response.statusCode == 500) {
        errorImpl(error);
      } else {
        successImpl(response, body);
      }
    });
  }

  handleRegisterIP() {
    return new Promise((resolve, reject) => {
      this.sendRequest('/register', (error) => {
        reject(error);
      }, (response, body) => {
        thisConnector.handleGetMyIP().then((result) => {
          resolve(result);
        }, (err) => {
          console.log(err);
          reject(err);
        });
      });
    });
  }

  handleGetMyIP() {
    return new Promise((resolve, reject) => {
      this.sendRequest('/ip', (error) => {
        reject('Encountered fatal error: Could not retreive IP from IP-serivce...');
      }, (response, body) => {
        this.myIp = body;
        thisConnector.handleGetPeerIP().then((result) => {
          resolve(result);
        }, (err) => {
          console.log(err);
          reject(err);
        });
      });
    });
  }

  handleGetPeerIP() {
    return new Promise((resolve, reject) => {
      this.sendRequest('/', (error) => {
        reject(`Encountered fatal error: ${error}`);
      }, (response, body) => {
        if (body === 'empty') {
          reject('Encountered fatal error: body can never be empty');
        } else {
          this.peerIp = body;
          this.finishedOnce = true;
        }
        resolve(this.peerIp);
      });
    });
  }
};
