import express from "express";

function api(deviceManager) {
    const api = express()
    api.use(express.json());

    api.get('/devices', (req, res) => {
        let devices = deviceManager.list();
        res.json(devices);
    });

    api.get('/devices/:host', (req, res) => {
        res.json(deviceManager.get(req.params.host).toJSON());
    });

    api.put('/devices/:host/pair', async (req, res) => {
        await deviceManager.pair(req.params.host);
        res.json(deviceManager.get(req.params.host).toJSON());
    });

    api.put('/devices/:host/secret', async(req, res) => {
        let device = await deviceManager.sendCode(req.params.host, req.body.code);

        res.json(device);
    });

    api.put('/devices/:host/type', async (req, res) => {
        deviceManager.get(req.params.host).type = parseInt(req.body.type,10);
        deviceManager.save();
        res.json(deviceManager.get(req.params.host));
    });

    api.get('/devices/:host/power', async (req, res) => {
        deviceManager.sendPower(req.params.host);
        res.json({});
    });

    return api;
}

export { api };
