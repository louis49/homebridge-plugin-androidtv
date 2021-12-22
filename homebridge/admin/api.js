import express from "express";
import { deviceManager } from "../DeviceManager.js"

function api() {
    const api = express()
    api.use(express.json())

    api.get('/devices', (req, res) => {
        let devices = deviceManager.list();
        let devices_json = {};
        Object.keys(devices).map((key, index) => {
            devices_json[key] = devices[key].toJSON();
        });
        res.json(devices_json);
    });

    api.get('/devices/:host', (req, res) => {
        res.json(deviceManager.get(req.params.host).toJSON());
    });

    api.put('/devices/:host/pair', async (req, res) => {
        await deviceManager.pair(req.params.host);
        res.json(deviceManager.get(req.params.host).toJSON());
    });

    api.put('/devices/:host/secret', async(req, res) => {
        let ret = await deviceManager.sendCode(req.params.host, req.body.code);
        if(ret){
            deviceManager.get(req.params.host).setPaired(true);
        }
        deviceManager.get(req.params.host).setPairing(false);
        deviceManager.save();
        res.json(deviceManager.get(req.params.host).toJSON());
    });

    api.put('/devices/:host/start', async (req, res) => {
        let ret = await deviceManager.start(req.params.host);
        if(ret){
            deviceManager.get(req.params.host).setStarted(true);
        }
        res.json(deviceManager.get(req.params.host));
    });

    api.get('/devices/:host/power', async (req, res) => {
        deviceManager.sendPower(req.params.host);
        res.json({});
    });

    return api;
}

export { api };