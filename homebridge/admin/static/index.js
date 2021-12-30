const Devices = {
    mounted() {
        axios.get('http://localhost:8181/api/devices').then((response) => (this.devices = response.data));
    },
    data() {
        return {
            devices: [],
            columns:["host", "name", "online", "paired", "started", "powered", "app_package_current", "type"],
            code: "",
            types: [
                { text: 'TELEVISION', value: '31'},
                { text: 'SET TOP BOX', value: '35'},
            ]
        }
    },
    methods: {
        pair: function (device){
            console.log('Pair ' + device.host);
            device.pairing = true;
            axios.put('api/devices/' + device.host + '/pair').then((response) => {
                console.log('Paired', response);
                this.devices[device.host] = response.data;
            });
        },
        send_code: function (device){
            console.log('sendCode ' + device.host + ' ' + this.code);
            axios.put('http://localhost:8181/api/devices/' + device.host + '/secret', {code:this.code}).then((response) => {
                this.devices[device.host] = response.data;
                this.code = "";
                console.log('Code received', response);
            });
        },
        start: function (device){
            console.log('Start ' + device.host);
            axios.put('http://localhost:8181/api/devices/' + device.host + '/start', {code:this.code}).then((response) => {
                this.devices[device.host] = response.data;
            });
        },
        power: function (device){
            console.log('Send Power ' + device.host);
            axios.get('http://localhost:8181/api/devices/' + device.host + '/power').then((response) => {

            });
        },
        set_type: function (device){
            console.log('Send Type ' + device.type);
            axios.put('http://localhost:8181/api/devices/' + device.host + '/type', {type:device.type}).then((response) => {
                this.devices[device.host] = response.data;
                console.log('Type changed', response);
            });

        }
    }
}


Vue.createApp(Devices).mount('#devices')
