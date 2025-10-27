import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ModalProps as RNModalProps,
} from 'react-native';

interface ModalProps extends RNModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export default function Modal({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeOnBackdrop = true,
  size = 'md',
  ...props
}: ModalProps) {
  const sizeClasses = {
    sm: 'w-3/4',
    md: 'w-11/12',
    lg: 'w-full mx-4',
    full: 'w-full h-full',
  };

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      {...props}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View className="flex-1 bg-black/50 justify-center items-center">
          <TouchableWithoutFeedback>
            <View className={`${sizeClasses[size]} bg-white rounded-xl p-6 ${size === 'full' ? '' : 'max-h-[80%]'}`}>
              {/* Header */}
              {(title || showCloseButton) && (
                <View className="flex-row justify-between items-center mb-4">
                  {title && <Text className="text-xl font-bold text-gray-900">{title}</Text>}
                  {showCloseButton && (
                    <TouchableOpacity onPress={onClose} className="p-2">
                      <Text className="text-2xl text-gray-500">×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Content */}
              <View className="flex-1">{children}</View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}
