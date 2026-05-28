import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { pickImageFromGallery, takePhoto } from '../utils/imageHelpers';
import { extractPBNFromImage } from '../services/geminiService';

const API_KEY_STORAGE_KEY = 'GEMINI_API_KEY';
const BOARD_HISTORY_KEY = 'BOARD_HISTORY';

const HandPreview = ({ handStr }) => {
    if (!handStr) return null;
    const parts = handStr.split('.');
    const suits = [
        { symbol: '♠', color: '#2D3748' },
        { symbol: '♥', color: '#E53E3E' },
        { symbol: '♦', color: '#DD6B20' }, // orange-red for better contrast than standard red on some displays
        { symbol: '♣', color: '#2D3748' }
    ];
    return (
        <View style={styles.suitsRow}>
            {parts.map((part, index) => {
                const suit = suits[index];
                if (!suit) return null;
                return (
                    <Text key={index} style={styles.suitText}>
                        <Text style={[styles.suitSymbol, { color: suit.color }]}>{suit.symbol}</Text>
                        <Text style={styles.suitValue}> {part || '-'}</Text>
                    </Text>
                );
            })}
        </View>
    );
};

export default function HomeScreen({ navigation, route }) {
    const [loading, setLoading] = useState(false);
    const [apiKey, setApiKey] = useState(null);
    const [history, setHistory] = useState([]);
    const processedCropRef = useRef(null);

    // Handle cropped image coming back from CropScreen
    useEffect(() => {
        if (route.params?.croppedImage) {
            const croppedImage = route.params.croppedImage;
            // Prevent re-processing if we already handled this exact crop
            const cropKey = croppedImage.uri;
            if (processedCropRef.current === cropKey) return;
            processedCropRef.current = cropKey;

            handleImageProcessing(croppedImage);
            // Clear the param so it doesn't re-trigger
            navigation.setParams({ croppedImage: undefined });
        }
    }, [route.params?.croppedImage]);

    // Reload the API key and history every time this screen comes into focus
    useFocusEffect(
        useCallback(() => {
            const loadKey = async () => {
                const stored = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
                setApiKey(stored);

                // If there is no key stored, send the user to Settings immediately
                if (!stored) {
                    Alert.alert(
                        'Welcome!',
                        'To get started, please enter your Google Gemini API key. You can get one for free at aistudio.google.com.',
                        [{ text: 'Set Up', onPress: () => navigation.navigate('Settings') }]
                    );
                }
            };

            const loadHistory = async () => {
                try {
                    const storedHistory = await AsyncStorage.getItem(BOARD_HISTORY_KEY);
                    if (storedHistory) {
                        setHistory(JSON.parse(storedHistory));
                    } else {
                        setHistory([]);
                    }
                } catch (e) {
                    console.error('Failed to load history', e);
                }
            };

            loadKey();
            loadHistory();
        }, [])
    );

    const saveToHistory = async (pbnString) => {
        try {
            const storedHistory = await AsyncStorage.getItem(BOARD_HISTORY_KEY);
            let currentHistory = storedHistory ? JSON.parse(storedHistory) : [];

            // Remove existing exact duplicate of this board to avoid duplicates
            currentHistory = currentHistory.filter(item => item.pbnString.trim() !== pbnString.trim());

            // Extract the deal content inside quotes, e.g. "N:AKQJ.AKQ... 432... 543... 987..."
            const dealMatch = pbnString.match(/\[Deal\s+"([^"]+)"\]/i);
            let northHand = '';
            if (dealMatch) {
                const dealContent = dealMatch[1].trim();
                // Strip the dealer prefix (e.g. "N:") if present
                const cleanContent = dealContent.replace(/^[NESW]:/i, '');
                const hands = cleanContent.split(/\s+/);
                northHand = hands[0] || '';
            }

            const dateObj = new Date();
            const dateString = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            const timeString = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
            const timestamp = `${dateString}, ${timeString}`;

            const newItem = {
                id: Date.now().toString(),
                pbnString,
                timestamp,
                northHand
            };

            currentHistory.unshift(newItem);
            currentHistory = currentHistory.slice(0, 5); // Keep the last 5 boards in history

            await AsyncStorage.setItem(BOARD_HISTORY_KEY, JSON.stringify(currentHistory));
            setHistory(currentHistory);
        } catch (e) {
            console.error('Failed to save to history', e);
        }
    };

    const deleteHistoryItem = async (id) => {
        try {
            const updated = history.filter(item => item.id !== id);
            await AsyncStorage.setItem(BOARD_HISTORY_KEY, JSON.stringify(updated));
            setHistory(updated);
        } catch (e) {
            console.error('Failed to delete history item', e);
        }
    };

    const clearHistory = async () => {
        Alert.alert(
            "Clear History",
            "Are you sure you want to clear your recent scans?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem(BOARD_HISTORY_KEY);
                            setHistory([]);
                        } catch (e) {
                            console.error('Failed to clear history', e);
                        }
                    }
                }
            ]
        );
    };

    const handleImageProcessing = async (imageAsset) => {
        if (!imageAsset) return;

        if (!apiKey) {
            Alert.alert('No API Key', 'Please set your Gemini API key in Settings first.', [
                { text: 'Go to Settings', onPress: () => navigation.navigate('Settings') }
            ]);
            return;
        }

        setLoading(true);
        try {
            const pbnString = await extractPBNFromImage(imageAsset.base64, apiKey);
            setLoading(false);

            console.log("GENERATED PBN:", pbnString);

            // Save to local history
            await saveToHistory(pbnString);

            Alert.alert(
                "Gemini Output",
                "Here is the raw PBN extracted:\n\n" + pbnString + "\n\nPress OK to open the Solver.",
                [
                    {
                        text: "OK",
                        onPress: () => navigation.navigate('Solver', { pbnString })
                    }
                ]
            );
        } catch (error) {
            setLoading(false);
            Alert.alert(
                "Error",
                "Failed to read the diagram. Please retake the photo and ensure the diagram is centered and clear.\n\n" + error.message,
                [{ text: "OK" }]
            );
        }
    };

    const onTakePhoto = async () => {
        const asset = await takePhoto();
        if (!asset) return;
        navigation.navigate('Crop', {
            imageUri: asset.uri,
            imageWidth: asset.width,
            imageHeight: asset.height,
        });
    };

    const onPickGallery = async () => {
        const asset = await pickImageFromGallery();
        if (!asset) return;
        // Navigate to custom CropScreen instead of broken native crop
        navigation.navigate('Crop', {
            imageUri: asset.uri,
            imageWidth: asset.width,
            imageHeight: asset.height,
        });
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
            <View style={styles.innerContainer}>
                <Text style={styles.title}>Bridge Diagram Extractor</Text>
                <Text style={styles.subtitle}>
                    Take a picture of a printed bridge hand diagram to extract a PBN and analyze it.
                </Text>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={styles.loadingText}>Analyzing with Gemini...</Text>
                    </View>
                ) : (
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.button} onPress={onTakePhoto}>
                            <Text style={styles.buttonText}>Take Photo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={onPickGallery}>
                            <Text style={styles.secondaryButtonText}>Upload from Gallery</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('Settings')}>
                            <Text style={styles.settingsButtonText}>⚙️  Settings</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {history.length > 0 && (
                <View style={styles.historySection}>
                    <View style={styles.historyHeader}>
                        <Text style={styles.historyTitle}>Recent Scans</Text>
                        <TouchableOpacity onPress={clearHistory}>
                            <Text style={styles.clearAllText}>Clear All</Text>
                        </TouchableOpacity>
                    </View>

                    {history.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.historyCard}
                            onPress={() => navigation.navigate('Solver', { pbnString: item.pbnString })}
                        >
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTime}>{item.timestamp}</Text>
                            </View>

                            <Text style={styles.cardHandLabel}>North Hand Preview:</Text>
                            <HandPreview handStr={item.northHand} />

                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    deleteHistoryItem(item.id);
                                }}
                            >
                                <Text style={styles.deleteButtonText}>🗑️</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: 40,
    },
    innerContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    buttonContainer: {
        width: '100%',
        paddingHorizontal: 10,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
    },
    secondaryButton: {
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    secondaryButtonText: {
        color: '#333',
        fontSize: 18,
        fontWeight: '600',
    },
    settingsButton: {
        marginTop: 8,
        padding: 14,
        alignItems: 'center',
    },
    settingsButtonText: {
        color: '#007AFF',
        fontSize: 16,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#000',
    },
    historySection: {
        marginTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 24,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    historyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A202C',
    },
    clearAllText: {
        color: '#FF3B30',
        fontSize: 14,
        fontWeight: '500',
    },
    historyCard: {
        backgroundColor: '#F7FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingRight: 35, // Prevent overlapping with trash icon
    },
    dealerBadge: {
        backgroundColor: '#EBF8FF',
        borderWidth: 1,
        borderColor: '#BEE3F8',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginRight: 10,
    },
    dealerBadgeText: {
        color: '#2B6CB0',
        fontSize: 12,
        fontWeight: 'bold',
    },
    cardTime: {
        fontSize: 12,
        color: '#718096',
    },
    cardHandLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#718096',
        marginTop: 4,
    },
    deleteButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        padding: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButtonText: {
        fontSize: 16,
    },
    // HandPreview specific styles
    suitsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 6,
    },
    suitText: {
        marginRight: 16,
        fontSize: 14,
    },
    suitSymbol: {
        fontWeight: 'bold',
        fontSize: 15,
    },
    suitValue: {
        color: '#2D3748',
        fontWeight: '500',
    },
});
