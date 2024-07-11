export function verifyFingerprint(fingerprint: string) {
  return new Promise<{success: boolean}>((resolve, reject) => {
    // Mock implementation, replace with actual verification logic
    if (fingerprint === 'validFingerprint') {
      resolve({success: true});
    } else {
      reject(new Error('Invalid fingerprint'));
    }
  });
}
