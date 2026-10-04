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
        
        try {
            Bridge bridge = getBridge();
            if (bridge != null) {
                WebView webView = bridge.getWebView();
                if (webView != null) {
                    // Enable hardware acceleration for smooth bitmap rendering
                    webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

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
                                android.widget.ViewGroup.LayoutParams.MATCH_PARENT, 
                                barHeight
                            ));
                            topBar.setBackgroundColor(0xFF1E293B);

                            android.widget.TextView titleView = new android.widget.TextView(MainActivity.this);
                            titleView.setText("MitoReboot");
                            titleView.setTextColor(0xFFFFFFFF);
                            titleView.setTextSize(14);
                            titleView.setTypeface(null, android.graphics.Typeface.BOLD);
                            android.widget.RelativeLayout.LayoutParams titleParams = new android.widget.RelativeLayout.LayoutParams(
                                android.widget.ViewGroup.LayoutParams.WRAP_CONTENT,
                                android.widget.ViewGroup.LayoutParams.WRAP_CONTENT
                            );
                            titleParams.addRule(android.widget.RelativeLayout.CENTER_IN_PARENT);
                            topBar.addView(titleView, titleParams);

                            android.widget.Button closeButton = new android.widget.Button(MainActivity.this);
                            closeButton.setText("✕ Close");
                            closeButton.setTextColor(0xFFFFFFFF);
                            closeButton.setTextSize(12);
                            closeButton.setBackgroundColor(0x00000000);
                            android.widget.RelativeLayout.LayoutParams btnParams = new android.widget.RelativeLayout.LayoutParams(
                                android.widget.ViewGroup.LayoutParams.WRAP_CONTENT,
                                android.widget.ViewGroup.LayoutParams.MATCH_PARENT
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
                                android.widget.ViewGroup.LayoutParams.MATCH_PARENT,
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
}
