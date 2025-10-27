import { useEffect, useState } from 'react';

export function useNetwork() {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  // Note: For full implementation, install @react-native-community/netinfo
  // This is a simplified version
  useEffect(() => {
    // Simulate network check
    setIsConnected(true);
    setConnectionType('wifi');
  }, []);

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
