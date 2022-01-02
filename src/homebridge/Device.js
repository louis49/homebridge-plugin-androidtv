import {AndroidRemote} from "androidtv-remote";

class Device {

    constructor(host, port, name, cert, type) {
        this.host = host;
        this.port = port;
        this.name = name;
        this.pairing = false;
        this.paired = false;
        this.online = false;
        this.powered = false;
        this.started = false;
        this.volume_current = 0;
        this.volume_max = 0;
        this.volume_muted = false;
        this.app_package_current = "";
        this.android_remote = new AndroidRemote(this.host, {
            pairing_port : this.port + 1,
            remote_port : this.port,
            name : 'homebridge-plugin-googletv',
            cert : cert,
        });
        this.type = type;
    }

    toJSONSaver(){
        return {
            host: this.host,
            port: this.port,
            name: this.name,
            paired : this.paired,
            type : this.type,
        }
    }

    toJSON(){
        return {
            host : this.host,
            name : this.name,
            paired : this.paired,
            pairing : this.pairing,
            powered : this.powered,
            online : this.online,
            started : this.started,
            volume_max : this.volume_max,
            volume_current : this.volume_current,
            volume_muted : this.volume_muted,
            app_package_current : this.app_package_current,
            type : this.type,
        }
    }
}

export { Device };
