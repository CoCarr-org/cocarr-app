import { StyleSheet, View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from "./CustomText";

// Sub-page header used across the booking / schedule / profile screens.
//
// Restyled to match TopBar (the tab-shell header): safe-area aware, back chevron
// and title on the left, so a screen with this header and a screen with the
// shared stack header read the same. It keeps the extras the stack header can't
// carry — a subtitle (customSecondaryText) and a right-hand action button
// (rightComponent) — which is why these screens keep their own header rather
// than using the shared one.
//
// The `position`/`showBackButton` props are preserved for callers.
const Header = ({ navigation, title, showBackButton = true, customSecondaryText = false, rightComponent = null }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ backgroundColor: '#000', paddingTop: insets.top }}>
      <View style={styles.headerContainer}>
        {showBackButton && (
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack?.()}>
            <Icon name="chevron-back" size={24} color="#e3e3e3" />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <CustomText fontType='primary' weight='Bold' numberOfLines={1} style={styles.titleText}>{title}</CustomText>
          {customSecondaryText ? (
            <CustomText fontType='primary' weight='Medium' numberOfLines={1} style={styles.secondaryText}>{customSecondaryText}</CustomText>
          ) : null}
        </View>
        {rightComponent ? <View style={{ marginLeft: 12 }}>{rightComponent}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: {
    padding: 6,
    marginLeft: -6,
    marginRight: 4,
  },
  titleText: {
    color: '#f0f0f2',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  secondaryText: {
    color: '#8a8a8a',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.15,
    marginTop: 1,
  },
})

export default Header;
