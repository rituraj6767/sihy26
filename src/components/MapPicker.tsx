import React, { useEffect, useRef } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";

interface MapPickerProps {
  latitude: number;
  longitude: number;
  onLocationSelect: (coord: { latitude: number; longitude: number }) => void;
}

export function MapPicker({ latitude, longitude, onLocationSelect }: MapPickerProps) {
  const webViewRef = useRef<WebView>(null);
  const isFirstLoad = useRef(true);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; }
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #f8fafc; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var currentLat = ${latitude || 20.5937};
    var currentLng = ${longitude || 78.9629};

    var map = L.map('map', {
      zoomControl: true,
      attributionControl: false
    }).setView([currentLat, currentLng], 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    var redIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    var marker = L.marker([currentLat, currentLng], {
      icon: redIcon,
      draggable: true
    }).addTo(map);

    function sendCoord(lat, lng) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'location_changed',
          latitude: lat,
          longitude: lng
        }));
      }
    }

    marker.on('dragend', function(e) {
      var pos = e.target.getLatLng();
      sendCoord(pos.lat, pos.lng);
    });

    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      sendCoord(e.latlng.lat, e.latlng.lng);
    });

    window.setPinLocation = function(lat, lng) {
      marker.setLatLng([lat, lng]);
      map.setView([lat, lng], 16, { animate: true });
    };
  </script>
</body>
</html>
`;

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    if (latitude && longitude && webViewRef.current) {
      const js = `if (window.setPinLocation) { window.setPinLocation(${latitude}, ${longitude}); } true;`;
      webViewRef.current.injectJavaScript(js);
    }
  }, [latitude, longitude]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "location_changed") {
        onLocationSelect({
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
        });
      }
    } catch {
      // ignore
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: htmlContent }}
        onMessage={handleMessage}
        style={styles.webView}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        )}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loadingContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
});
