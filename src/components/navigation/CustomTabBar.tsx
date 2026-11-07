import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Animated, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

import { C, themedStyleSheet } from '../../theme';

const { width } = Dimensions.get('window');

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export const CustomTabBar = ({ state, descriptors, navigation }: TabBarProps) => {
  // Create refs for animations
  const slideAnims = useRef(state.routes.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Animate the initial active tab
    animateSlide(state.index, true);
  }, []);

  const animateSlide = (index: number, isActive: boolean) => {
    Animated.spring(slideAnims[index], {
      toValue: isActive ? 1 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7
    }).start();
  };

  return (
    <View style={styles.container}>
      <View style={styles.curvedBackground}>
        <LinearGradient colors={[C.background, C.background,C.background, C.inverseSurface,C.background,C.background, C.background]} start={{x:0,y:0}} end={{x:1,y:0}} style={{height:24,width:'100%',borderRadius:100}}>

        </LinearGradient>
        </View>
      <View style={styles.content}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const slideAnim = slideAnims[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0, -10]
          });

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }

            // Animate all tabs
            state.routes.forEach((_, i: number) => {
              animateSlide(i, i === index);
            });
          };

          return (
            <TouchableOpacity
              key={index}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <Animated.View style={[
                styles.iconContainer,
                { transform: [{ translateY: slideAnim }] }
              ]}>
                <Icon
                  name={options.tabBarIcon({ 
                    focused: isFocused,
                    color: isFocused ? C.primaryText : C.textTertiary,
                    size: 24
                  }).props.name}
                  size={24}
                  color={isFocused ? C.primaryText : C.textTertiary}
                />
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = themedStyleSheet(C => ({
  container: {
    height: 60,
    backgroundColor: C.background,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  curvedBackground: {
    position: 'absolute',
    overflow:'hidden',
    bottom: -380,
    left: '-50%',
    right: 0,
    zIndex:-100,
    width: '225%',
    height: 450,
    // backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 400,
    borderTopRightRadius: 400,
    // borderWidth: 1,
    // borderColor: '#454545',
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: '100%',
  },

  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
  }
})); 