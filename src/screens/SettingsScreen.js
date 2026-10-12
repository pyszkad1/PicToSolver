import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Linking,
    ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY_STORAGE_KEY = 'GEMINI_API_KEY';
const AI_STUDIO_URL = 'https://aistudio.google.com/app/apikey';

export default function SettingsScreen({ navigation }) {
    const [apiKey, setApiKey] = useState('');
    const [savedKey, setSavedKey] = useState('');
    const [secureTextEntry, setSecureTextEntry] = useState(true);

    useEffect(() => {
        loadKey();
    }, []);

    const loadKey = async () => {
        try {
            const stored = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
            if (stored) {
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
            setApiKey(''); // Clear the input field after saving
            Alert.alert('Saved!', 'Your Gemini API key has been saved.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (e) {
            Alert.alert('Error', 'Failed to save the API key.');
        }
    };

    const deleteKey = async () => {
        Alert.alert(
            'Remove API Key',
            'Are you sure you want to remove your saved Gemini API key?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem(API_KEY_STORAGE_KEY);
                            setSavedKey('');
                            setApiKey('');
                        } catch (e) {
                            Alert.alert('Error', 'Failed to remove API key.');
                        }
                    }
                }
            ]
        );
    };

    const openAiStudio = async () => {
        try {
            const supported = await Linking.canOpenURL(AI_STUDIO_URL);
            if (supported) {
                await Linking.openURL(AI_STUDIO_URL);
            } else {
                Alert.alert(
                    'Cannot Open Link',
                    'Please navigate to https://aistudio.google.com/app/apikey in your browser.'
                );
            }
        } catch (e) {
            Alert.alert('Error', 'Could not open link: ' + (e?.message || e));
        }
    };

    const maskKey = (key) => {
        if (!key || key.length < 8) return key;
        return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={styles.title}>Gemini API Key</Text>
            <Text style={styles.description}>
                PicToSolver uses Google's Gemini AI to accurately extract bridge hands from photos. Your key is stored only on this device.
            </Text>

            {/* Help / Setup Guide Card */}
            <View style={styles.helpCard}>
                <View style={styles.helpHeaderRow}>
                    <Text style={styles.helpBadge}>GUIDE</Text>
                    <Text style={styles.helpTitle}>How to get a free key</Text>
                </View>

                <TouchableOpacity
                    style={styles.linkButton}
                    onPress={openAiStudio}
                    activeOpacity={0.8}
                >
                    <Text style={styles.linkButtonText}>🌐 Open Google AI Studio ↗</Text>
                </TouchableOpacity>

                <View style={styles.stepItem}>
                    <View style={styles.stepNumberCircle}>
                        <Text style={styles.stepNumber}>1</Text>
                    </View>
                    <Text style={styles.stepText}>
                        Tap the button above or visit{' '}
                        <Text style={styles.inlineLink} onPress={openAiStudio}>
                            aistudio.google.com
                        </Text>
                    </Text>
                </View>

                <View style={styles.stepItem}>
                    <View style={styles.stepNumberCircle}>
                        <Text style={styles.stepNumber}>2</Text>
                    </View>
                    <Text style={styles.stepText}>
                        Sign in with any regular Google account.
                    </Text>
                </View>

                <View style={styles.stepItem}>
                    <View style={styles.stepNumberCircle}>
                        <Text style={styles.stepNumber}>3</Text>
                    </View>
                    <Text style={styles.stepText}>
                        Click <Text style={styles.boldText}>"Create API Key"</Text> (or "Get API key").
                    </Text>
                </View>

                <View style={styles.stepItem}>
                    <View style={styles.stepNumberCircle}>
                        <Text style={styles.stepNumber}>4</Text>
                    </View>
                    <Text style={styles.stepText}>
                        Copy your key, return here, paste it below, and tap <Text style={styles.boldText}>Save</Text>.
                    </Text>
                </View>

                <View style={styles.tipBox}>
                    <Text style={styles.tipText}>
                        💡 Completely free for individual use. No credit card required!
                    </Text>
                </View>
            </View>

            {/* Saved Key Indicator */}
            {savedKey ? (
                <View style={styles.currentKeyBox}>
                    <View style={styles.currentKeyHeader}>
                        <View style={styles.statusIndicatorRow}>
                            <View style={styles.statusDot} />
                            <Text style={styles.currentKeyLabel}>Active API Key:</Text>
                        </View>
                        <TouchableOpacity onPress={deleteKey} style={styles.removeKeyButton}>
                            <Text style={styles.removeKeyText}>Remove</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.currentKeyValue}>{maskKey(savedKey)}</Text>
                </View>
            ) : null}

            {/* Key Input Section */}
            <Text style={styles.inputLabel}>
                {savedKey ? 'Update API Key' : 'Enter API Key'}
            </Text>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="AIzaSy..."
                    placeholderTextColor="#999"
                    value={apiKey}
                    onChangeText={setApiKey}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={secureTextEntry}
                />
                <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                >
                    <Text style={styles.eyeButtonText}>
                        {secureTextEntry ? '👁️' : '👁️‍🗨️'}
                    </Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={[styles.saveButton, !apiKey.trim() && !savedKey ? styles.saveButtonHighlight : null]}
                onPress={saveKey}
            >
                <Text style={styles.saveButtonText}>
                    {savedKey ? 'Update API Key' : 'Save API Key'}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 20,
        lineHeight: 20,
    },
    helpCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 18,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    helpHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    helpBadge: {
        backgroundColor: '#E0F2FE',
        color: '#0284C7',
        fontSize: 11,
        fontWeight: 'bold',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginRight: 8,
        overflow: 'hidden',
    },
    helpTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    linkButton: {
        backgroundColor: '#0284C7',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 16,
    },
    linkButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    stepNumberCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        marginTop: 1,
    },
    stepNumber: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#475569',
    },
    stepText: {
        flex: 1,
        fontSize: 14,
        color: '#334155',
        lineHeight: 20,
    },
    inlineLink: {
        color: '#0284C7',
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    boldText: {
        fontWeight: '600',
        color: '#0F172A',
    },
    tipBox: {
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#DCFCE7',
        borderRadius: 8,
        padding: 10,
        marginTop: 6,
    },
    tipText: {
        fontSize: 12,
        color: '#166534',
        lineHeight: 17,
    },
    currentKeyBox: {
        backgroundColor: '#FFFFFF',
        padding: 14,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    currentKeyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    statusIndicatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#22C55E',
        marginRight: 6,
    },
    currentKeyLabel: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    removeKeyButton: {
        paddingVertical: 2,
        paddingHorizontal: 8,
    },
    removeKeyText: {
        fontSize: 13,
        color: '#EF4444',
        fontWeight: '500',
    },
    currentKeyValue: {
        fontSize: 15,
        fontFamily: 'monospace',
        color: '#0F172A',
        fontWeight: '500',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 12,
        marginBottom: 16,
        paddingRight: 8,
    },
    input: {
        flex: 1,
        padding: 14,
        fontSize: 15,
        color: '#0F172A',
    },
    eyeButton: {
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    eyeButtonText: {
        fontSize: 18,
    },
    saveButton: {
        backgroundColor: '#0F172A',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonHighlight: {
        backgroundColor: '#0284C7',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
