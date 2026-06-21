import React, { useRef, useCallback, useEffect } from "react";
import { Platform, View } from "react-native";
import { WebView } from "react-native-webview";

const READER_HTML = "<!DOCTYPE html><html><body><script>window.onmessage=function(e){var img=new Image();img.onload=function(){var c=document.createElement('canvas');var max=1024;var w=img.width,h=img.height;if(w>max||h>max){var s=Math.min(max/w,max/h);w=Math.round(w*s);h=Math.round(h*s)}c.width=w;c.height=h;var ctx=c.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.drawImage(img,0,0,w,h);var d=ctx.getImageData(0,0,w,h).data;window.ReactNativeWebView.postMessage(JSON.stringify({data:Array.from(d),w:w,h:h}))};img.src=e.data};</script></body></html>";

let currentResolve: ((v: any) => void) | null = null;
let currentReject: ((e: Error) => void) | null = null;
let webViewRef: any = null;

export const PixelReader = {
  read(dataUri: string): Promise<{ data: number[]; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      currentResolve = resolve;
      currentReject = reject;
      if (webViewRef) {
        webViewRef.injectJavaScript(
          "window.onmessage({data:" + JSON.stringify(dataUri) + "});true;"
        );
      } else {
        reject(new Error("PixelReader not ready"));
      }
    });
  },
};

export function PixelReaderView() {
  const ref = useRef<any>(null);

  useEffect(() => {
    return () => { webViewRef = null; };
  }, []);

  const onMessage = useCallback((e: any) => {
    try {
      const d = JSON.parse(e.nativeEvent.data);
      if (d.data && currentResolve) {
        currentResolve({ data: d.data, width: d.w, height: d.h });
        currentResolve = null;
      } else if (currentReject) {
        currentReject(new Error("Invalid data"));
      }
    } catch (err: any) {
      if (currentReject) { currentReject(err); currentReject = null; }
    }
  }, []);

  if (Platform.OS === "web") return null;

  return (
    <View style={{ width: 0, height: 0, overflow: "hidden", opacity: 0 }}>
      <WebView
        ref={ref}
        source={{ html: READER_HTML }}
        style={{ width: 1, height: 1 }}
        onLoad={() => { webViewRef = ref.current; }}
        onMessage={onMessage}
        javaScriptEnabled={true}
        originWhitelist={["*"]}
      />
    </View>
  );
}
