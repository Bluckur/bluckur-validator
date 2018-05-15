// Hier moet server en client zooi in gebeuren (het ontvangen en verzenden dus) eventueel kan hier ook de peer/sessie lijst bijgehouden worden.

const Peer = require('./peer');

/**
 * Default message
 */
module.exports = class InitialConnector {
    /**
     *
     * 
     */

    constructor(firstTimeout) {
        this.ip = "http://145.93.112.227:8082";
        this.myIp = undefined;
        this.peerIp = undefined
        this.timeout = firstTimeout;
        // console.log(Peer.getPeerQueue());
    }

    getMyIP(){
        return this.myIp;
    }

    getInitialPeerIP(){
        return this.peerIp;
    }

    initate(callback){
        this.handleRegisterIP(); // This also triggers the other calls...
        this.callback = callback;
    }

    done(){
        if(this.callback !== undefined){
            this.callback();
        }else{
            console.log("Attempted to call callback method from initialconnector but no callback method was set");
        }
    }

    sendRequest(path, errorImpl, successImpl){
        var request = require('request');
        request(this.ip + path, function (error, response, body) {
            if(error != null || response.statusCode == 500){
                errorImpl(error);
            }
            else{
                successImpl(response, body);
            }
        }); 
    }

    handleRegisterIP(){
        this.sendRequest("/register", (error) => {
            throw "Encountered fatal error: Could not register IP to IP-serivce...";
        }, (response, body) => {
            console.log("Successfully registered our IP to the IP-service")
            this.handleGetMyIP();
        });
    }

    handleGetMyIP(){
        this.sendRequest("/ip", (error) => {
            throw "Encountered fatal error: Could not retreive IP from IP-serivce...";
        }, (response, body) => {
            this.myIp = body;
            this.handleGetPeerIP();
        });
    }  

    handleGetPeerIP(){
        this.sendRequest("/", (error) => {
            console.log("Encountered fatal error: " + error);
        }, (response, body) => {
            if(body === "empty"){
                throw "Encountered fatal error: body can never be empty";
            }
            if(body === "first"){
                setTimeout( () => {
                    this.handleGetPeerIP();
                }, this.timeout)
            }else{
                this.peerIp = body;
                this.done();
            }
        }); 
    }
}