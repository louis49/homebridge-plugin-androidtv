import express from "express";
import path from "path";
import { api } from "./api.js";

class AdminServer {

    constructor(port, deviceManager) {
        this.port = port;
        this.deviceManager = deviceManager;
        this.app = express();
        this.app.use('/api', api(this.deviceManager))
        this.app.use('/', express.static('./homebridge/admin/static'))
    }

    listen(){
        return new Promise((resolve, reject) => {
            let server = this.app.listen(this.port, () => {
                resolve(server.address().port)
            }).on('error', e => {
                console.log(e);
                reject(e);
            });
        });
    }
}

export {AdminServer};
