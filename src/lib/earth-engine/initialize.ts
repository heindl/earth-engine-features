import ee from '@google/earthengine';
import * as dotenv from 'dotenv';
dotenv.config();

let hasInitialized = false;
export const initializeEarthEngine = async () => {
  if (hasInitialized) {
    return;
  }
  return new Promise((resolve, reject) => {
    return ee.data.authenticateViaPrivateKey(
      require(process.env.GOOGLE_APPLICATION_CREDENTIALS || ''),
      () => {
        return ee.initialize(
          null,
          null,
          () => {
            hasInitialized = true;
            resolve();
          },
          reject
        );
      },
      reject
    );
  });
};
