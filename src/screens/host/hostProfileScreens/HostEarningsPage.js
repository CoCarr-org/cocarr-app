import React, { useEffect, useMemo, useState } from 'react';
import { View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import axios from 'axios';
import { API_URL, BRAND_COLOR } from '../../../utils/constants';
import { formatDate, photoUrl } from '../../../utils/utils';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '../../../components/CustomText';

// Mirrors the web host earnings page: per-booking net earnings after the
// platform commission, split into received (completed rides) and pending
// (active/upcoming), with total/received/pending tiles and a tab filter.

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const RECEIVED = new Set(['finished']);
const PENDING = new Set(['booked', 'ongoing']);
const carTitle = (v = {}) => [v.brand?.name, v.vehicleName || v.name].filter(Boolean).join(' ') || 'Car';
const carImg = (v = {}) => {
  const ph = (v.images || []).filter((i) => !i.isDeleted);
  return ph.find((i) => i.isCover)?.url || ph[0]?.url;
};

export default function HostEarningsPage() {
  const [bookings, setBookings] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [commission, setCommission] = useState(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('all'); // all | received | pending

  const load = async () => {
    try {
      const [bRes, wRes, cRes] = await Promise.all([
        axios.get(`${API_URL}/host/bookings?populate=true&sortBy=-createdAt&offset=0&limit=100`),
        axios.get(`${API_URL}/wallet/my-wallet`).catch(() => ({ data: null })),
        axios.get(`${API_URL}/host/commissions/active`).catch(() => ({ data: null })),
      ]);
      setBookings(bRes.data?.bookings || bRes.data?.data || []);
      setWallet(wRes.data?.wallet || wRes.data?.data || wRes.data || null);
      const c = cRes.data?.commission ?? cRes.data;
      if (c?.commissionPercentage != null) setCommission(Number(c.commissionPercentage));
    } catch (error) {
      console.log('Earnings load error:', error?.response?.data || error?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Net earning per booking after the platform fee.
  const rows = useMemo(() => (
    bookings
      .filter((b) => b.status !== 'cancelled' && b.status !== 'initiated')
      .map((b) => {
        const gross = Number(b.totalAmount || b.amount || 0);
        const fee = Math.round((gross * commission) / 100);
        const net = gross - fee;
        const state = RECEIVED.has(b.status) ? 'received' : 'pending';
        return { b, gross, fee, net, state };
      })
  ), [bookings, commission]);

  const totals = useMemo(() => {
    let total = 0, received = 0, pending = 0;
    for (const r of rows) {
      total += r.net;
      if (r.state === 'received') received += r.net; else pending += r.net;
    }
    return { total, received, pending };
  }, [rows]);

  const shown = tab === 'all' ? rows : rows.filter((r) => r.state === tab);

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}><ActivityIndicator size="large" color={BRAND_COLOR} /></View>;
  }

  const Tile = ({ label, value, sub, accent }) => (
    <View style={{ flex: 1, backgroundColor: '#141416', borderRadius: 14, borderWidth: 1, borderColor: accent ? `${accent}44` : '#232327', padding: 14 }}>
      <CustomText fontType='primary' weight='SemiBold' style={{ color: '#8a8a8a', fontSize: 10, textTransform: 'uppercase', letterSpacing: .3 }}>{label}</CustomText>
      <CustomText fontType='primary' weight='Bold' style={{ color: accent || '#f0f0f2', fontSize: 19, letterSpacing: -.4, marginTop: 4 }}>{value}</CustomText>
      <CustomText fontType='primary' weight='Regular' style={{ color: '#6f6f76', fontSize: 10, marginTop: 1 }}>{sub}</CustomText>
    </View>
  );

  const Tab = ({ id, label }) => (
    <TouchableOpacity onPress={() => setTab(id)} style={{ flex: 1, paddingVertical: 9, borderRadius: 8, backgroundColor: tab === id ? '#232327' : 'transparent', alignItems: 'center' }}>
      <CustomText fontType='primary' weight='Bold' style={{ color: tab === id ? BRAND_COLOR : '#8a8a8a', fontSize: 11, textTransform: 'uppercase', letterSpacing: .3 }}>{label}</CustomText>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <FlatList
        data={shown}
        keyExtractor={(r) => String(r.b.id)}
        refreshControl={<RefreshControl tintColor={BRAND_COLOR} colors={[BRAND_COLOR]} progressBackgroundColor="#000" refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListHeaderComponent={
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <Tile label="Total" value={inr(totals.total)} sub={`${rows.length} booking${rows.length === 1 ? '' : 's'}`} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Tile label="Received" value={inr(totals.received)} sub="Completed" accent="#3fce8f" />
              <Tile label="Pending" value={inr(totals.pending)} sub="Upcoming" accent={BRAND_COLOR} />
            </View>
            <CustomText fontType='primary' weight='Regular' style={{ color: '#5a5a62', fontSize: 11, marginTop: 8 }}>
              Net of the {commission}% platform fee.
            </CustomText>
            <View style={{ flexDirection: 'row', backgroundColor: '#141416', borderRadius: 10, padding: 4, marginTop: 14, borderWidth: 1, borderColor: '#232327' }}>
              <Tab id="all" label="All" />
              <Tab id="received" label="Received" />
              <Tab id="pending" label="Pending" />
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const v = item.b.vehicle || {};
          const img = carImg(v);
          return (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#161618' }}>
              <View style={{ width: 46, height: 46, borderRadius: 10, backgroundColor: '#1c1c1e', overflow: 'hidden' }}>
                {img ? <Image source={{ uri: photoUrl(img) }} style={{ width: '100%', height: '100%' }} /> : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Icon name="car-outline" size={18} color="#5a5a62" /></View>}
              </View>
              <View style={{ flex: 1 }}>
                <CustomText fontType='primary' weight='SemiBold' numberOfLines={1} style={{ color: '#e8e8ea', fontSize: 13 }}>{carTitle(v)}</CustomText>
                <CustomText fontType='primary' weight='Regular' style={{ color: '#8a8a8a', fontSize: 11 }}>{formatDate(item.b.startTime || item.b.createdAt, 'short')} · #{item.b.bookingId || item.b.id}</CustomText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <CustomText fontType='primary' weight='Bold' style={{ color: '#f0f0f2', fontSize: 14 }}>{inr(item.net)}</CustomText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 5, backgroundColor: item.state === 'received' ? '#6ee6b0' : BRAND_COLOR }} />
                  <CustomText fontType='primary' weight='Medium' style={{ color: item.state === 'received' ? '#6ee6b0' : BRAND_COLOR, fontSize: 10, textTransform: 'uppercase', letterSpacing: .3 }}>{item.state}</CustomText>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Icon name="cash-outline" size={30} color="#3a3a40" style={{ marginBottom: 8 }} />
            <CustomText fontType='primary' weight='Medium' style={{ color: '#757575', fontSize: 13 }}>No earnings in this view yet.</CustomText>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}
