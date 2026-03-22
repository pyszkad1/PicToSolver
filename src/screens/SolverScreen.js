import React, { useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text, Linking } from 'react-native';
import { WebView } from 'react-native-webview';

export default function SolverScreen({ route }) {
  const { pbnString } = route.params;
  const webviewRef = useRef(null);

  // The javascript to inject into the webview once it loads
  // Because the "upload.htm" page requires a physical file selection (which we cannot easily
  // mock via WebView Javascript due to browser security), we will instead redirect the WebView
  // directly to the text-input Editor mode of BridgeWebs!
  const EDITOR_URL = 'https://dds.bridgewebs.com/bridgesolver/bso.htm?edit=1';

  // Bridge Solver can accept BBO 'lin' formatted URLs directly.
  const extractHands = (pbn) => {
    const match = pbn.match(/\[Deal\s+"([NESW]):([^"]+)"\]/i);
    if (!match) return null;

    const dealer = match[1].toUpperCase();
    const hands = match[2].trim().split(/\s+/); // Should be 4 hands

    const directions = ["N", "E", "S", "W"];
    const startIndex = directions.indexOf(dealer);

    const handData = {};
    for (let i = 0; i < 4; i++) {
      const pos = directions[(startIndex + i) % 4];
      // handle void fallback or parsing issue if fewer than 4 items
      handData[pos] = hands[i] || "";
    }
    return { dealer, handData };
  };

  const bbodealerMap = { "S": "1", "W": "2", "N": "3", "E": "4" };

  function parseDealPart(dealPart) {
    if (!dealPart) return { S: '', H: '', D: '', C: '' };
    const parts = dealPart.split('.');
    return {
      S: parts[0] || '',
      H: parts[1] || '',
      D: parts[2] || '',
      C: parts[3] || ''
    };
  }

  const extracted = extractHands(pbnString);
  let targetUri = 'https://dds.bridgewebs.com/bsol2/ddummy.htm';

  if (extracted) {
    const bboDealer = bbodealerMap[extracted.dealer] || "3";

    const north = parseDealPart(extracted.handData["N"]);
    const east = parseDealPart(extracted.handData["E"]);
    const south = parseDealPart(extracted.handData["S"]);
    const west = parseDealPart(extracted.handData["W"]);

    // LIN format requires specific player order: South, West, North, East
    const cards = `lin=md|${bboDealer}S${south.S}H${south.H}D${south.D}C${south.C},S${west.S}H${west.H}D${west.D}C${west.C},S${north.S}H${north.H}D${north.D}C${north.C},S${east.S}H${east.H}D${east.D}C${east.C}|`;

    targetUri = `https://dds.bridgewebs.com/bsol2/ddummy.htm?${cards}rh||ah|Board%201|sv|0`;
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        source={{ uri: targetUri }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => <ActivityIndicator style={styles.loading} size="large" />}
      />
      <View style={styles.footer}>
        <TouchableOpacity style={styles.browserButton} onPress={() => Linking.openURL(targetUri)}>
          <Text style={styles.browserButtonText}>Open in System Browser</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -18,
    marginTop: -18,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
    paddingBottom: 30, // Extra padding for safe area on devices without physical home buttons
  },
  browserButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  browserButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});
