package com.mitoreboot.app;

import android.app.Dialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Message;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        try {
            Bridge bridge = getBridge();
            if (bridge != null) {
                WebView webView = bridge.getWebView();
                if (webView != null) {
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
                            dialog.setContentView(popupWebView);
                            dialog.show();

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
                                        return handleExternalSchemes(request.getUrl().toString());
                                    }
                                    return false;
                                }

                                @Override
                                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                                    if (url != null) {
                                        return handleExternalSchemes(url);
                                    }
                                    return false;
                                }

                                private boolean handleExternalSchemes(String url) {
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
