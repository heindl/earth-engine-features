import ee from '@google/earthengine';

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
