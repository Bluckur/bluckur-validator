// Hier moet server en client zooi in gebeuren (het ontvangen en verzenden dus) eventueel kan hier ook de peer/sessie lijst bijgehouden worden.

/**
 * Default message
 */
var thisConnector;

module.exports = class InitialConnector {
    /**
     *
     * 
     */

    constructor(firstTimeout) {
        // this.ip = "http://145.93.137.20:8082";
        this.ip = "http://145.93.112.221:8082";
        this.myIp = undefined;
        this.peerIp = undefined;
        this.timeout = firstTimeout;
    }

    static get MyIP() {
        return this.myIp;
    }

    static get InitialPeerIP() {
        return this.peerIp;
    }

    initiate() {
        thisConnector = this;

        var promise = new Promise((resolve, reject) => {
            thisConnector.handleRegisterIP().then((result) => {
                if (thisConnector.myIp !== undefined && thisConnector.peerIp !== undefined) {
                    resolve({
                        peerIp: thisConnector.peerIp,
                        myIp: thisConnector.myIp
                    });
                } else {
                    reject(Error("Rejected no IP"));
                }
            }, (err) => {
                console.log(err);
            })
        })

        return promise;
    }

    sendRequest(path, errorImpl, successImpl) {
        var request = require('request');
        request(this.ip + path, function (error, response, body) {
            if (error != null || response.statusCode == 500) {
                errorImpl(error);
            }
            else {
                successImpl(response, body);
            }
        });
    }

    handleRegisterIP() {
        return new Promise((resolve, reject) => {
            this.sendRequest("/register", (error) => {
                reject(error);
            }, (response, body) => {
                thisConnector.handleGetMyIP().then((result) => {
                    resolve(result);
                }, (err) => {
                    console.log(err);
                    reject(err);
                })
            });
        })
    }

    handleGetMyIP() {
        return new Promise((resolve, reject) => {
            this.sendRequest("/ip", (error) => {
                reject("Encountered fatal error: Could not retreive IP from IP-serivce...");
            }, (response, body) => {
                this.myIp = body;
                thisConnector.handleGetPeerIP().then((result) => {
                    resolve(result);
                }, (err) => {
                    console.log(err);
                    reject(err);
                })
            });
        });
    }

    handleGetPeerIP() {
        return new Promise((resolve, reject) => {
            this.sendRequest("/", (error) => {
                reject("Encountered fatal error: " + error);
            }, (response, body) => {
                if (body === "empty") {
                    reject("Encountered fatal error: body can never be empty");
                }
                if (body === "first") {
                    setTimeout(() => {
                        this.handleGetPeerIP().then((result) => {
                        }, (err) => {
                        });
                    }, this.timeout)
                } else {
                    this.peerIp = body;
                }
                resolve(this.peerIp);
            });
        })
    }
}