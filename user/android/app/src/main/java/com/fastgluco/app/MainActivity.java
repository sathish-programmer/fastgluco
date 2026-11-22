package com.mitoreboot.app;

import android.app.Dialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Message;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.activity.EdgeToEdge;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.WindowCompat;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        

        
        // Enable modern Edge-to-Edge display (compatible with Android 15/API 35+)
        try {
            EdgeToEdge.enable(this);
            WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Initialize notification channels with custom gentle bell sound
        createNotificationChannels();
        
        try {
            Bridge bridge = getBridge();
            if (bridge != null) {
                WebView webView = bridge.getWebView();
                if (webView != null) {
                    // Enable hardware acceleration for smooth bitmap rendering
                    webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
                    // Disable overscroll bounce and unwanted navigation gestures
                    webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

                    // Configure Cookies for Razorpay cross-origin iframe
                    CookieManager cookieManager = CookieManager.getInstance();
                    cookieManager.setAcceptCookie(true);
                    cookieManager.setAcceptThirdPartyCookies(webView, true);

                    WebSettings settings = webView.getSettings();
                    settings.setJavaScriptEnabled(true);
                    settings.setDomStorageEnabled(true);
                    settings.setDatabaseEnabled(true);
                    settings.setAllowFileAccess(true);
                    settings.setAllowContentAccess(true);
                    settings.setLoadsImagesAutomatically(true);
                    settings.setBlockNetworkImage(false);
                    settings.setJavaScriptCanOpenWindowsAutomatically(true);
                    settings.setSupportMultipleWindows(true);
                    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

                    // Normalize User-Agent by removing WebView restriction tokens (wv / Version/4.0)
                    try {
                        String defaultUA = settings.getUserAgentString();
                        if (defaultUA != null) {
                            String normalizedUA = defaultUA.replace("; wv", "").replace(";  wv", "").replaceAll("Version/\\d+\\.\\d+\\s*", "");
                            settings.setUserAgentString(normalizedUA);
                        }
                    } catch (Exception uaEx) {
                        uaEx.printStackTrace();
                    }

                    // Enable DownloadListener for main webView to prevent black screen on download clicks
                    webView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
                        try {
                            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            MainActivity.this.startActivity(intent);
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    });

                    webView.setWebChromeClient(new BridgeWebChromeClient(bridge) {
                        @Override
                        public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                            WebView popupWebView = new WebView(MainActivity.this);
                            
                            CookieManager.getInstance().setAcceptCookie(true);
                            CookieManager.getInstance().setAcceptThirdPartyCookies(popupWebView, true);

                            WebSettings popupSettings = popupWebView.getSettings();
                            popupSettings.setJavaScriptEnabled(true);
                            popupSettings.setDomStorageEnabled(true);
                            popupSettings.setDatabaseEnabled(true);
                            popupSettings.setAllowFileAccess(true);
                            popupSettings.setAllowContentAccess(true);
                            popupSettings.setSupportMultipleWindows(true);
                            popupSettings.setJavaScriptCanOpenWindowsAutomatically(true);
                            popupSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

                            try {
                                String defaultPopupUA = popupSettings.getUserAgentString();
                                if (defaultPopupUA != null) {
                                    String normalizedPopupUA = defaultPopupUA.replace("; wv", "").replace(";  wv", "").replaceAll("Version/\\d+\\.\\d+\\s*", "");
                                    popupSettings.setUserAgentString(normalizedPopupUA);
                                }
                            } catch (Exception uaEx) {
                                uaEx.printStackTrace();
                            }

                            final Dialog dialog = new Dialog(MainActivity.this, android.R.style.Theme_Black_NoTitleBar_Fullscreen);
                            dialog.setCancelable(true);
                            dialog.setCanceledOnTouchOutside(false);

                            // Build a safe container with a top close bar so user is never trapped in a black screen
                            android.widget.LinearLayout container = new android.widget.LinearLayout(MainActivity.this);
                            container.setOrientation(android.widget.LinearLayout.VERTICAL);
                            container.setBackgroundColor(0xFF0F172A);

                            int barHeight = (int) (48 * getResources().getDisplayMetrics().density);
                            android.widget.RelativeLayout topBar = new android.widget.RelativeLayout(MainActivity.this);
                            topBar.setLayoutParams(new android.widget.LinearLayout.LayoutParams(
                                ViewGroup.LayoutParams.MATCH_PARENT, 
                                barHeight
                            ));
                            topBar.setBackgroundColor(0xFF1E293B);

                            android.widget.TextView titleView = new android.widget.TextView(MainActivity.this);
                            titleView.setText("MitoReboot");
                            titleView.setTextColor(0xFFFFFFFF);
                            titleView.setTextSize(14);
                            titleView.setTypeface(null, android.graphics.Typeface.BOLD);
                            android.widget.RelativeLayout.LayoutParams titleParams = new android.widget.RelativeLayout.LayoutParams(
                                ViewGroup.LayoutParams.WRAP_CONTENT,
                                ViewGroup.LayoutParams.WRAP_CONTENT
                            );
                            titleParams.addRule(android.widget.RelativeLayout.CENTER_IN_PARENT);
                            topBar.addView(titleView, titleParams);

                            android.widget.Button closeButton = new android.widget.Button(MainActivity.this);
                            closeButton.setText("✕ Close");
                            closeButton.setTextColor(0xFFFFFFFF);
                            closeButton.setTextSize(12);
                            closeButton.setBackgroundColor(0x00000000);
                            android.widget.RelativeLayout.LayoutParams btnParams = new android.widget.RelativeLayout.LayoutParams(
                                ViewGroup.LayoutParams.WRAP_CONTENT,
                                ViewGroup.LayoutParams.MATCH_PARENT
                            );
                            btnParams.addRule(android.widget.RelativeLayout.ALIGN_PARENT_RIGHT);
                            topBar.addView(closeButton, btnParams);

                            closeButton.setOnClickListener(v -> {
                                try {
                                    dialog.dismiss();
                                    popupWebView.destroy();
                                } catch (Exception e) {
                                    e.printStackTrace();
                                }
                            });

                            container.addView(topBar);

                            android.widget.LinearLayout.LayoutParams webParams = new android.widget.LinearLayout.LayoutParams(
                                ViewGroup.LayoutParams.MATCH_PARENT,
                                0,
                                1.0f
                            );
                            container.addView(popupWebView, webParams);

                            dialog.setContentView(container);
                            dialog.show();

                            // Download listener on popup webview
                            popupWebView.setDownloadListener((downloadUrl, userAgent, contentDisposition, mimetype, contentLength) -> {
                                try {
                                    dialog.dismiss();
                                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(downloadUrl));
                                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                    MainActivity.this.startActivity(intent);
                                } catch (Exception e) {
                                    e.printStackTrace();
                                }
                            });

                            popupWebView.setWebChromeClient(new android.webkit.WebChromeClient() {
                                @Override
                                public void onCloseWindow(WebView window) {
                                    try {
                                        dialog.dismiss();
                                        window.destroy();
                                    } catch (Exception e) {
                                        e.printStackTrace();
                                    }
                                }
                            });

                            popupWebView.setWebViewClient(new WebViewClient() {
                                @Override
                                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                                    if (request != null && request.getUrl() != null) {
                                        return handleExternalSchemes(request.getUrl().toString(), dialog);
                                    }
                                    return false;
                                }

                                @Override
                                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                                    if (url != null) {
                                        return handleExternalSchemes(url, dialog);
                                    }
                                    return false;
                                }

                                private boolean handleExternalSchemes(String url, Dialog dlg) {
                                    if (url.startsWith("upi:") || url.startsWith("intent:") || 
                                        url.startsWith("market:") || url.startsWith("whatsapp:") ||
                                        url.startsWith("paytmmp:") || url.startsWith("phonepe:") || 
                                        url.startsWith("gpay:") || url.startsWith("tez:")) {
                                        try {
                                            Intent intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
                                            MainActivity.this.startActivity(intent);
                                            return true;
                                        } catch (Exception e) {
                                            e.printStackTrace();
                                            return true;
                                        }
                                    }

                                    // Handle direct file downloads
                                    if (url.endsWith(".pdf") || url.contains("/download") || url.contains("/invoice")) {
                                        try {
                                            dlg.dismiss();
                                            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                                            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                            MainActivity.this.startActivity(intent);
                                            return true;
                                        } catch (Exception e) {
                                            e.printStackTrace();
                                        }
                                    }
                                    return false;
                                }
                            });

                            WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                            transport.setWebView(popupWebView);
                            resultMsg.sendToTarget();
                            return true;
                        }
                    });
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void createNotificationChannels() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            android.app.NotificationManager notificationManager = getSystemService(android.app.NotificationManager.class);
            if (notificationManager == null) return;

            android.media.AudioAttributes audioAttributes = new android.media.AudioAttributes.Builder()
                .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION)
                .build();

            android.net.Uri soundUri = android.net.Uri.parse(
                android.content.ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + getPackageName() + "/raw/health_bell"
            );

            // 1. Primary FCM Channel (used by backend pushes)
            createOrUpdateChannel(
                notificationManager,
                "mitoreboot_notifications",
                "Mito Reboot Notifications",
                "Appointments, orders, and personalized health guidance",
                android.app.NotificationManager.IMPORTANCE_HIGH,
                soundUri,
                audioAttributes
            );

            // 2. Daily Check-in Channel
            createOrUpdateChannel(
                notificationManager,
                "mito_daily_checkin_channel",
                "Daily Health Check-in Reminders",
                "Scheduled reminders for your daily metabolic & habit check-in",
                android.app.NotificationManager.IMPORTANCE_HIGH,
                soundUri,
                audioAttributes
            );

            // 3. Reports Channel
            createOrUpdateChannel(
                notificationManager,
                "mito_reports_channel",
                "Lab & Medical Report Reminders",
                "Optional reminders to upload new blood test or diagnostic reports",
                android.app.NotificationManager.IMPORTANCE_DEFAULT,
                soundUri,
                audioAttributes
            );

            // 4. Health Habits Channel
            createOrUpdateChannel(
                notificationManager,
                "mito_health_habits_channel",
                "Preventive Health & Habit Alerts",
                "Scheduled reminders for personalized habits, stillness, and breathwork",
                android.app.NotificationManager.IMPORTANCE_HIGH,
                soundUri,
                audioAttributes
            );

            // 5. Symptom Screening Channel
            createOrUpdateChannel(
                notificationManager,
                "mito_symptom_checkin_channel",
                "3-Weekly Symptom Screening",
                "Reminders for your 3-weekly early warning symptom check-in",
                android.app.NotificationManager.IMPORTANCE_HIGH,
                soundUri,
                audioAttributes
            );
        }
    }

    private void createOrUpdateChannel(
        android.app.NotificationManager notificationManager,
        String channelId,
        String name,
        String description,
        int importance,
        android.net.Uri soundUri,
        android.media.AudioAttributes audioAttributes
    ) {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            android.app.NotificationChannel existing = notificationManager.getNotificationChannel(channelId);
            // If channel doesn't exist OR was created without sound, recreate it with custom sound
            if (existing == null || existing.getSound() == null) {
                if (existing != null) {
                    notificationManager.deleteNotificationChannel(channelId);
                }
                android.app.NotificationChannel channel = new android.app.NotificationChannel(channelId, name, importance);
                channel.setDescription(description);
                channel.setSound(soundUri, audioAttributes);
                channel.enableVibration(true);
                channel.enableLights(true);
                channel.setLightColor(0xFF0D9488);
                notificationManager.createNotificationChannel(channel);
            }
        }
    }
}
