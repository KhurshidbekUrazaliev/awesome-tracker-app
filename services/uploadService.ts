import * as ImagePicker from 'expo-image-picker';
import apiClient from './apiClient';

interface UploadResult {
  url: string;
  fileName: string;
  fileSize: number;
}

class UploadService {
  async requestMediaLibraryPermissions(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }

  async requestCameraPermissions(): Promise<boolean> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  }

  async pickImage(): Promise<ImagePicker.ImagePickerAsset | null> {
    const hasPermission = await this.requestMediaLibraryPermissions();
    if (!hasPermission) {
      throw new Error('Media library permission denied');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      return result.assets[0];
    }

    return null;
  }

  async takePhoto(): Promise<ImagePicker.ImagePickerAsset | null> {
    const hasPermission = await this.requestCameraPermissions();
    if (!hasPermission) {
      throw new Error('Camera permission denied');
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      return result.assets[0];
    }

    return null;
  }

  async uploadFile(uri: string, fieldName = 'file'): Promise<UploadResult> {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'upload';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append(fieldName, {
      uri,
      name: filename,
      type,
    } as any);

    const response = await apiClient.post<UploadResult>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }
}

export default new UploadService();
