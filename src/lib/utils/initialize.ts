import ee from '@google/earthengine';
import * as dotenv from 'dotenv';
dotenv.config();

export const initialize = async () => {
  const privateKey = require(process.env.SERVICE_ACCOUNT_KEY_PATH || '');
  return new Promise((resolve, reject) => {
    return ee.data.authenticateViaPrivateKey(
      privateKey,
      () => {
        return ee.initialize(null, null, resolve, reject);
      },
      reject
    );
  });
};
