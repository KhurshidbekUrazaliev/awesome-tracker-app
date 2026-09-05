import React from 'react';
import { View } from 'react-native';
import NotificationToggle from './NotificationToggle';
import { useSettingsStore } from '../store/useSettingsStore';

export default function SecuritySettings() {
  const { security, updateSecurity } = useSettingsStore();

  return (
    <View className="bg-white dark:bg-navy-800 rounded-lg p-4">
      <NotificationToggle
        title="Two-Factor Authentication"
        description="Add an extra layer of security to your account"
        value={security.twoFactorEnabled}
        onValueChange={(value) => updateSecurity({ twoFactorEnabled: value })}
      />
      <NotificationToggle
        title="Biometric Login"
        description="Use fingerprint or face ID to login"
        value={security.biometricEnabled}
        onValueChange={(value) => updateSecurity({ biometricEnabled: value })}
      />
    </View>
  );
}
