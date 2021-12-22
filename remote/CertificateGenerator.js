import forge from "node-forge"
import crypto from "crypto";
import fs from "fs";

class CertificateGenerator {

    generate(host){
        let keys = forge.pki.rsa.generateKeyPair(2048);
        let cert = forge.pki.createCertificate();
        cert.publicKey = keys.publicKey;
        cert.serialNumber = '01' + crypto. randomBytes(19).toString("hex");
        cert.validity.notBefore = new Date(); // new Date('Apr 18 11:37:42 2021 GMT');
        let date = new Date();
        date.setUTCFullYear(2099);
        cert.validity.notAfter = date;//new Date('Feb 1 12:37:42 2099 GMT');

        let attributes = [{
            name: 'commonName',
            value: 'homebridge-plugin-googletv'
        }, {
            name: 'countryName',
            value: 'N/A'
        }, {
            shortName: 'ST',
            value: 'N/A'
        }, {
            name: 'localityName',
            value: 'N/A'
        }, {
            name: 'organizationName',
            value: 'O N/A'
        }, {
            shortName: 'OU',
            value: 'OU N/A'
        }];
        cert.setSubject(attributes);
        cert.sign(keys.privateKey, forge.md.sha256.create());

        this.cert = forge.pki.certificateToPem(cert)
        this.key = forge.pki.privateKeyToPem(keys.privateKey);

        fs.writeFileSync('./certs/cert_' + host + '.pem', this.cert);
        fs.writeFileSync('./certs/key_' + host + '.pem', this.key);
    }

    hasCertificate(host){
        try {
            fs.accessSync('./certs/cert_' + host + '.pem', fs.constants.R_OK);
            fs.accessSync('./certs/key_' + host + '.pem', fs.constants.R_OK);
            console.log('can read/write');
            return true;
        } catch (err) {
            console.error('no access!');
            return false;
        }
    }

    resetCertificate(host){
        fs.rmSync('./certs/cert_' + host + '.pem', {force : true});
        fs.rmSync('./certs/key_' + host + '.pem', {force : true});
    }

    retrieve(host){
        let cert = fs.readFileSync('./certs/cert_' + host + '.pem', {encoding:'utf8'});
        let key = fs.readFileSync('./certs/key_' + host + '.pem', {encoding:'utf8'});
        return {
            cert : cert,
            key : key,
        }
    }

}

let certificateGenerator = new CertificateGenerator();
export { certificateGenerator };