import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { C, themedStyleSheet } from '../../theme';

export const PaymentSuccessScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { bookingDetails } = route.params;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.successIcon}>
        <Icon name="checkmark-circle" size={80} color={C.primaryText} />
      </View>

      <Text style={styles.title}>Payment Successful!</Text>
      <Text style={styles.subtitle}>Your booking has been confirmed</Text>

      <View style={styles.detailsContainer}>
        <Text style={styles.detailText}>
          Booking ID: {bookingDetails.paymentId.slice(-8)}
        </Text>
        <Text style={styles.detailText}>
          Amount Paid: ₹{bookingDetails.totalAmount}
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('Rides')}
      >
        <Text style={styles.buttonText}>View Booking</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.homeButton]}
        onPress={() => navigation.navigate('HomeIndex')}
      >
        <Text style={[styles.buttonText, styles.homeButtonText]}>
          Back to Home
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = themedStyleSheet(C => ({
  container: {
    flex: 1,
    backgroundColor: C.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  successIcon: {
    marginBottom: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: C.text,
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    color: C.textTertiary,
    marginBottom: 30,
  },

  detailsContainer: {
    backgroundColor: C.surface,
    padding: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 30,
  },

  detailText: {
    color: C.text,
    fontSize: 16,
    marginBottom: 10,
  },

  button: {
    backgroundColor: C.primary,
    padding: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },

  buttonText: {
    color: C.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },

  homeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: C.primary,
  },

  homeButtonText: {
    color: C.primaryText,
  }
})); 