import { AndroidTV, PLATFORM_NAME } from './homebridge/platform.js';

export default (api) => {
    api.registerPlatform(PLATFORM_NAME, AndroidTV);
};
