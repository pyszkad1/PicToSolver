import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY_STORAGE_KEY = 'GEMINI_API_KEY';

export default function SettingsScreen({ navigation }) {
    const [apiKey, setApiKey] = useState('');
    const [savedKey, setSavedKey] = useState('');

    useEffect(() => {
        loadKey();
    }, []);

    const loadKey = async () => {
        try {
            const stored = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
            if (stored) {
                setApiKey(stored);
                setSavedKey(stored);
            }
        } catch (e) {
            console.error('Failed to load API key', e);
        }
    };

    const saveKey = async () => {
        const trimmed = apiKey.trim();
        if (!trimmed) {
            Alert.alert('Error', 'Please enter a valid API key.');
            return;
        }
        try {
            await AsyncStorage.setItem(API_KEY_STORAGE_KEY, trimmed);
            setSavedKey(trimmed);
            Alert.alert('Saved!', 'Your Gemini API key has been saved.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (e) {
            Alert.alert('Error', 'Failed to save the API key.');
        }
    };

    const maskKey = (key) => {
        if (!key || key.length < 8) return key;
        return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Gemini API Key</Text>
            <Text style={styles.description}>
                Enter your Google Gemini API key. You can get one for free at{' '}
                <Text style={styles.link}>aistudio.google.com</Text>
            </Text>

            {savedKey ? (
                <View style={styles.currentKeyBox}>
                    <Text style={styles.currentKeyLabel}>Current key:</Text>
                    <Text style={styles.currentKeyValue}>{maskKey(savedKey)}</Text>
                </View>
            ) : null}

            <TextInput
                style={styles.input}
                placeholder="Paste your API key here..."
                value={apiKey}
                onChangeText={setApiKey}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={false}
            />

            <TouchableOpacity style={styles.saveButton} onPress={saveKey}>
                <Text style={styles.saveButtonText}>Save API Key</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    description: {
        fontSize: 15,
        color: '#666',
        marginBottom: 24,
        lineHeight: 22,
    },
    link: {
        color: '#007AFF',
    },
    currentKeyBox: {
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    currentKeyLabel: {
        fontSize: 13,
        color: '#999',
        marginBottom: 4,
    },
    currentKeyValue: {
        fontSize: 15,
        fontFamily: 'monospace',
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        padding: 14,
        fontSize: 16,
        marginBottom: 20,
    },
    saveButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
    },
});
