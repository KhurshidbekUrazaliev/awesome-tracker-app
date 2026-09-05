import { useState } from 'react';

export function useNetwork() {
  // Note: For full implementation, install @react-native-community/netinfo
  // This is a simplified version — simulated as always-on wifi.
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [connectionType, setConnectionType] = useState<string>('wifi');

  const refresh = async () => {
    setIsConnected(true);
  };

  return {
    isConnected,
    connectionType,
    isOnline: isConnected,
    refresh,
  };
}
