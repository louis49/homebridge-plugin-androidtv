import Readline from "readline";
import {certificateGenerator} from "./CertificateGenerator.js";
import tls from "tls";
import {pairingMessageManager} from "./PairingMessageManager.js";
import Crypto from "crypto-js";

class PairingManager {
    constructor(host, port) {
        this.host = host;
        this.port = port;
        this.chunks = Buffer.from([]);
        this.line = Readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.paired = false;
    }

    async sendCode(code){
        return new Promise((resolve, reject) => {

            this.pairing_resolve = resolve;
            this.pairing_reject = reject;

            let code_bytes = this.hexStringToBytes(code);

            let client_certificate = this.client.getCertificate();
            let server_certificate = this.client.getPeerCertificate();

            let sha256 = Crypto.algo.SHA256.create();

            sha256.update(Crypto.enc.Hex.parse(client_certificate.modulus));
            sha256.update(Crypto.enc.Hex.parse("0" + client_certificate.exponent.slice(2)));
            sha256.update(Crypto.enc.Hex.parse(server_certificate.modulus));
            sha256.update(Crypto.enc.Hex.parse("0" + server_certificate.exponent.slice(2)));
            sha256.update(Crypto.enc.Hex.parse(code.slice(2)));

            let hash = sha256.finalize();
            let hash_array  = this.hexStringToBytes(hash.toString());
            let check = hash_array[0];
            if (check !== code_bytes[0]){
                //reject(new Error("Bad status : " + message.status));
                return;
            }
            this.client.write(pairingMessageManager.createPairingSecret(hash_array));
        });
    }

    async start(certs) {

        return new Promise((resolve, reject) => {
            //certificateGenerator.generate(host);
            //let certs = certificateGenerator.retrieve(host);

            var options = {
                key : certs.key,
                cert: certs.cert,
                port: this.port,
                host : this.host,
                rejectUnauthorized: false,
            }


            console.log("Start Pairing Connect");
            this.client = tls.connect(options, function (){
                console.log("Pairing connected")
            });

            this.client.pairingManager = this;

            this.client.on("secureConnect", function() {
                console.log("Pairing secureConnect");
                this.write(pairingMessageManager.createPairingRequest());
            });

            this.client.on('data', function (data) {
                let buffer = Buffer.from(data);
                this.pairingManager.chunks = Buffer.concat([this.pairingManager.chunks, buffer]);

                if(this.pairingManager.chunks.length > 0 && this.pairingManager.chunks.readInt8(0) === this.pairingManager.chunks.length - 1){

                    let message = pairingMessageManager.parse(this.pairingManager.chunks);
                    this.pairingManager.chunks = Buffer.from([]);

                    if (message.status !== pairingMessageManager.Status.STATUS_OK){
                        reject(new Error("Bad status : " + message.status));
                        this.destroy();
                    }

                    if(message.pairingRequestAck){
                        this.pairingManager.client.write(pairingMessageManager.createPairingOption());
                    }
                    else if(message.pairingOption){
                        this.pairingManager.client.write(pairingMessageManager.createPairingConfiguration());
                    }
                    else if(message.pairingConfigurationAck){
                        /*
                        pairing.line.question("Code : ", function (code){
                            let code_bytes = pairing.hexStringToBytes(code);

                            let client_certificate = pairing.client.getCertificate();
                            let server_certificate = pairing.client.getPeerCertificate();

                            let sha256 = Crypto.algo.SHA256.create();

                            sha256.update(Crypto.enc.Hex.parse(client_certificate.modulus));
                            sha256.update(Crypto.enc.Hex.parse("0" + client_certificate.exponent.slice(2)));
                            sha256.update(Crypto.enc.Hex.parse(server_certificate.modulus));
                            sha256.update(Crypto.enc.Hex.parse("0" + server_certificate.exponent.slice(2)));
                            sha256.update(Crypto.enc.Hex.parse(code.slice(2)));

                            let hash = sha256.finalize();
                            let hash_array  = pairing.hexStringToBytes(hash.toString());
                            let check = hash_array[0];
                            if (check !== code_bytes[0]){
                                reject(new Error("Bad status : " + message.status));
                                return;
                            }
                            pairing.client.write(pairingMessageManager.createPairingSecret(hash_array));
                        });
                         */
                    }
                    else if(message.pairingSecretAck){
                        console.log("Paired!");
                        this.destroy();

                        this.pairingManager.paired = true;
                    }
                    else {
                        console.log("Unknown!")
                    }
                }
            });

            this.client.on('close', function(hasError) {
                console.log("Pairing Connection closed", hasError);
                if(this.pairingManager.paired){
                    this.pairingManager.paired = false;
                    this.pairingManager.pairing_resolve(true);
                    resolve(true);
                }
                else{
                    this.pairingManager.pairing_resolve(false);
                    resolve(false);
                }
            });

            this.client.on('error', function(error) {
                console.error(error);
            });

            this.client.on('end', function () {
                console.log("end");
            });
        });

    }

    hexStringToBytes(q){
        var bytes = [];
        for (var i = 0; i < q.length; i += 2) {
            var byte = parseInt(q.substring(i, i + 2), 16);
            if (byte > 127) {
                byte = -(~byte & 0xFF) - 1;
            }
            bytes.push(byte);
        }
        return bytes;
    }
}

//let pairing = new PairingManager();

export { PairingManager };