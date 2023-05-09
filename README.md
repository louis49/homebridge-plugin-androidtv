# homebridge-plugin-androidtv
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![npm-version](https://badgen.net/npm/v/homebridge-androidtv)](https://www.npmjs.com/package/homebridge-androidtv)
[![npm-total-downloads](https://badgen.net/npm/dt/homebridge-androidtv)](https://www.npmjs.com/package/homebridge-androidtv)

[![Donate](https://badgen.net/badge/paypal/donate?icon=https://simpleicons.now.sh/paypal/fff)](https://www.paypal.com/donate/?hosted_button_id=B8NGNPFGK69BY)
[![Donate](https://badgen.net/badge/buymeacoffee/donate?icon=https://simpleicons.now.sh/buymeacoffee/fff)](https://www.buymeacoffee.com/louis49github)

[Homebridge](https://homebridge.io) plugin for [AndroidTV](https://www.android.com/intl/fr_fr/tv/),
enabling HomeKit support for AndroidTV devices.

Note that this is an unofficial plugin.

## Installation
1. Install Homebridge by following
   [the instructions](https://github.com/homebridge/homebridge/wiki).
2. Install this plugin using [Homebridge Config UI X](https://github.com/oznu/homebridge-config-ui-x), or by running `npm install -g homebridge-androidtv`.
3. Connect to [http://localhost:8182](http://localhost:8182) and pair detected devices with shown secret code
4. On HomeKit app tap on 'Add accessory'
5. Enjoy ;-) 

## Configuration
You can configure channels, keys and applications (don't hesitate to create an HomeKit Scene to launch them by voice)

For channels, we always consider TV App as the first on the list channel shown after a 'Home' tap on regular remote

Example for French TV :

```json
{
   "channels": [
      {"name": "TF1", "number": 1}, 
      {"name": "France 2", "number": 2}, 
      {"name": "France 3", "number": 3}, 
      {"name": "France 5", "number": 5}, 
      {"name": "M6", "number": 6}, 
      {"name": "Arte", "number": 7}, 
      {"name": "LCP", "number": 13}, 
      {"name": "BMF TV", "number": 15},
      {"name": "CNEWS", "number": 16}, 
      {"name": "LCI", "number": 26}, 
      {"name": "France Info", "number": 27}
   ]
}
```

Example for keys : 


```json
{
   "keys": [
      {"name": "Power", "key": "KEYCODE_POWER"},
      {"name": "VolUp", "key": "KEYCODE_VOLUME_UP"},
      {"name": "VolDown", "key": "KEYCODE_VOLUME_DOWN"},
      {"name": "Home", "key": "KEYCODE_HOME"},
      {"name": "Mute", "key": "KEYCODE_MUTE"}
   ]
}
```

Replace "Info" button on the remote:

```json
{
   "infoKeyOverride": "KEYCODE_HOME"
}
```

Key code are listed here:
* [android.com/reference/android/view/KeyEvent](https://developer.android.com/reference/android/view/KeyEvent?hl=fr)
* [androidtv-remote/src/remote/remotemessage.proto#L88](https://github.com/louis49/androidtv-remote/blob/6ff7a73f2db53da4129c809cde9c616b9babde72/src/remote/remotemessage.proto#L88)


Example for populars applications : 
```json
{
   "applications": [
      {"name": "Netflix", "link": "https://www.netflix.com/title.*"},
      {"name": "OQEE", "link": "https://oq.ee/home/"},
      {"name": "Disney+", "link": "https://www.disneyplus.com"},
      {"name": "Amazon Prime", "link": "https://app.primevideo.com"},
      {"name": "Salto", "link": "https://www.salto.fr"}
   ]
}
```

You can find in Wiki a [french TV by Free configuration](https://github.com/louis49/homebridge-plugin-androidtv/wiki/French-TV-by-Free-(OQEE)-configuration)
