import express from "express";
import path from "path";
import { api } from "./api.js";

import { fileURLToPath } from 'url';
import { dirname } from "path";
const directory = dirname(fileURLToPath(import.meta.url));

class AdminServer {
    constructor(port, deviceManager) {
        this.port = port;
        this.deviceManager = deviceManager;
        this.app = express();
        this.app.use('/api', api(this.deviceManager));
        this.app.use('/', express.static(path.join(directory,'static')));
    }

    listen(){
        return new Promise((resolve, reject) => {
            let server = this.app.listen(this.port, () => {
                resolve(server.address().port)
            }).on('error', e => {
                console.error(e);
                reject(e);
            });
        });
    }
}

export {AdminServer};
