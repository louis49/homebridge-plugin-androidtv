import express from "express";
import path from "path";
import { api } from "./api.js";

class AdminServer {

    constructor() {
        this.app = express();
        this.app.use('/api', api())
        //this.app.use('/', express.static('./dist'))
        this.app.use('/', express.static('./homebridge/admin/static'))
    }

    listen(){
        return new Promise((resolve, reject) => {
            let server = this.app.listen(8181, () => {
                resolve(server.address().port)
            }).on('error', e => {
                console.log(e);
                reject(e);
            });
        });
    }
}

export {AdminServer};