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


        const hdmi1InputService = this.tvAccessory.addService(this.api.hap.Service.InputSource, 'hdmi1', 'HDMI 1');
        hdmi1InputService
            .setCharacteristic(this.api.hap.Characteristic.Identifier, 1)
            .setCharacteristic(this.api.hap.Characteristic.ConfiguredName, 'HDMI 1')
            .setCharacteristic(this.api.hap.Characteristic.IsConfigured, this.api.hap.Characteristic.IsConfigured.CONFIGURED)
            .setCharacteristic(this.api.hap.Characteristic.InputSourceType, this.api.hap.Characteristic.InputSourceType.TUNER)
            .setCharacteristic(this.api.hap.Characteristic.TargetVisibilityState, this.api.hap.Characteristic.TargetVisibilityState.SHOWN);
        hdmi1InputService.getCharacteristic(this.api.hap.Characteristic.InputDeviceType).on('get', function (callback){
            this.log.info('get InputDeviceType');
            callback(this.api.hap.Characteristic.InputDeviceType.TV)
        }.bind(this));

        tvService.addLinkedService(hdmi1InputService); // link to tv service

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

        tvService.setCharacteristic(this.api.hap.Characteristic.ActiveIdentifier, 1);

        tvService.getCharacteristic(this.api.hap.Characteristic.ActiveIdentifier)
            .onSet((newValue) => {
                // Ca va servir à changer de chaine...
                this.log.info('set Active Identifier => setNewValue: ' + newValue);
            });


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


        this.api.publishExternalAccessories(PLUGIN_NAME, [this.tvAccessory]);
    }

}


export { AndroidTV };
