package io.mosip.residentapp;
import expo.modules.ApplicationLifecycleDispatcher;
import expo.modules.ReactNativeHostWrapper;

import android.app.Application;
import android.content.Context;
import android.content.res.Configuration;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.soloader.SoLoader;

import timber.log.Timber;

import com.facebook.react.bridge.JSIModulePackage;

import java.lang.reflect.InvocationTargetException;
import java.util.List;

import com.dy.io.control.IO;
import com.dy.io.control.IoControl;
import com.dy.io.control.STATUS;

import java.io.File;

import android.app.Activity;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;


public class MainApplication extends Application implements ReactApplication {
  public boolean isLedEnable() {
        return isLedEnable;
    }

    public void setLedEnable(boolean ledEnable) {
        isLedEnable = ledEnable;
    }

    private boolean isLedEnable = true;
    private SharedPreferences sp;
    private SharedPreferences.Editor editor;
    private int appCount;
    private IoControl mIoControl;

    public void put(String key, String value) {
        if (!sp.contains(key)) {
            editor.putString(key, value);
        }

    }

    public void put(String key, boolean value) {
        if (!sp.contains(key)) {
            editor.putBoolean(key, value);
        }
    }

    private void initBackgroundCallBack() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.ICE_CREAM_SANDWICH) {
            registerActivityLifecycleCallbacks(new ActivityLifecycleCallbacks() {
                @Override
                public void onActivityCreated(Activity activity, Bundle savedInstanceState) {
                }

                @Override
                public void onActivityStarted(Activity activity) {
                    appCount++;
                    mIoControl.setIo(IO.UFP, STATUS.ON);
                }

                @Override
                public void onActivityResumed(Activity activity) {
                }

                @Override
                public void onActivityPaused(Activity activity) {
                }

                @Override
                public void onActivityStopped(Activity activity) {
                    appCount--;
                    if (appCount == 0) {
                        mIoControl.setIo(IO.UFP, STATUS.OFF);
                    }
                }

                @Override
                public void onActivitySaveInstanceState(Activity activity, Bundle outState) {
                }

                @Override
                public void onActivityDestroyed(Activity activity) {
                }
            });
        }
    }

    public SharedPreferences getSp() {
        return sp;
    }

    public void setSp(SharedPreferences sp) {
        this.sp = sp;
    }

  private final ReactNativeHost mReactNativeHost =
    new ReactNativeHostWrapper(this, new DefaultReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      @SuppressWarnings("UnnecessaryLocalVariable")
      List<ReactPackage> packages = new PackageList(this).getPackages();
      // Packages that cannot be autolinked yet can be added manually here, for example:
       packages.add(new TrustFingerPackage());
      return packages;
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
   @Override
    protected boolean isNewArchEnabled() {
      return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
    }
    @Override
    protected Boolean isHermesEnabled() {
      return BuildConfig.IS_HERMES_ENABLED;
    }    
  });

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);

    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      DefaultNewArchitectureEntryPoint.load();
    }
    ReactNativeFlipper.initializeFlipper(this, getReactNativeHost().getReactInstanceManager());

    if (BuildConfig.DEBUG) {
      Timber.plant(new Timber.DebugTree());
    }
    ApplicationLifecycleDispatcher.onApplicationCreate(this);
     mIoControl = new IoControl(this);
        initBackgroundCallBack();
        sp = getSharedPreferences(Config.SHAREDPREFERENCE_NAME, Context.MODE_PRIVATE);
        editor = sp.edit();

        put(Config.AUTO_SAVE, true);
        put(Config.FEATURE_PATH, Environment.getExternalStorageDirectory()
                .getAbsolutePath() + File.separator + "AratekTrustFinger" + File.separator +
                "FingerData");
        put(Config.FEATURE_FORMAT, "Aratek Bione");
        put(Config.IMAGE_FORMAT, "BMP");
        put(Config.CAPTURE_IMAGE_QUALITY_THRESHOLD, "50");
        put(Config.ENROLL_IMAGE_QUALITY_THRESHOLD, "50");
        put(Config.VERIFY_IMAGE_QUALITY_THRESHOLD, "50");
        put(Config.VERIFY_SECURITY_LEVEL, "Level4");
        put(Config.IDENTIFY_IMAGE_QUALITY_THRESHOLD, "50");
        put(Config.IDENTIFY_SECURITY_LEVEL, "Level4");
        editor.apply();
  }

  @Override
  public void onConfigurationChanged(Configuration newConfig) {
    super.onConfigurationChanged(newConfig);
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig);
  }
}
