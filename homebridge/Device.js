import { PairingManager } from "../remote/PairingManager.js";
import { RemoteManager } from "../remote/RemoteManager.js";

class Device {

    constructor(host, name) {
        this.host = host;
        this.name = name;
        this.paired = false;
        this.pairing = false;
        this.online = false;
        this.powered = false;
        this.cert = "";
        this.key = "";
        this.started = false;
        this.volume_current = 0;
        this.volume_max = 0;
        this.volume_muted = false;
        this.app_package_current = "";
        this.pairingManager = new PairingManager(host, 6467);
        this.remoteManager = new RemoteManager(host, 6466, null);
    }

    getPairingManager(){
        return this.pairingManager;
    }

    getRemoteManager(){
        return this.remoteManager;
    }

    getHost(){
        return this.host;
    }

    setHost(host){
        this.host = host;
    }

    getName(){
        return this.name;
    }

    setName(name){
        this.name = name;
    }

    getPaired() {
        return this.paired;
    }

    setPaired(paired) {
        this.paired = paired;
    }

    getPairing() {
        return this.pairing;
    }

    setPairing(pairing) {
        this.pairing = pairing;
    }

    getOnline(){
        return this.online;
    }

    setOnline(online){
        this.online = online;
    }

    getPowered(){
        return this.powered;
    }

    setPowered(powered){
        this.powered = powered;
    }

    getCert(){
        return this.cert;
    }

    setCert(cert){
        this.cert = cert;
    }

    getKey(){
        return this.key;
    }

    setKey(key){
        this.key = key;
    }

    getStarted() {
        return this.started;
    }

    setStarted(started){
        this.started = started;
    }

    getVolumeCurrent(){
        return this.volume_current;
    }

    setVolumeCurrent(volume_current){
        this.volume_current = volume_current;
    }

    getVolumeMax(){
        return this.volume_max;
    }

    setVolumeMax(volume_max){
        this.volume_max = volume_max;
    }

    getVolumeMuted(){
        return this.volume_muted;
    }

    setVolumeMuted(volume_muted){
        this.volume_muted = volume_muted;
    }

    getAppPackageCurrent(){
        return this.app_package_current;
    }

    setAppPackageCurrent(app_package_current){
        this.app_package_current = app_package_current;
    }

    toJSONSaver(){
        return {
            host: this.host,
            name: this.name,
            paired : this.paired,
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
        }
    }
}

export { Device };