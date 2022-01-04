import bonjour from "bonjour";
import fs from "fs";
import {Device} from "./Device.js";
import EventEmitter from "events";

class DeviceManager extends EventEmitter {
    constructor(log, config, api) {
        super();

        this.log = log;
        this.config = config;
        this.api = api;

        this.devices = {};
        this.config_path = 'androidtv-config.json'
    }

    load() {
        if(fs.existsSync(this.config_path)){
            let data = fs.readFileSync(this.config_path, {encoding:'utf-8'});
            if(data){
                let obj = JSON.parse(data);
                if(obj.devices){
                    Object.keys(obj.devices).map((key, index) => {
                        let device = obj.devices[key];
                        this.devices[key] = new Device(device.host, device.port, device.name, device.cert, device.type);
                        this.devices[key].paired = device.paired;
                    });
                }
            }
        }

        this.log.info("Devices loaded");
    }

    save() {
        let devices = {}

        Object.keys(this.devices).map((key, index) => {
            let device = this.devices[key];
            devices[key] = {
                host : device.host,
                port : device.port,
                name : device.name,
                paired : device.paired,
                type : device.type,
                cert: device.android_remote.cert
            }
        });

        let obj = {
            devices : devices
        }
        let data = JSON.stringify(obj, null, 1);
        fs.writeFileSync(this.config_path, data, {encoding:'utf-8'});
    }

    list() {
        let devices = {};
        Object.keys(this.devices).map((key, index) => {
            let device = this.devices[key];
            devices[key] = device.toJSON();
        });

        return devices;
    }

    get(host) {
        return this.devices[host];
    }

    exist(host){
        return !!this.get(host);
    }

    listen(){
        bonjour().find({
            type : ["androidtvremote2"]
        }, async (service) => {
            const name = service.name;
            const address = service.addresses[0];
            const port = service.port;

            this.log.info('Finding online device : ', name, address, port)

            let device;

            if(this.exist(address)){
                device = this.get(address);
            }
            else{
                device = new Device(address, port, name, null, 31);
                this.devices[address] = device;
            }
            device.online = true;

            device.android_remote.on('secret', () => {
                console.info('Pairing', this.devices[address].name);
                this.devices[address].pairing = true;
            });

            device.android_remote.on('powered', (powered) => {
                device.powered = powered;
                this.emit('powered', device);
            });

            device.android_remote.on('volume',(volume) => {
                device.volume_max = volume.maximum;
                if(device.volume_current !== volume.level){
                    device.volume_current = volume.level;
                    this.emit('volume', device);
                }
                else{
                    device.volume_current = volume.level;
                }

                if(device.volume_muted !== volume.muted){
                    device.volume_muted = volume.muted;
                    this.emit('muted', device);
                }
                else{
                    device.volume_muted = volume.muted;
                }
            });

            device.android_remote.on('ready', () => {
                this.emit('discover', device);
            });

            device.android_remote.on('unpaired', () => {
                this.unpair(device.host);
                this.log.info("The device", device.name, "had a problem with certificates and was unpaired");
            });

            if(device.paired){
                let result = await device.android_remote.start();
                if(result){
                    device.started = true;
                    this.save();
                }
            }
        });
    }

    unpair(host){
        let device = this.get(host);
        device.started = false;
        device.paired = false;
        device.android_remote.cert = {};
        this.save();
    }

    async pair(host){
        let device = this.get(host);
        let result = await device.android_remote.start();

        if(result){
            device.started = true;
            this.save();
        }

        return device;
    }

    async sendCode(host, code){
        let device = this.get(host);
        let result = device.android_remote.sendCode(code);

        if(result){
            device.pairing = false;
            device.paired = true;
            this.save();
        }

        return device.toJSON();
    }

    sendPower(host){
        let device = this.get(host);
        device.android_remote.sendPower();
    }
}

export { DeviceManager };
