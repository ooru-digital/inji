package io.mosip.residentapp;

import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.aratek.trustfinger.sdk.TrustFinger;
import com.aratek.trustfinger.sdk.TrustFingerException;
import com.aratek.trustfinger.sdk.TrustFingerDevice;


public class TrustFingerReactNativeModule extends ReactContextBaseJavaModule {

    private static ReactApplicationContext reactContext;
    private TrustFinger mTrustFinger;

    TrustFingerReactNativeModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
        mTrustFinger = TrustFinger.getInstance(reactContext);
    }

    @Override
    public String getName() {
        return "TrustFingerReactNativeModule";
    }

    @ReactMethod
    public void getSdkJarVersion(Promise promise) {
        try {
            String sdkJarVersion = mTrustFinger.getSdkJarVersion();
            promise.resolve(sdkJarVersion);
        } catch (Exception e) {
            promise.reject("Error", e);
        }
    }

    @ReactMethod
    public void initialize(Promise promise) {
        try {
            mTrustFinger.initialize();
            promise.resolve("Initialized");
        } catch (Exception e) {
            promise.reject("Initialization Error", e);
        }
    }

//    @ReactMethod
//    public void getAppVersion(Promise promise) {
//        try {
//            PackageInfo packageInfo = reactContext.getPackageManager().getPackageInfo(reactContext.getPackageName(), 0);
//            String version = "Version: " + packageInfo.versionName + "." + packageInfo.versionCode;
//            promise.resolve(version);
//        } catch (PackageManager.NameNotFoundException e) {
//            promise.reject("Package Error", e);
//        }
//    }
}




