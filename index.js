import { PLATFORM_NAME } from './homebridge/settings.js';
import { AndroidTV } from './homebridge/platform.js';

export default (api) => {
    api.registerPlatform(PLATFORM_NAME, AndroidTV);
};
