package io.mosip.residentapp;

import android.Manifest;
import android.content.Context;
import android.util.Log;
import android.util.Base64;

import androidx.annotation.NonNull;

import com.aratek.trustfinger.sdk.DeviceOpenListener;
import com.aratek.trustfinger.sdk.FingerPosition;
import com.aratek.trustfinger.sdk.LedIndex;
import com.aratek.trustfinger.sdk.LedStatus;
import com.aratek.trustfinger.sdk.SecurityLevel;
import com.aratek.trustfinger.sdk.TrustFinger;
import com.aratek.trustfinger.sdk.TrustFingerDevice;
import com.aratek.trustfinger.sdk.TrustFingerException;
import com.aratek.trustfinger.sdk.VerifyResult;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.List;
import io.mosip.residentapp.bean.FingerData;

@ReactModule(name = TrustFingerReactNativeModule.NAME)
public class TrustFingerReactNativeModule extends ReactContextBaseJavaModule {
    public static final String NAME = "TrustFingerReactNativeModule";

    private TrustFinger mTrustFinger;
    private TrustFingerDevice mTrustFingerDevice;
    private static final String FINGERPRINT_DATA_FILE = "fingerprint_feature_data.bin";

    private static final String[] REQUIRED_PERMISSIONS = new String[]{
            Manifest.permission.BLUETOOTH,
            Manifest.permission.BLUETOOTH_ADMIN,
            Manifest.permission.ACCESS_WIFI_STATE,
            Manifest.permission.CHANGE_WIFI_STATE,
            Manifest.permission.CHANGE_WIFI_MULTICAST_STATE,
            Manifest.permission.WRITE_EXTERNAL_STORAGE,
            Manifest.permission.READ_EXTERNAL_STORAGE
    };

    public TrustFingerReactNativeModule(ReactApplicationContext reactContext) {
        super(reactContext);
        mTrustFinger = TrustFinger.getInstance(reactContext);
        initTrustFinger(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    private void initTrustFinger(Context context) {
        try {
            mTrustFinger.initialize();
            List<String> deviceList = mTrustFinger.getDeviceList();
            if (deviceList != null && !deviceList.isEmpty()) {
                int deviceIndex = 0;
                mTrustFinger.openDevice(deviceIndex, new DeviceOpenListener() {
                    @Override
                    public void openSuccess(TrustFingerDevice device) {
                        mTrustFingerDevice = device;
                        Log.i(NAME, "Device opened successfully: " + device.toString());
                    }

                    @Override
                    public void openFail(String error) {
                        Log.e(NAME, "Device open failed: " + error);
                    }
                });
            } else {
                Log.e(NAME, "No devices found");
            }
        } catch (TrustFingerException e) {
            e.printStackTrace();
        }
    }

    @ReactMethod
    public void getSdkJarVersion(Promise promise) {
        try {
            String version = mTrustFinger.getSdkJarVersion();

            promise.resolve(version);
        } catch (TrustFingerException e) {
            promise.reject("E_VERSION", "Error fetching SDK version", e);
        }
    }
    

    @ReactMethod
    public void captureBiometricData(Promise promise) {
        try {
            if (mTrustFingerDevice != null) {
                mTrustFingerDevice.setLedStatus(LedIndex.GREEN, LedStatus.OPEN);
                byte[] rawData;
                int imageQuality;
                do {
                    rawData = mTrustFingerDevice.captureRawData();
                    imageQuality = mTrustFingerDevice.rawDataQuality(rawData);
                    if (imageQuality <= Config.minQualityTh) {
                        continue;
                    }
                    try {
                        Thread.sleep(50);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                } while (imageQuality <= Config.minQualityTh);

                mTrustFingerDevice.setLedStatus(LedIndex.GREEN, LedStatus.CLOSE);

                byte[] fpFeatureData = mTrustFingerDevice.extractFeature(rawData, FingerPosition.RightThumb);
                writeToFile(fpFeatureData, FINGERPRINT_DATA_FILE);
                String base64FeatureData = Base64.encodeToString(fpFeatureData, Base64.DEFAULT);
                promise.resolve(base64FeatureData);
            } else {
                promise.reject("E_CAPTURE", "TrustFingerDevice is not initialized.");
            }
        } catch (TrustFingerException e) {
            promise.reject("E_CAPTURE", "Error capturing raw data", e);
        }
    }

    @ReactMethod
    public void verifyBiometricData(String base64FeatureData, Promise promise) {
        try {
            if (mTrustFingerDevice != null) {
                mTrustFingerDevice.setLedStatus(LedIndex.GREEN, LedStatus.OPEN);
                byte[] rawData;
                int imageQuality;
                do {
                    rawData = mTrustFingerDevice.captureRawData();
                    imageQuality = mTrustFingerDevice.rawDataQuality(rawData);
                    if (imageQuality <= Config.minQualityTh) {
                        continue;
                    }
                    try {
                        Thread.sleep(50);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                } while (imageQuality <= Config.minQualityTh);

                mTrustFingerDevice.setLedStatus(LedIndex.GREEN, LedStatus.CLOSE);

                byte[] fpFeatureData = mTrustFingerDevice.extractFeature(rawData, FingerPosition.RightThumb);
                byte[] rightThumbTemplate = fpFeatureData; // Assuming fpFeatureData is correct

                byte[] storedFeatureData = Base64.decode(base64FeatureData, Base64.DEFAULT);
                byte[] storedTemplateData = mTrustFingerDevice.generalizeTemplate(
                    storedFeatureData, storedFeatureData, storedFeatureData);

                if (storedTemplateData != null) {
                    VerifyResult result = mTrustFingerDevice.verify(SecurityLevel.Level4, storedTemplateData, rightThumbTemplate);
                    if (result.isMatched) {
                        promise.resolve("Fingerprint verification successful");
                    } else {
                        promise.resolve("Fingerprint verification failed");
                    }
                } else {
                    promise.reject("E_VERIFY", "Failed to generalize stored feature data");
                }
            } else {
                promise.reject("E_VERIFY", "TrustFingerDevice is not initialized.");
            }
        } catch (TrustFingerException e) {
            promise.reject("E_VERIFY", "Error verifying biometric data", e);
        }
    }

    private void writeToFile(byte[] data, String fileName) {
        try (FileOutputStream fos = new FileOutputStream(new File(getReactApplicationContext().getExternalFilesDir(null), fileName))) {
            fos.write(data);
            Log.i(NAME, "Data written to file successfully: " + fileName);
        } catch (IOException e) {
            Log.e(NAME, "Error writing data to file", e);
        }
    }

    private byte[] readFromFile(String fileName) {
        File file = new File(getReactApplicationContext().getExternalFilesDir(null), fileName);
        byte[] data = new byte[(int) file.length()];
        try (FileInputStream fis = new FileInputStream(file)) {
            fis.read(data);
            Log.i(NAME, "Data read from file successfully: " + fileName);
        } catch (IOException e) {
            Log.e(NAME, "Error reading data from file", e);
            return null;
        }
        return data;
    }
}
