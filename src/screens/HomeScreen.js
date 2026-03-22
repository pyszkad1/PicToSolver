import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { pickImageFromGallery, takePhoto } from '../utils/imageHelpers';
import { extractPBNFromImage } from '../services/geminiService';

const API_KEY_STORAGE_KEY = 'GEMINI_API_KEY';

export default function HomeScreen({ navigation }) {
    const [loading, setLoading] = useState(false);
    const [apiKey, setApiKey] = useState(null);

    // Reload the API key every time this screen comes into focus
    // (e.g. after the user saves it in Settings)
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
            loadKey();
        }, [])
    );

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
        await handleImageProcessing(asset);
    };

    const onPickGallery = async () => {
        const asset = await pickImageFromGallery();
        await handleImageProcessing(asset);
    };

    return (
        <View style={styles.container}>
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
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
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
        marginBottom: 40,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    buttonContainer: {
        width: '100%',
        paddingHorizontal: 20,
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
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#000',
    }
});
