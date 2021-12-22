import tls from "tls";
import { remoteMessageManager } from "./RemoteMessageManager.js";

class RemoteManager {
    constructor(host, port, delegate) {
        this.host = host;
        this.port = port;
        this.delegate = delegate;
        this.chunks = Buffer.from([]);
    }

    async start(certs) {
        return new Promise((resolve, reject) => {
            let options = {
                key : certs.key,
                cert: certs.cert,
                port: this.port,
                host : this.host,
                rejectUnauthorized: false
            }

            console.log("Start Remote Connect");

            this.client = tls.connect(options, function (){
                console.log("Remote connected")
            });

            this.client.remoteManager = this;

            this.client.on("secureConnect", function() {
                console.log("Remote secureConnect");
                resolve(true);
            });

            this.client.on('data', function (data) {
                let buffer = Buffer.from(data);
                this.remoteManager.chunks = Buffer.concat([this.remoteManager.chunks, buffer]);

                if(this.remoteManager.chunks.length > 0 && this.remoteManager.chunks.readInt8(0) === this.remoteManager.chunks.length - 1){

                    let message = remoteMessageManager.parse(this.remoteManager.chunks);

                    if(!message.remotePingRequest){
                        console.log("Receive : " + Array.from(this.remoteManager.chunks));
                        console.log("Receive : " + JSON.stringify(message.toJSON()));
                    }

                    if(message.remoteConfigure){
                        this.remoteManager.client.write(remoteMessageManager.createRemoteConfigure(
                            622,
                            "Build.MODEL",
                            "Build.MANUFACTURER",
                            1,
                            "Build.VERSION.RELEASE",
                            ));
                    }
                    else if(message.remoteSetActive){
                        this.remoteManager.client.write(remoteMessageManager.createRemoteSetActive(622));
                    }
                    else if(message.remotePingRequest){
                        this.remoteManager.client.write(remoteMessageManager.createRemotePingResponse(message.remotePingRequest.val1));
                    }
                    else if(message.remoteImeKeyInject){
                        this.remoteManager.delegate.app(this.remoteManager.host, message.remoteImeKeyInject.appInfo.appPackage);
                    }
                    else if(message.remoteImeBatchEdit){
                        console.log("Receive IME BATCH EDIT" + message.remoteImeBatchEdit);
                    }
                    else if(message.remoteImeShowRequest){
                        console.log("Receive IME SHOW REQUEST" + message.remoteImeShowRequest);
                    }
                    else if(message.remoteVoiceBegin){
                        //console.log("Receive VOICE BEGIN" + message.remoteVoiceBegin);
                    }
                    else if(message.remoteVoicePayload){
                        //console.log("Receive VOICE PAYLOAD" + message.remoteVoicePayload);
                    }
                    else if(message.remoteVoiceEnd){
                        //console.log("Receive VOICE END" + message.remoteVoiceEnd);
                    }
                    else if(message.remoteStart){
                        this.remoteManager.delegate.powered(this.remoteManager.host, message.remoteStart.started);
                    }
                    else if(message.remoteSetVolumeLevel){
                        this.remoteManager.delegate.volume(this.remoteManager.host, message.remoteSetVolumeLevel.volumeLevel, message.remoteSetVolumeLevel.volumeMax, message.remoteSetVolumeLevel.volumeMuted);
                        //console.log("Receive SET VOLUME LEVEL" + message.remoteSetVolumeLevel.toJSON().toString());
                    }
                    else if(message.remoteSetPreferredAudioDevice){
                        //console.log("Receive SET PREFERRED AUDIO DEVICE" + message.remoteSetPreferredAudioDevice);
                    }
                    else{
                        console.log("What else ?");
                    }
                    this.remoteManager.chunks = Buffer.from([]);
                }
            });

            this.client.on('close', function(hasError) {
                console.log("Remote Connection closed " + hasError);
            });

            this.client.on('end', function(hasError) {
                console.log("Remote Connection ended " + hasError);
            });

            this.client.on('error', function(error) {
                console.error(error);
                resolve(error.code)
            });
        });

    }

    sendPower(){
        this.client.write(remoteMessageManager.createRemoteKeyInject(
            remoteMessageManager.RemoteDirection.SHORT,
            remoteMessageManager.RemoteKeyCode.POWER));
    }

    sendKey(key){
        this.client.write(remoteMessageManager.createRemoteKeyInject(
            remoteMessageManager.RemoteDirection.SHORT,
            key));
    }
}

//let remote = new RemoteManager();

export { RemoteManager };
