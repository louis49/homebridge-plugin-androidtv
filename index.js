import { PLATFORM_NAME } from './homebridge/settings.js';
import { AndroidTV } from './homebridge/platform.js';
import { ExampleTelevisionPlugin } from './homebridge/platform-test.js';

export default (api) => {
    api.registerPlatform(PLATFORM_NAME, AndroidTV);
    //api.registerPlatform(PLATFORM_NAME, ExampleTelevisionPlugin)
};
