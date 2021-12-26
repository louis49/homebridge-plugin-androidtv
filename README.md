# homebridge-plugin-androidtv

[![npm-version](https://badgen.net/npm/v/homebridge-androidtv)](https://www.npmjs.com/package/homebridge-androidtv)
[![npm-total-downloads](https://badgen.net/npm/dt/homebridge-androidtv)](https://www.npmjs.com/package/homebridge-androidtv)

[Homebridge](https://homebridge.io) plugin for [AndroidTV](https://www.android.com/intl/fr_fr/tv/),
enabling HomeKit support for AndroidTV devices.

Note that this is an unofficial plugin.

## Installation
1. Install Homebridge by following
   [the instructions](https://github.com/homebridge/homebridge/wiki).
2. Install this plugin using [Homebridge Config UI X](https://github.com/oznu/homebridge-config-ui-x), or by running `npm install -g homebridge-androidtv`.
3. Connect to http://localhost:8181 and pair detected devices
4. Enjoy ;-) 

## Configuration
You can configure channels and applications (don't hesitate to create an HomeKit Scene to launch them by voice)

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

Example for populars applications : 
```json
{
   "applications": [
      {"name": "Netflix", "link": "https://www.netflix.com/title.*"},
      {"name": "OQEE", "link": "https://oq.ee/home/"},
      {"name": "Disney+", "link": "https://www.disneyplus.com"},
      {"name": "Amazon Prime", "link": "https://app.primevideo.com"}
   ],
}
```
