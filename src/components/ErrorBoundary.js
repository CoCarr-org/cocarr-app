import React, { Component } from 'react';
import { View, Text, Button } from 'react-native';

import { C } from '../theme';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state to show fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Log the error or send to crash reporting service
    console.log(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.background, padding: 24, gap: 8 }}>
          <Text style={{ color: C.text, fontSize: 16, fontWeight: '600', textAlign: 'center' }}>Something went wrong.</Text>
          <Text style={{ color: C.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: 12 }}>
            Please try again. If this keeps happening, restart the app.
          </Text>
          <Button title="Retry" color={C.primaryText} onPress={() => this.setState({ hasError: false })} />
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
