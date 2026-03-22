import * as ImagePicker from 'expo-image-picker';

export const pickImageFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // Re-enabled so user can isolate one board
        quality: 0.7,
        base64: true,
    });

    if (!result.canceled) {
        return result.assets[0];
    }
    return null;
};

export const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
        alert("You've refused to allow this app to access your camera!");
        return null;
    }

    const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true, // Re-enabled so user can isolate one board
        quality: 0.7,
        base64: true,
    });

    if (!result.canceled) {
        return result.assets[0];
    }
    return null;
};
