import {NativeModules} from 'react-native';

export const verifyFingerprint = async (fingerprint: string) => {
  const {TrustFingerReactNativeModule} = NativeModules;

  if (!fingerprint) {
    console.error('No fingerprint data to verify');
    return;
  }
  try {
    const result = await TrustFingerReactNativeModule.verifyBiometricData(
      fingerprint,
    );
    console.log('in the verify finger .ts >>> ', result);

    return result;
  } catch (error) {
    console.error('Error verifying fingerprint data:', error);
  }
};
