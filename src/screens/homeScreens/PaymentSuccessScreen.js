import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export const PaymentSuccessScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { bookingDetails } = route.params;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.successIcon}>
        <Icon name="checkmark-circle" size={80} color="#EDBF31" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#808080',
    marginBottom: 30,
  },
  detailsContainer: {
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 30,
  },
  detailText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#EDBF31',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  homeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#EDBF31',
  },
  homeButtonText: {
    color: '#EDBF31',
  },
}); 