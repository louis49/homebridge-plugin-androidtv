import { AdminServer } from "./admin/index.js"
import { deviceManager } from "./DeviceManager.js"
import { PLUGIN_NAME } from './settings.js'
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
        this.keys[this.api.hap.Characteristic.RemoteKey.BACK] =  remoteMessageManager.RemoteKeyCode.OK;// TO_CHECK
        this.keys[this.api.hap.Characteristic.RemoteKey.EXIT] =  remoteMessageManager.RemoteKeyCode.OK;// TO_CHECK
        this.keys[this.api.hap.Characteristic.RemoteKey.PLAY_PAUSE] = remoteMessageManager.RemoteKeyCode.PLAY;
        this.keys[this.api.hap.Characteristic.RemoteKey.INFORMATION] = remoteMessageManager.RemoteKeyCode.UNKNOWN_KEY;// TO_CHECK

        deviceManager.load();
        deviceManager.on('discover', this.discover);

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
        this.tvAccessory = new api.platformAccessory(tvName, uuid);
        this.tvAccessory.category = this.api.hap.Categories.TV_SET_TOP_BOX;

        this.infoService = this.tvAccessory.getService(this.api.hap.Service.AccessoryInformation);
        this.infoService
            .setCharacteristic(this.api.hap.Characteristic.Manufacturer, "MANUFACTURER")
            .setCharacteristic(this.api.hap.Characteristic.Model, "MODEL")
            .setCharacteristic(this.api.hap.Characteristic.Name, tvName)
            .setCharacteristic(this.api.hap.Characteristic.SerialNumber, uuid)
            .setCharacteristic(this.api.hap.Characteristic.SoftwareRevision, "VERSION")
            .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, PLUGIN_NAME)
            .setCharacteristic(this.api.hap.Characteristic.HardwareRevision, PLUGIN_AUTHOR);

        const tvService = this.tvAccessory.addService(this.api.hap.Service.Television);
        tvService.setCharacteristic(this.api.hap.Characteristic.ConfiguredName, tvName);
        tvService.setCharacteristic(this.api.hap.Characteristic.SleepDiscoveryMode, this.api.hap.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);

        tvService.getCharacteristic(this.api.hap.Characteristic.Active).onSet((newValue) => {
                this.log.info('set Active => setNewValue: ' + newValue);
                tvService.updateCharacteristic(this.api.hap.Characteristic.Active, 1);
            });

        tvService.setCharacteristic(this.api.hap.Characteristic.ActiveIdentifier, 1);

        tvService.getCharacteristic(this.api.hap.Characteristic.ActiveIdentifier)
            .onSet((newValue) => {
                // Ca va servir à changer de chaine...
                this.log.info('set Active Identifier => setNewValue: ' + newValue);
            });

        tvService.getCharacteristic(this.api.hap.Characteristic.RemoteKey)
            .onSet((newValue) => {
                device.remoteManager.sendKey(this.keys[newValue]);
            });

        const speakerService = this.tvAccessory.addService(this.api.hap.Service.TelevisionSpeaker);

        speakerService
            .setCharacteristic(this.api.hap.Characteristic.Active, this.api.hap.Characteristic.Active.ACTIVE)
            .setCharacteristic(this.api.hap.Characteristic.VolumeControlType, this.api.hap.Characteristic.VolumeControlType.RELATIVE);

        speakerService.getCharacteristic(this.api.hap.Characteristic.VolumeSelector)
            .onSet((newValue) => {
                this.log.info('set VolumeSelector => setNewValue: ' + newValue);
            });

        speakerService.getCharacteristic(this.api.hap.Characteristic.Mute)
            .on("get", function (){
                return device.getVolumeMuted();
            });

        // Trouver API Liste des chaines => FreeServer ?
        // https://alloforfait.fr/tv/free
        const netflixInputService = this.tvAccessory.addService(this.api.hap.Service.InputSource, 'netflix', 'Netflix');
        netflixInputService
            .setCharacteristic(this.api.hap.Characteristic.Identifier, 3)
            .setCharacteristic(this.api.hap.Characteristic.ConfiguredName, 'Netflix')
            .setCharacteristic(this.api.hap.Characteristic.IsConfigured, this.api.hap.Characteristic.IsConfigured.CONFIGURED)
            .setCharacteristic(this.api.hap.Characteristic.InputSourceType, this.api.hap.Characteristic.InputSourceType.HDMI);
        tvService.addLinkedService(netflixInputService); // link to tv service

        this.api.publishExternalAccessories(PLUGIN_NAME, [this.tvAccessory]);
    }
}


export { AndroidTV };
