import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '../../components/CustomText';
import { BRAND_COLOR } from '../../utils/constants';

// Membership tab: a benefits-first landing page. "Join as a member" hands off to
// the existing PremiumMembership screen, which runs the actual purchase flow, so
// the checkout logic lives in one place.

const BENEFITS = [
  { icon: 'calendar-outline', title: '1 free usage day', desc: 'A full day on us, every membership cycle.' },
  { icon: 'car-outline', title: 'Free delivery', desc: 'One free doorstep delivery — skip the pickup.' },
  { icon: 'speedometer-outline', title: 'Unlimited kilometres', desc: 'No distance caps on your trips.' },
  { icon: 'pricetags-outline', title: 'Exclusive discounts', desc: 'Member-only rates across the fleet.' },
  { icon: 'shield-checkmark-outline', title: 'No deposit', desc: 'Book without leaving a security deposit.' },
  { icon: 'swap-horizontal-outline', title: 'Car replacement', desc: 'A backup car if yours is unavailable.' },
  { icon: 'headset-outline', title: '24/7 support', desc: 'Priority help, any hour of the day.' },
  { icon: 'star-outline', title: 'Cocarr Club access', desc: 'Perks and early access reserved for members.' },
];

export default function MembershipScreen() {
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={{ margin: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: '#161510', borderWidth: 1, borderColor: '#EDBF3140', padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: BRAND_COLOR, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="star" size={18} color="#000" />
            </View>
            <CustomText fontType='primary' weight='Bold' style={{ color: BRAND_COLOR, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Cocarr Premium</CustomText>
          </View>
          <CustomText fontType='primary' weight='Bold' style={{ color: '#f2f2f4', fontSize: 22, letterSpacing: -0.4, marginBottom: 6 }}>
            Drive more, pay less.
          </CustomText>
          <CustomText fontType='primary' weight='Regular' style={{ color: '#a3a3a3', fontSize: 13, lineHeight: 19 }}>
            Membership unlocks free days, no deposits, unlimited kilometres and member-only pricing on every booking.
          </CustomText>
        </View>

        {/* Benefits */}
        <CustomText fontType='primary' weight='Bold' style={{ color: '#757575', fontSize: 11, letterSpacing: .15, textTransform: 'uppercase', marginHorizontal: 16, marginBottom: 10 }}>
          What you get
        </CustomText>

        <View style={{ marginHorizontal: 16, backgroundColor: '#141416', borderRadius: 14, borderWidth: 1, borderColor: '#232327', overflow: 'hidden' }}>
          {BENEFITS.map((b, i) => (
            <View key={b.title} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: '#1f1f23' }}>
              <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#EDBF3115', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={b.icon} size={18} color={BRAND_COLOR} />
              </View>
              <View style={{ flex: 1 }}>
                <CustomText fontType='primary' weight='SemiBold' style={{ color: '#e8e8ea', fontSize: 14 }}>{b.title}</CustomText>
                <CustomText fontType='primary' weight='Regular' style={{ color: '#8a8a8a', fontSize: 12, marginTop: 1 }}>{b.desc}</CustomText>
              </View>
              <Icon name="checkmark-circle" size={20} color={BRAND_COLOR} />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky join CTA */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28, backgroundColor: '#000', borderTopWidth: 1, borderTopColor: '#1c1c1e' }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('PremiumMembership')}
          activeOpacity={0.85}
          style={{ backgroundColor: BRAND_COLOR, borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
        >
          <CustomText fontType='primary' weight='Bold' style={{ color: '#000', fontSize: 14, letterSpacing: .2 }}>Join as a member</CustomText>
        </TouchableOpacity>
      </View>
    </View>
  );
}
