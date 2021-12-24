const Devices = {
    mounted() {
        axios.get('http://localhost:8181/api/devices').then((response) => (this.devices = response.data));
    },
    data() {
        return {
            devices: [],
            columns:["host", "name", "online", "paired", "started", "powered", "app_package_current"],
            code: ""
        }
    },
    methods: {
        pair: function (device){
            console.log('Pair ' + device.host);
            device.pairing = true;
            axios.put('api/devices/' + device.host + '/pair').then((response) => {
                console.log('Paired');
            });
        },
        send_code: function (device){
            console.log('sendCode ' + device.host + ' ' + this.code);
            axios.put('http://localhost:8181/api/devices/' + device.host + '/secret', {code:this.code}).then((response) => {
                this.devices[device.host] = response.data;
                this.code = "";
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
        }
    }
}


Vue.createApp(Devices).mount('#devices')
