import { AdminServer } from "./admin/index.js"
import { deviceManager } from "./DeviceManager.js"
import { PLUGIN_NAME, PLATFORM_NAME } from './settings.js'
import {remoteMessageManager} from "../remote/RemoteMessageManager.js";

class AndroidTV {

    constructor(log, config, api) {

        this.log = log;
        this.config = config;
        this.api = api;
        this.keys = {};


        this.keys[this.api.hap.Characteristic.RemoteKey.REWIND] = remoteMessageManager.RemoteKeyCode.BACKWARD;
        this.keys[this.api.hap.Characteristic.RemoteKey.FAST_FORWARD] =  remoteMessageManager.RemoteKeyCode.FORWARD;
        this.keys[this.api.hap.Characteristic.RemoteKey.NEXT_TRACK ] =  remoteMessageManager.RemoteKeyCode.NEXT;
        this.keys[this.api.hap.Characteristic.RemoteKey.PREVIOUS_TRACK ] =  remoteMessageManager.RemoteKeyCode.PREVIOUS;
        this.keys[this.api.hap.Characteristic.RemoteKey.ARROW_UP] =  remoteMessageManager.RemoteKeyCode.UP;
        this.keys[this.api.hap.Characteristic.RemoteKey.ARROW_DOWN] =  remoteMessageManager.RemoteKeyCode.DOWN;
        this.keys[this.api.hap.Characteristic.RemoteKey.ARROW_LEFT] =  remoteMessageManager.RemoteKeyCode.LEFT;
        this.keys[this.api.hap.Characteristic.RemoteKey.ARROW_RIGHT] =  remoteMessageManager.RemoteKeyCode.RIGHT;
        this.keys[this.api.hap.Characteristic.RemoteKey.SELECT] =  remoteMessageManager.RemoteKeyCode.OK;
        this.keys[this.api.hap.Characteristic.RemoteKey.BACK] =  remoteMessageManager.RemoteKeyCode.BACK;// TO_CHECK
        this.keys[this.api.hap.Characteristic.RemoteKey.EXIT] =  remoteMessageManager.RemoteKeyCode.OK;// TO_CHECK
        this.keys[this.api.hap.Characteristic.RemoteKey.PLAY_PAUSE] = remoteMessageManager.RemoteKeyCode.PLAY;
        this.keys[this.api.hap.Characteristic.RemoteKey.INFORMATION] = remoteMessageManager.RemoteKeyCode.SETTINGS;// TO_CHECK

        this.channelskeys = {};
        this.channelskeys[0] = remoteMessageManager.RemoteKeyCode.BUTTON0;
        this.channelskeys[1] = remoteMessageManager.RemoteKeyCode.BUTTON1;
        this.channelskeys[2] = remoteMessageManager.RemoteKeyCode.BUTTON2;
        this.channelskeys[3] = remoteMessageManager.RemoteKeyCode.BUTTON3;
        this.channelskeys[4] = remoteMessageManager.RemoteKeyCode.BUTTON4;
        this.channelskeys[5] = remoteMessageManager.RemoteKeyCode.BUTTON5;
        this.channelskeys[6] = remoteMessageManager.RemoteKeyCode.BUTTON6;
        this.channelskeys[7] = remoteMessageManager.RemoteKeyCode.BUTTON7;
        this.channelskeys[8] = remoteMessageManager.RemoteKeyCode.BUTTON8;
        this.channelskeys[9] = remoteMessageManager.RemoteKeyCode.BUTTON9;

        deviceManager.load();
        deviceManager.on('discover', this.discover.bind(this));

        this.adminServer = new AdminServer()
        this.adminServer.listen()
            .then(port => {
                this.log.info(`Admin server is running on port ${port}`);
            })
            .catch(e => {
                this.log.error('Failed to launch the admin server:', e.message);
            });

        api.on("didFinishLaunching" , () => {
            this.log.info("didFinishLaunching");

            deviceManager.listen();


            this.log.info("end didFinishLaunching");
        });

    }


    discover(device){
        console.log("Discover : ", device.toJSON());

        const tvName = device.name;
        const uuid = this.api.hap.uuid.generate('homebridge:androidtv-' + tvName);
        this.tvAccessory = new this.api.platformAccessory(tvName, uuid);
        this.tvAccessory.category = this.api.hap.Categories.TV_SET_TOP_BOX;

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
            this.log.info('set Active => setNewValue: ' + newValue);

            if(device.getPowered() !==  (newValue === this.api.hap.Characteristic.Active.ACTIVE)){
                device.remoteManager.sendPower();
            }
            tvService.updateCharacteristic(this.api.hap.Characteristic.Active, newValue);
        });

        tvService.getCharacteristic(this.api.hap.Characteristic.Active).on('get', function (callback) {
            this.log.info('get Active', device.getStarted());
            callback(null, device.getStarted()?this.api.hap.Characteristic.Active.ACTIVE:this.api.hap.Characteristic.Active.INACTIVE);//tvService.updateCharacteristic(this.api.hap.Characteristic.Active, 1);
        }.bind(this));

        deviceManager.on('powered', function (device){
            this.log.info('powered', device.getStarted());
            tvService.updateCharacteristic(this.api.hap.Characteristic.Active,
                device.getPowered()?this.api.hap.Characteristic.Active.ACTIVE:this.api.hap.Characteristic.Active.INACTIVE);
        }.bind(this));

        tvService.getCharacteristic(this.api.hap.Characteristic.RemoteKey)
            .onSet((newValue) => {
                this.log.info('Set RemoteKey ' + newValue);
                device.remoteManager.sendKey(this.keys[newValue]);
            });

        // On gère le volume
        const speakerService = this.tvAccessory.addService(this.api.hap.Service.TelevisionSpeaker);
        speakerService
            .setCharacteristic(this.api.hap.Characteristic.Active, this.api.hap.Characteristic.Active.ACTIVE)
            .setCharacteristic(this.api.hap.Characteristic.VolumeControlType, this.api.hap.Characteristic.VolumeControlType.RELATIVE_WITH_CURRENT);

        speakerService.getCharacteristic(this.api.hap.Characteristic.VolumeSelector)
            .onSet((volumeSelector) => {
                this.log.info('set VolumeSelector => setNewValue: ' + volumeSelector);
                if(volumeSelector === this.api.hap.Characteristic.VolumeSelector.INCREMENT){
                    device.remoteManager.sendKey(remoteMessageManager.RemoteKeyCode.VOLUME_UP);
                }
                else if(volumeSelector === this.api.hap.Characteristic.VolumeSelector.DECREMENT){
                    device.remoteManager.sendKey(remoteMessageManager.RemoteKeyCode.VOLUME_DOWN);
                }
            });

        speakerService.getCharacteristic(this.api.hap.Characteristic.Volume)
            .on('get', function(callback) {
                let volume = Math.round(device.getVolumeCurrent()*100/device.getVolumeMax());
                this.log.info('get VolumeSelector ' + volume);
                callback(null, volume);
            }.bind(this));

        deviceManager.on('volume', function (device){
            let volume = Math.round(device.getVolumeCurrent()*100/device.getVolumeMax());
            this.log.info('volume', volume);
            tvService.updateCharacteristic(this.api.hap.Characteristic.Volume, volume);
        }.bind(this));

        speakerService.getCharacteristic(this.api.hap.Characteristic.Volume)
            .onSet(function(muted) {
                device.remoteManager.sendKey(remoteMessageManager.RemoteKeyCode.MUTE);
                speakerService.updateCharacteristic(this.api.hap.Characteristic.Mute, muted);
            });

        deviceManager.on('muted', function (device){
            this.log.info('muted', device.getVolumeMuted());
            tvService.updateCharacteristic(this.api.hap.Characteristic.Mute, device.getVolumeMuted());
        }.bind(this));


        speakerService.getCharacteristic(this.api.hap.Characteristic.Mute)
            .on("get", function (callback){
                let volume = device.getVolumeMuted();
                this.log.info('get VolumeMutedSelector');
                callback(null, volume);
            }.bind(this));

        let identifier = 0;
        for (let channel of this.config.channels){
            const uuid = this.api.hap.uuid.generate('homebridge:androidtv-channel-' + channel.name);
            const service = this.tvAccessory.addService(this.api.hap.Service.InputSource, uuid, channel.name);

            service.setCharacteristic(this.api.hap.Characteristic.Identifier, identifier)
            service.setCharacteristic(this.api.hap.Characteristic.ConfiguredName, channel.name)
            service.setCharacteristic(this.api.hap.Characteristic.IsConfigured, this.api.hap.Characteristic.IsConfigured.CONFIGURED)
            service.setCharacteristic(this.api.hap.Characteristic.InputSourceType, this.api.hap.Characteristic.InputSourceType.TUNER);
            tvService.addLinkedService(service);
            identifier++;
        }

        for (let application of this.config.applications){
            const uuid = this.api.hap.uuid.generate('homebridge:androidtv-application-' + application.name);
            const service = this.tvAccessory.addService(this.api.hap.Service.InputSource, uuid, application.name);
            service.setCharacteristic(this.api.hap.Characteristic.Identifier, identifier)
            service.setCharacteristic(this.api.hap.Characteristic.ConfiguredName, application.name)
            service.setCharacteristic(this.api.hap.Characteristic.IsConfigured, this.api.hap.Characteristic.IsConfigured.CONFIGURED)
            service.setCharacteristic(this.api.hap.Characteristic.InputSourceType, this.api.hap.Characteristic.InputSourceType.APPLICATION);
            tvService.addLinkedService(service);
            identifier++;
        }

        tvService.setCharacteristic(this.api.hap.Characteristic.ActiveIdentifier, -1);

        tvService.getCharacteristic(this.api.hap.Characteristic.ActiveIdentifier)
            .onSet((newValue) => {
                // Ca va servir à changer de chaine...
                if(newValue < this.config.channels.length){
                    let channel = this.config.channels[newValue];
                    let array = this.splitChannelNumber(channel.number);

                    device.remoteManager.sendKey(remoteMessageManager.RemoteKeyCode.BACK);
                    device.remoteManager.sendKey(remoteMessageManager.RemoteKeyCode.OK);
                    device.remoteManager.sendKey(remoteMessageManager.RemoteKeyCode.OK);
                    for (let button of array){
                        this.log.info('Appui sur ' + button + ' ' + this.channelskeys[button]);
                        device.remoteManager.sendKey(this.channelskeys[button]);
                    }
                }
                else{
                    // Il s'agit d'une application
                    device.remoteManager.sendKey(remoteMessageManager.RemoteKeyCode.BACK);
                    device.remoteManager.sendKey(remoteMessageManager.RemoteKeyCode.OK);
                    let index = newValue - this.config.channels.length;
                    let application = this.config.applications[index];
                    this.log.info('Envoi de " + application.link');
                    device.remoteManager.sendAppLink(application.link);
                }


                this.log.info('set Active Identifier => setNewValue: ' + newValue);
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
