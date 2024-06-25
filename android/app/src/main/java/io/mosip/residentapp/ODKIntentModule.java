package io.mosip.residentapp;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

public class ODKIntentModule extends ReactContextBaseJavaModule {

  private static final String MODULE_NAME = "ODKIntentModule";

  /**
   * The action to check for sending data to ODK Collect. Use this when configuring the ODK form.
   */
  private static final String ODK_REQUEST_ACTION = "io.mosip.residentapp.odk.REQUEST";

  @Override
  public String getName() {
    return MODULE_NAME;
  }

  ODKIntentModule(ReactApplicationContext context) {
    super(context);
  }

  @ReactMethod
  public void isRequestIntent(Promise promise) {
    Log.d(MODULE_NAME, "isRequestIntent() ");
    try {
      Activity activity = getCurrentActivity();
      Intent intent = activity.getIntent();
      String action = intent.getAction();
      if (activity == null || intent == null || action == null) {
        promise.resolve(false);
        return;
      }

      Boolean isBiometricAuth = false;
      Log.d(MODULE_NAME, "action  : "+action);
      Log.d(MODULE_NAME, "intent  : "+intent);
      if (intent!=null && action.equals(ODK_REQUEST_ACTION)){
        isBiometricAuth = intent.getBooleanExtra("biometricAuth", false);
        Log.d(MODULE_NAME, "isBiometricAuth  : "+isBiometricAuth);
      }

      promise.resolve(isBiometricAuth);

    } catch (Exception e) {
      promise.reject("E_UNKNOWN", e.getMessage());
    }
  }

  @ReactMethod
  public void sendBundleResult(ReadableMap vcData) {
    openReactNativeApp("com.aratek.trustfinger.oneton_demo");
    /* try {


     Activity activity = getCurrentActivity();
      if (activity == null) {
        throw new Exception("Activity does not exist");
      }

      Intent result = new Intent();
      result.setPackage(activity.getPackageName());

      Bundle vcBundle = new Bundle(Arguments.toBundle(vcData));
      if (vcBundle == null) {
        throw new Exception("Bundle could not be created");
      }

      for (String key : vcBundle.keySet()) {
        result.putExtra(key, vcBundle.getString(key));
      }

      activity.setResult(Activity.RESULT_OK, result);
      activity.finish();
    } catch (Exception e) {
      e.printStackTrace();
    }*/
  }

  private void openReactNativeApp(String packageName) {
    try {
      Activity activity = getCurrentActivity();
      if (activity == null) {
        throw new Exception("Activity does not exist");
      }
      Intent intent = activity.getPackageManager().getLaunchIntentForPackage(packageName);
      if (intent != null) {
        //intent.setAction("com.aratek.trustfinger.oneton_demo");
        activity.startActivity(intent);
      } else {
        Log.e(MODULE_NAME, "Not Found packageName : "+packageName);
        // App not found, handle error or prompt user to install the app
      }

    }catch (Exception e){
      e.printStackTrace();
    }
  }

}