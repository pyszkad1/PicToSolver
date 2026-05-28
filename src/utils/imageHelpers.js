import * as ImagePicker from 'expo-image-picker';

export const pickImageFromGallery = async () => {
    // Pick WITHOUT native editing/crop — the native crop UI is fullscreen
    // on gallery images making buttons invisible. We use our own CropScreen instead.
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: false,
    });

    if (result.canceled) return null;

    const asset = result.assets[0];
    return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
    };
};

export const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
        alert("You've refused to allow this app to access your camera!");
        return null;
    }

    // Skip native crop — use our custom CropScreen for consistent UX
    const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.7,
        base64: false,
    });

    if (!result.canceled) {
        const asset = result.assets[0];
        return {
            uri: asset.uri,
            width: asset.width,
            height: asset.height,
        };
    }
    return null;
};
