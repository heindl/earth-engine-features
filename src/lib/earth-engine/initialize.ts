import ee from '@google/earthengine';
import * as dotenv from 'dotenv';
dotenv.config();

const hasInitialized = new Promise((resolve, reject) => {
  return ee.data.authenticateViaPrivateKey(
    require(process.env.GOOGLE_APPLICATION_CREDENTIALS || ''),
    () => {
      return ee.initialize(
        null,
        null,
        () => {
          resolve();
        },
        reject
      );
    },
    reject
  );
});
export const initializeEarthEngine = async () => {
  await hasInitialized;
  return;
};
