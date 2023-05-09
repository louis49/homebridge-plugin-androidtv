import { AdminServer } from "./admin/index.js";
import { DeviceManager } from "./DeviceManager.js";
export const PLATFORM_NAME = 'HomebridgeAndroidTV';
export const PLUGIN_NAME = 'homebridge-androidtv';
import {RemoteKeyCode, RemoteDirection} from "androidtv-remote";

class AndroidTV {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.keys = {};

        this.keys[this.api.hap.Characteristic.RemoteKey.REWIND] = RemoteKeyCode.KEYCODE_MEDIA_REWIND;
        this.keys[this.api.hap.Characteristic.RemoteKey.FAST_FORWARD] =  RemoteKeyCode.KEYCODE_MEDIA_FAST_FORWARD;
        this.keys[this.api.hap.Characteristic.RemoteKey.NEXT_TRACK ] =  RemoteKeyCode.KEYCODE_MEDIA_NEXT;
        this.keys[this.api.hap.Characteristic.RemoteKey.PREVIOUS_TRACK ] =  RemoteKeyCode.KEYCODE_MEDIA_PREVIOUS;
        this.keys[this.api.hap.Characteristic.RemoteKey.ARROW_UP] =  RemoteKeyCode.KEYCODE_DPAD_UP;
        this.keys[this.api.hap.Characteristic.RemoteKey.ARROW_DOWN] =  RemoteKeyCode.KEYCODE_DPAD_DOWN;
        this.keys[this.api.hap.Characteristic.RemoteKey.ARROW_LEFT] =  RemoteKeyCode.KEYCODE_DPAD_LEFT;
        this.keys[this.api.hap.Characteristic.RemoteKey.ARROW_RIGHT] =  RemoteKeyCode.KEYCODE_DPAD_RIGHT;
        this.keys[this.api.hap.Characteristic.RemoteKey.SELECT] =  RemoteKeyCode.KEYCODE_DPAD_CENTER;
        this.keys[this.api.hap.Characteristic.RemoteKey.BACK] =  RemoteKeyCode.KEYCODE_BACK;
        this.keys[this.api.hap.Characteristic.RemoteKey.EXIT] =  RemoteKeyCode.KEYCODE_HOME;
        this.keys[this.api.hap.Characteristic.RemoteKey.PLAY_PAUSE] = RemoteKeyCode.KEYCODE_MEDIA_PLAY_PAUSE;
        this.keys[this.api.hap.Characteristic.RemoteKey.INFORMATION] = this.config.infoKeyOverride ? RemoteKeyCode[this.config.infoKeyOverride] : RemoteKeyCode.KEYCODE_INFO;

        this.channelskeys = {};
        this.channelskeys[0] = RemoteKeyCode.KEYCODE_0;
        this.channelskeys[1] = RemoteKeyCode.KEYCODE_1;
        this.channelskeys[2] = RemoteKeyCode.KEYCODE_2;
        this.channelskeys[3] = RemoteKeyCode.KEYCODE_3;
        this.channelskeys[4] = RemoteKeyCode.KEYCODE_4;
        this.channelskeys[5] = RemoteKeyCode.KEYCODE_5;
        this.channelskeys[6] = RemoteKeyCode.KEYCODE_6;
        this.channelskeys[7] = RemoteKeyCode.KEYCODE_7;
        this.channelskeys[8] = RemoteKeyCode.KEYCODE_8;
        this.channelskeys[9] = RemoteKeyCode.KEYCODE_9;

        this.deviceManager = new DeviceManager(log, config, api);

        this.deviceManager.load();

        this.deviceManager.on('discover', this.discover.bind(this));

        this.adminServer = new AdminServer(this.config.port?this.config.port:8182, this.deviceManager)
        this.adminServer.listen()
            .then(port => {
                this.log.info(`Admin server is running on port ${port}`);
            })
            .catch(e => {
                this.log.error('Failed to launch the admin server:', e.message);
            });

        api.on("didFinishLaunching" , () => {
            this.log.info("didFinishLaunching");

            this.deviceManager.listen();


            this.log.info("end didFinishLaunching");
        });

    }


    discover(device){
        this.log.info("Discover : ", device.toJSON());

        const tvName = device.name;
        const uuid = this.api.hap.uuid.generate('homebridge:androidtv-' + tvName);
        this.log.info(tvName, 'Registering device', uuid);
        this.tvAccessory = new this.api.platformAccessory(tvName, uuid);
        this.tvAccessory.category = device.type;

        this.infoService = this.tvAccessory.getService(this.api.hap.Service.AccessoryInformation);
        this.infoService
            .setCharacteristic(this.api.hap.Characteristic.Manufacturer, "MANUFACTURER")
            .setCharacteristic(this.api.hap.Characteristic.Model, "MODEL")
            .setCharacteristic(this.api.hap.Characteristic.Name, tvName)
            .setCharacteristic(this.api.hap.Characteristic.SerialNumber, uuid)
            .setCharacteristic(this.api.hap.Characteristic.SoftwareRevision, "VERSION")
            .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, PLUGIN_NAME)
            .setCharacteristic(this.api.hap.Characteristic.HardwareRevision, "PLUGIN_AUTHOR");

        const tvService = this.tvAccessory.addService(this.api.hap.Service.Television);
        tvService.setCharacteristic(this.api.hap.Characteristic.ConfiguredName, tvName);
        tvService.setCharacteristic(this.api.hap.Characteristic.SleepDiscoveryMode, this.api.hap.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);
        tvService.setCharacteristic(this.api.hap.Characteristic.PowerModeSelection, this.api.hap.Characteristic.PowerModeSelection.SHOW);

        tvService.getCharacteristic(this.api.hap.Characteristic.Active).onSet((newValue, old) => {
            this.log.info(tvName, 'set Active => setNewValue: ' + newValue);

            if(device.powered !==  (newValue === this.api.hap.Characteristic.Active.ACTIVE)){
                device.android_remote.sendPower();
            }
            tvService.updateCharacteristic(this.api.hap.Characteristic.Active, newValue);
        });

        tvService.getCharacteristic(this.api.hap.Characteristic.Active).on('get', function (callback) {
            this.log.info(tvName, 'get Active', device.powered);
            callback(null, device.powered?this.api.hap.Characteristic.Active.ACTIVE:this.api.hap.Characteristic.Active.INACTIVE);//tvService.updateCharacteristic(this.api.hap.Characteristic.Active, 1);
        }.bind(this));

        this.deviceManager.on('powered', function (device){
            this.log.info(tvName, 'powered', device.powered);
            tvService.updateCharacteristic(this.api.hap.Characteristic.Active,
                device.powered?this.api.hap.Characteristic.Active.ACTIVE:this.api.hap.Characteristic.Active.INACTIVE);
        }.bind(this));

        tvService.getCharacteristic(this.api.hap.Characteristic.RemoteKey)
            .onSet((newValue) => {
                this.log.info(tvName, 'Set RemoteKey ' + newValue);
                device.android_remote.sendKey(this.keys[newValue], RemoteDirection.SHORT);
            });

        const speakerService = this.tvAccessory.addService(this.api.hap.Service.TelevisionSpeaker);
        speakerService
            .setCharacteristic(this.api.hap.Characteristic.Active, this.api.hap.Characteristic.Active.ACTIVE)
            .setCharacteristic(this.api.hap.Characteristic.VolumeControlType, this.api.hap.Characteristic.VolumeControlType.RELATIVE_WITH_CURRENT);

        speakerService.getCharacteristic(this.api.hap.Characteristic.VolumeSelector)
            .onSet((volumeSelector) => {
                this.log.info(tvName, 'set VolumeSelector => setNewValue: ' + volumeSelector);
                if(volumeSelector === this.api.hap.Characteristic.VolumeSelector.INCREMENT){
                    device.android_remote.sendKey(RemoteKeyCode.KEYCODE_VOLUME_UP, RemoteDirection.SHORT);
                }
                else if(volumeSelector === this.api.hap.Characteristic.VolumeSelector.DECREMENT){
                    device.android_remote.sendKey(RemoteKeyCode.KEYCODE_VOLUME_DOWN, RemoteDirection.SHORT);
                }
            });

        speakerService.getCharacteristic(this.api.hap.Characteristic.Volume)
            .on('get', function(callback) {
                let volume = 0 ;
                if(device.volume_max > 0){
                    volume = Math.round(device.volume_current*100/device.volume_max);
                }
                this.log.info(tvName, 'get VolumeSelector ' + volume);
                callback(null, volume);
            }.bind(this));


        this.deviceManager.on('volume', function (device){
            let volume = 0;
            if(device.volume_max > 0){
                volume = Math.round(device.volume_current*100/device.volume_max);
            }
            this.log.info(tvName, 'Device set Volume', volume);
            speakerService.updateCharacteristic(this.api.hap.Characteristic.Volume, volume);
        }.bind(this));


        speakerService.getCharacteristic(this.api.hap.Characteristic.Mute)
            .onSet(function(muted) {
                this.log.info(tvName, 'set Mute => muted: ' + muted);
                device.android_remote.sendKey(RemoteKeyCode.KEYCODE_VOLUME_MUTE,RemoteDirection.SHORT);
                speakerService.updateCharacteristic(this.api.hap.Characteristic.Mute, muted);
            });

        this.deviceManager.on('muted', function (device){
            this.log.info(tvName, 'Device set mute', device.volume_muted);
            speakerService.updateCharacteristic(this.api.hap.Characteristic.Mute, device.volume_muted);
        }.bind(this));

        speakerService.getCharacteristic(this.api.hap.Characteristic.Mute)
            .on("get", function (callback){
                let muted = device.volume_muted;
                this.log.info(tvName, 'get VolumeMutedSelector');
                callback(null, muted);
            }.bind(this));

        let identifier = 0;
        if(this.config.channels){
            for (let channel of this.config.channels){

                const uuid = this.api.hap.uuid.generate('homebridge:androidtv-' + tvName + '-channel-' + channel.name);
                const service = this.tvAccessory.addService(this.api.hap.Service.InputSource, uuid, channel.name);
                this.log.info(tvName, 'Adding channel', channel.name, uuid);

                service.setCharacteristic(this.api.hap.Characteristic.Identifier, identifier)
                service.setCharacteristic(this.api.hap.Characteristic.ConfiguredName, channel.name)
                service.setCharacteristic(this.api.hap.Characteristic.IsConfigured, this.api.hap.Characteristic.IsConfigured.CONFIGURED)
                service.setCharacteristic(this.api.hap.Characteristic.InputSourceType, this.api.hap.Characteristic.InputSourceType.TUNER);
                tvService.addLinkedService(service);
                identifier++;
            }
        }

        if(this.config.keys){
            for (let key of this.config.keys){

                const uuid = this.api.hap.uuid.generate('homebridge:androidtv-' + tvName + '-key-' + key.name);
                const service = this.tvAccessory.addService(this.api.hap.Service.InputSource, uuid, key.name);
                this.log.info(tvName, 'Adding key', key.name, uuid);

                service.setCharacteristic(this.api.hap.Characteristic.Identifier, identifier)
                service.setCharacteristic(this.api.hap.Characteristic.ConfiguredName, key.name)
                service.setCharacteristic(this.api.hap.Characteristic.IsConfigured, this.api.hap.Characteristic.IsConfigured.CONFIGURED)
                service.setCharacteristic(this.api.hap.Characteristic.InputSourceType, this.api.hap.Characteristic.InputSourceType.TUNER);
                tvService.addLinkedService(service);
                identifier++;
            }
        }

        if(this.config.applications){
            for (let application of this.config.applications){
                const uuid = this.api.hap.uuid.generate('homebridge:androidtv-' + tvName + '-application-' + application.name);
                const service = this.tvAccessory.addService(this.api.hap.Service.InputSource, uuid, application.name);
                this.log.info(tvName, 'Adding application', application.name, uuid);
                service.setCharacteristic(this.api.hap.Characteristic.Identifier, identifier)
                service.setCharacteristic(this.api.hap.Characteristic.ConfiguredName, application.name)
                service.setCharacteristic(this.api.hap.Characteristic.IsConfigured, this.api.hap.Characteristic.IsConfigured.CONFIGURED)
                service.setCharacteristic(this.api.hap.Characteristic.InputSourceType, this.api.hap.Characteristic.InputSourceType.APPLICATION);
                tvService.addLinkedService(service);
                identifier++;
            }
        }


        tvService.setCharacteristic(this.api.hap.Characteristic.ActiveIdentifier, 0);

        tvService.getCharacteristic(this.api.hap.Characteristic.ActiveIdentifier)
            .onSet(async (newValue) => {
                let channel_length = 0;
                let key_length = 0;
                if(this.config.channels){
                    channel_length = this.config.channels.length;
                }
                if(this.config.keys){
                    key_length = this.config.keys.length;
                }
                if (newValue < channel_length) {
                    if(this.config.channels){
                        let channel = this.config.channels[newValue];
                        let array = this.splitChannelNumber(channel.number);
                        device.android_remote.sendKey(RemoteKeyCode.KEYCODE_HOME,RemoteDirection.SHORT);
                        await new Promise(resolve => setTimeout(resolve, 500));
                        device.android_remote.sendKey(RemoteKeyCode.KEYCODE_HOME,RemoteDirection.SHORT);
                        await new Promise(resolve => setTimeout(resolve, 500));
                        device.android_remote.sendKey(RemoteKeyCode.KEYCODE_DPAD_CENTER,RemoteDirection.SHORT);
                        await new Promise(resolve => setTimeout(resolve, 500));
                        for (let button of array) {
                            this.log.info(tvName, 'Tap on ' + button + ' ' + this.channelskeys[button]);
                            device.android_remote.sendKey(this.channelskeys[button],RemoteDirection.SHORT);
                        }
                    }
                }
                else if (newValue < (channel_length + key_length)) {
                    if(this.config.keys){
                        let index = newValue - channel_length;
                        let key = this.config.keys[index];
                        let value = RemoteKeyCode[key.key]
                        device.android_remote.sendKey(value,RemoteDirection.SHORT);
                        this.log.info(tvName, 'Tap on ' + key.key + ' ' + RemoteKeyCode[key.key]);
                    }
                }
                else {
                    if(this.config.applications){
                        let index = newValue - channel_length - key_length;
                        let application = this.config.applications[index];
                        this.log.info(tvName, "Sending link " + application.link);
                        device.android_remote.sendAppLink(application.link);
                    }
                }

                this.log.info(tvName, 'set Active Identifier => setNewValue: ' + newValue);
            });

        this.api.publishExternalAccessories(PLUGIN_NAME, [this.tvAccessory]);
    }

    splitChannelNumber(number){
        let string_number = String(number);

        let array = string_number.split('');

        return array;
    }
}


export { AndroidTV };
