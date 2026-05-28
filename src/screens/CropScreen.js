import React, { useState, useRef, useMemo } from 'react';
import {
    View,
    Image,
    StyleSheet,
    TouchableOpacity,
    Text,
    Dimensions,
    PanResponder,
    SafeAreaView,
} from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

const SCREEN = Dimensions.get('window');
const HANDLE_SIZE = 28;
const HANDLE_HIT = 40; // larger touch target
const MIN_CROP = 50; // minimum crop box dimension in display px

export default function CropScreen({ navigation, route }) {
    const { imageUri, imageWidth, imageHeight, onCropDone } = route.params;

    // ---------- layout: fit image into ~70% of screen with margins ----------
    const layout = useMemo(() => {
        const maxW = SCREEN.width - 40;           // 20px margin each side
        const maxH = SCREEN.height * 0.65;        // leave room for buttons + header
        const scale = Math.min(maxW / imageWidth, maxH / imageHeight);
        const dispW = Math.round(imageWidth * scale);
        const dispH = Math.round(imageHeight * scale);
        const offsetX = Math.round((SCREEN.width - dispW) / 2);
        const offsetY = Math.round((SCREEN.height * 0.65 - dispH) / 2) + 10; // small top margin
        return { dispW, dispH, offsetX, offsetY, scale };
    }, [imageWidth, imageHeight]);

    // ---------- crop box state (in display coordinates, relative to image) ----
    const [crop, setCrop] = useState({
        x: Math.round(layout.dispW * 0.04),
        y: Math.round(layout.dispH * 0.04),
        w: Math.round(layout.dispW * 0.92),
        h: Math.round(layout.dispH * 0.92),
    });

    const cropRef = useRef(crop);
    cropRef.current = crop;

    // ---------- clamp helper -----------------------------------------------
    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

    // ---------- build pan responders for corners ---------------------------
    const makeCornerPan = (corner) => {
        const startRef = { x: 0, y: 0, crop: null };
        return PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                startRef.crop = { ...cropRef.current };
            },
            onPanResponderMove: (_, gesture) => {
                const c = startRef.crop;
                let { x, y, w, h } = c;
                const dx = gesture.dx;
                const dy = gesture.dy;

                if (corner === 'tl') {
                    const newX = clamp(c.x + dx, 0, c.x + c.w - MIN_CROP);
                    const newY = clamp(c.y + dy, 0, c.y + c.h - MIN_CROP);
                    w = c.w + (c.x - newX);
                    h = c.h + (c.y - newY);
                    x = newX;
                    y = newY;
                } else if (corner === 'tr') {
                    const newRight = clamp(c.x + c.w + dx, c.x + MIN_CROP, layout.dispW);
                    const newY = clamp(c.y + dy, 0, c.y + c.h - MIN_CROP);
                    w = newRight - c.x;
                    h = c.h + (c.y - newY);
                    x = c.x;
                    y = newY;
                } else if (corner === 'bl') {
                    const newX = clamp(c.x + dx, 0, c.x + c.w - MIN_CROP);
                    const newBottom = clamp(c.y + c.h + dy, c.y + MIN_CROP, layout.dispH);
                    w = c.w + (c.x - newX);
                    h = newBottom - c.y;
                    x = newX;
                    y = c.y;
                } else if (corner === 'br') {
                    const newRight = clamp(c.x + c.w + dx, c.x + MIN_CROP, layout.dispW);
                    const newBottom = clamp(c.y + c.h + dy, c.y + MIN_CROP, layout.dispH);
                    w = newRight - c.x;
                    h = newBottom - c.y;
                    x = c.x;
                    y = c.y;
                }

                setCrop({ x, y, w, h });
            },
        });
    };

    // ---------- drag the whole crop box ------------------------------------
    const makeCenterPan = () => {
        const startRef = { crop: null };
        return PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, g) =>
                Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2,
            onPanResponderGrant: () => {
                startRef.crop = { ...cropRef.current };
            },
            onPanResponderMove: (_, gesture) => {
                const c = startRef.crop;
                const newX = clamp(c.x + gesture.dx, 0, layout.dispW - c.w);
                const newY = clamp(c.y + gesture.dy, 0, layout.dispH - c.h);
                setCrop({ x: newX, y: newY, w: c.w, h: c.h });
            },
        });
    };

    // Memoize pan responders so they stay stable
    const panTL = useRef(makeCornerPan('tl')).current;
    const panTR = useRef(makeCornerPan('tr')).current;
    const panBL = useRef(makeCornerPan('bl')).current;
    const panBR = useRef(makeCornerPan('br')).current;
    const panCenter = useRef(makeCenterPan()).current;

    // ---------- perform actual crop ----------------------------------------
    const handleCrop = async () => {
        // Convert display coordinates back to original image coordinates
        const originX = Math.round(crop.x / layout.scale);
        const originY = Math.round(crop.y / layout.scale);
        const cropW = Math.round(crop.w / layout.scale);
        const cropH = Math.round(crop.h / layout.scale);

        const manipulated = await ImageManipulator.manipulateAsync(
            imageUri,
            [
                {
                    crop: {
                        originX: Math.max(0, originX),
                        originY: Math.max(0, originY),
                        width: Math.min(cropW, imageWidth - originX),
                        height: Math.min(cropH, imageHeight - originY),
                    },
                },
            ],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );

        // Navigate back with the cropped result
        navigation.navigate('Home', {
            croppedImage: {
                uri: manipulated.uri,
                base64: manipulated.base64,
                width: manipulated.width,
                height: manipulated.height,
            },
        });
    };

    // ---------- overlay mask pieces (4 semi-transparent rectangles) ---------
    const renderOverlay = () => {
        const { x, y, w, h } = crop;
        return (
            <>
                {/* top */}
                <View style={[styles.overlay, { left: 0, top: 0, right: 0, height: y }]} />
                {/* bottom */}
                <View
                    style={[
                        styles.overlay,
                        { left: 0, top: y + h, right: 0, bottom: 0 },
                    ]}
                />
                {/* left */}
                <View
                    style={[styles.overlay, { left: 0, top: y, width: x, height: h }]}
                />
                {/* right */}
                <View
                    style={[
                        styles.overlay,
                        { left: x + w, top: y, right: 0, height: h },
                    ]}
                />
            </>
        );
    };

    // ---------- crop border + corner handles -------------------------------
    const renderCropBox = () => {
        const { x, y, w, h } = crop;
        const cornerStyle = (position) => {
            const base = {
                position: 'absolute',
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                borderColor: '#FFFFFF',
                borderWidth: 3,
                zIndex: 20,
            };
            // Position each corner so it sits on the crop border intersection
            switch (position) {
                case 'tl':
                    return {
                        ...base,
                        left: x - HANDLE_SIZE / 2,
                        top: y - HANDLE_SIZE / 2,
                        borderRightWidth: 0,
                        borderBottomWidth: 0,
                        borderTopLeftRadius: 4,
                    };
                case 'tr':
                    return {
                        ...base,
                        left: x + w - HANDLE_SIZE / 2,
                        top: y - HANDLE_SIZE / 2,
                        borderLeftWidth: 0,
                        borderBottomWidth: 0,
                        borderTopRightRadius: 4,
                    };
                case 'bl':
                    return {
                        ...base,
                        left: x - HANDLE_SIZE / 2,
                        top: y + h - HANDLE_SIZE / 2,
                        borderRightWidth: 0,
                        borderTopWidth: 0,
                        borderBottomLeftRadius: 4,
                    };
                case 'br':
                    return {
                        ...base,
                        left: x + w - HANDLE_SIZE / 2,
                        top: y + h - HANDLE_SIZE / 2,
                        borderLeftWidth: 0,
                        borderTopWidth: 0,
                        borderBottomRightRadius: 4,
                    };
            }
        };

        return (
            <>
                {/* crop border */}
                <View
                    style={{
                        position: 'absolute',
                        left: x,
                        top: y,
                        width: w,
                        height: h,
                        borderWidth: 2,
                        borderColor: '#FFFFFF',
                        zIndex: 10,
                    }}
                />

                {/* rule-of-thirds grid lines */}
                <View
                    style={{
                        position: 'absolute',
                        left: x + w / 3,
                        top: y,
                        width: 1,
                        height: h,
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        zIndex: 10,
                    }}
                />
                <View
                    style={{
                        position: 'absolute',
                        left: x + (2 * w) / 3,
                        top: y,
                        width: 1,
                        height: h,
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        zIndex: 10,
                    }}
                />
                <View
                    style={{
                        position: 'absolute',
                        left: x,
                        top: y + h / 3,
                        width: w,
                        height: 1,
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        zIndex: 10,
                    }}
                />
                <View
                    style={{
                        position: 'absolute',
                        left: x,
                        top: y + (2 * h) / 3,
                        width: w,
                        height: 1,
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        zIndex: 10,
                    }}
                />

                {/* draggable center */}
                <View
                    style={{
                        position: 'absolute',
                        left: x,
                        top: y,
                        width: w,
                        height: h,
                        zIndex: 5,
                    }}
                    {...panCenter.panHandlers}
                />

                {/* corner handles with large hit areas */}
                <View style={cornerStyle('tl')} />
                <View
                    style={{
                        position: 'absolute',
                        left: x - HANDLE_HIT / 2,
                        top: y - HANDLE_HIT / 2,
                        width: HANDLE_HIT,
                        height: HANDLE_HIT,
                        zIndex: 30,
                    }}
                    {...panTL.panHandlers}
                />

                <View style={cornerStyle('tr')} />
                <View
                    style={{
                        position: 'absolute',
                        left: x + w - HANDLE_HIT / 2,
                        top: y - HANDLE_HIT / 2,
                        width: HANDLE_HIT,
                        height: HANDLE_HIT,
                        zIndex: 30,
                    }}
                    {...panTR.panHandlers}
                />

                <View style={cornerStyle('bl')} />
                <View
                    style={{
                        position: 'absolute',
                        left: x - HANDLE_HIT / 2,
                        top: y + h - HANDLE_HIT / 2,
                        width: HANDLE_HIT,
                        height: HANDLE_HIT,
                        zIndex: 30,
                    }}
                    {...panBL.panHandlers}
                />

                <View style={cornerStyle('br')} />
                <View
                    style={{
                        position: 'absolute',
                        left: x + w - HANDLE_HIT / 2,
                        top: y + h - HANDLE_HIT / 2,
                        width: HANDLE_HIT,
                        height: HANDLE_HIT,
                        zIndex: 30,
                    }}
                    {...panBR.panHandlers}
                />
            </>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Image area */}
            <View
                style={[
                    styles.imageArea,
                    {
                        width: layout.dispW,
                        height: layout.dispH,
                        marginLeft: layout.offsetX,
                        marginTop: layout.offsetY,
                    },
                ]}
            >
                <Image
                    source={{ uri: imageUri }}
                    style={{ width: layout.dispW, height: layout.dispH }}
                    resizeMode="cover"
                />
                {renderOverlay()}
                {renderCropBox()}
            </View>

            {/* Bottom button bar – solid background, always visible */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <Text style={styles.instructionText}>Drag corners to crop</Text>

                <TouchableOpacity style={styles.cropBtn} onPress={handleCrop}>
                    <Text style={styles.cropText}>Crop</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1C1C1E',
    },
    imageArea: {
        position: 'relative',
        overflow: 'visible', // allow handles to extend slightly beyond image bounds
    },
    overlay: {
        position: 'absolute',
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        zIndex: 2,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1C1C1E',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: 32, // extra padding for gesture bar
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    cancelBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    cancelText: {
        color: '#FF453A',
        fontSize: 17,
        fontWeight: '500',
    },
    instructionText: {
        color: '#8E8E93',
        fontSize: 13,
    },
    cropBtn: {
        backgroundColor: '#007AFF',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 10,
    },
    cropText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
});
