import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import { API_URL } from '../../../utils/constants';
import Ionicons from 'react-native-vector-icons/Ionicons'
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesomeOld from 'react-native-vector-icons/FontAwesome';
import { useSelector } from 'react-redux';
import { formatDate, photoUrl } from '../../../utils/utils';
import ActionSheet,{ScrollView as ActionSheetScrollView } from 'react-native-actions-sheet';
import Carousel from 'react-native-reanimated-carousel';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome6';
import CustomText from '../../../components/CustomText';
import Slider from '@react-native-community/slider';
import Octicons from 'react-native-vector-icons/Octicons';

import { C, themedStyleSheet } from '../../../theme';

// Cars awaiting admin approval surface first so hosts notice them.
const rankCar = (v) => (v.isDraft ? 2 : v.isAdminApproved ? 1 : 0);
const sortByApproval = (list) => [...(list || [])].sort((a, b) => rankCar(a) - rankCar(b));

export function HostCarsScreen() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const navigation = useNavigation();
  const route = useRoute();
  // Live / Pending / All status filter. Seeded from the KPI tile on the host
  // home (navigate('HostCars', { statusFilter: 'live' })).
  const [statusFilter, setStatusFilter] = useState(route.params?.statusFilter || 'all');
  useEffect(() => {
    if (route.params?.statusFilter) setStatusFilter(route.params.statusFilter);
  }, [route.params?.statusFilter]);
  const [filters, setFilters] = useState({maxPrice:0,minPrice:0,distance:0,deliveryType:[],userRating:0,vehicleType:[],vehicleFuelType:[],vehicleSeats:[],vehicleTransmissionType:[]})
  const bottomSheetRef = useRef(null);
  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [sort, setSort] = useState('distance')
  const sortRef = useRef(null);
  const [selectedFilters, setSelectedFilters] = useState({})
  const { startDateTime, endDateTime,selectedCity,selectedLocation } = useSelector((state) => state.booking);
  const [isFilterApplied, setIsFilterApplied] = useState(filters.maxPrice > 0 || filters.minPrice > 0 || filters.distance > 0 || filters.deliveryType.length > 0 || filters.userRating > 0 || filters.vehicleType.length > 0 || filters.vehicleFuelType.length > 0 || filters.vehicleSeats.length > 0 || filters.vehicleTransmissionType.length > 0);
  
  
  
    useEffect(() => {
      fetchVehicles();
    }, [sort,filters,startDateTime,endDateTime]);
    

  const fetchVehicles = async (refresh = false) => {
    try {
      console.log('selectedLocation',selectedLocation)
      if(!refresh) setLoading(true)
        else setRefreshing(true)
      const now = new Date();
      let queryParams = ''

      const response = await axios.get(`${API_URL}/host/vehicles?offset=0&limit=30&sortBy=${sort}`);
      setVehicles(sortByApproval(response.data.vehicles));
      console.log('response.data',response.data)
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
        console.log('error',err.message)
      setLoading(false);
      setRefreshing(false);
    }
  };

  // (Removed the decorative city/date bar: the host list query ignores it,
  //  and the tab already shows a "Cars" header.)

  
  useEffect(() => {
    if (showSort) {
      sortRef.current.show();
    }
  }, [showSort]);



  const onFilterSubmit = (localFilters) => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.hide()
    }
    setFilters(localFilters)
    setShowFilter(false)
  }

  const clearAll = () => {
    setFilters({maxPrice:0,minPrice:0,distance:0,deliveryType:[],userRating:[],vehicleType:[],vehicleFuelType:[],vehicleSeats:[],vehicleTransmissionType:[]})
    setShowFilter(false)
  }

  const renderVehicleItem = ({ item:car ,index}) => {
    const width = Dimensions.get('window').width;
    // console.log('item',item)

    return (
      <TouchableOpacity key={index} onPress={()=>navigation.navigate('HostCarInfo', {vehicleId:car.id})} style={{marginRight: 16,marginLeft:0, backgroundColor:C.surface,borderRadius:10,flexDirection:'row',width:'100%',marginBottom:16,overflow:'hidden'}}>
      {car.images && car.images.length > 0 && <Image source={{uri:photoUrl(car.images[0].url)}} style={{width:100, height:80, backgroundColor:C.surfaceHigh,position:'relative',top:0,left:0,right:0,bottom:0}}/>}
      <View style={{flexDirection:'column', justifyContent:'center', alignItems:'flex-start',paddingVertical:10,paddingHorizontal:12}}>
        <CustomText fontType='primary' weight='Medium' style={{color:C.textSecondary, fontSize:10}}>{car.vehicleNumber}</CustomText>
        <CustomText fontType='primary' weight='Regular' style={{color:C.text, fontSize:12}}>{car.brand?.name} {car.vehicleName}</CustomText>
        {/* Status chip beside the details — never over the photo. */}
        <View style={{flexDirection:'row', alignItems:'center', marginTop:5}}>
          {car.isDraft ? (
            <View style={{flexDirection:'row',alignItems:'center',gap:5,backgroundColor:C.surface,borderWidth:1,borderColor:C.borderStrong,borderRadius:100,paddingVertical:2,paddingHorizontal:8}}>
              <View style={{width:5,height:5,borderRadius:5,backgroundColor:C.disabled}} />
              <CustomText fontType='primary' weight='Bold' style={{color:C.textSecondary, fontSize: 11,letterSpacing:.15}}>Not Completed</CustomText>
            </View>
          ) : car.approvalStatus === 'rejected' ? (
            <View style={{flexDirection:'row',alignItems:'center',gap:5,backgroundColor:'#ef444422',borderWidth:1,borderColor:'#ef444459',borderRadius:100,paddingVertical:2,paddingHorizontal:8}}>
              <View style={{width:5,height:5,borderRadius:5,backgroundColor:C.danger}} />
              <CustomText fontType='primary' weight='Bold' style={{color:C.danger, fontSize: 11,letterSpacing:.15}}>Changes Needed</CustomText>
            </View>
          ) : car.isAdminApproved === false ? (
            <View style={{flexDirection:'row',alignItems:'center',gap:5,backgroundColor:'#EDBF3122',borderWidth:1,borderColor:'#EDBF3166',borderRadius:100,paddingVertical:2,paddingHorizontal:8}}>
              <View style={{width:5,height:5,borderRadius:5,backgroundColor:C.primary}} />
              <CustomText fontType='primary' weight='Bold' style={{color:C.primaryText, fontSize: 11,letterSpacing:.15}}>Pending Approval</CustomText>
            </View>
          ) : (
            <View style={{flexDirection:'row',alignItems:'center',gap:5,backgroundColor:'#3fce8f22',borderWidth:1,borderColor:'#3fce8f59',borderRadius:100,paddingVertical:2,paddingHorizontal:8}}>
              <View style={{width:5,height:5,borderRadius:5,backgroundColor:C.success}} />
              <CustomText fontType='primary' weight='Bold' style={{color:C.success, fontSize: 11,letterSpacing:.15}}>Live</CustomText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
    );
}


  if (error) { 
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Title is the shared header now (TopBar / stack header). */}
      <TopPillBlock sort={sort} isFilterApplied={isFilterApplied} filters={filters} setShowSort={setShowSort} setShowFilter={setShowFilter} setFilters={setFilters}/>
      <StatusFilterChips value={statusFilter} onChange={setStatusFilter} vehicles={vehicles} />
      <FlatList
        data={statusFilter === 'all' ? vehicles : vehicles.filter((v) => (statusFilter === 'live' ? (!v.isDraft && v.isAdminApproved) : statusFilter === 'pending' ? (!v.isDraft && !v.isAdminApproved) : v.isDraft))}
        refreshControl={<RefreshControl progressBackgroundColor={C.background} tintColor={C.primaryText} colors={[C.primary]} onRefresh={()=>fetchVehicles('refresh')} refreshing={refreshing}/>}
        renderItem={renderVehicleItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />

      {/* {showFilter && <FilterModal clearAll={clearAll} onFilterSubmit={onFilterSubmit} showFilter={showFilter} setShowFilter={setShowFilter} filters={filters} setFilters={setFilters}/>} */}
      {/* <SortModal actionRef={sortRef} setShowSort={setShowSort} sort={sort} setSort={setSort}/> */}
      {loading && <LoaderScreen/>}
    </View>
  );
}

// Live / Pending / Draft / All status chips with per-status counts.
const StatusFilterChips = ({ value, onChange, vehicles }) => {
  const counts = {
    all: vehicles.length,
    live: vehicles.filter((v) => !v.isDraft && v.isAdminApproved).length,
    pending: vehicles.filter((v) => !v.isDraft && !v.isAdminApproved).length,
    draft: vehicles.filter((v) => v.isDraft).length,
  };
  const chips = [
    { id: 'all', label: 'All' },
    { id: 'live', label: 'Live' },
    { id: 'pending', label: 'Pending' },
    { id: 'draft', label: 'Draft' },
  ];
  return (
    <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 }}>
      {chips.map((c) => {
        const active = value === c.id;
        return (
          <TouchableOpacity key={c.id} onPress={() => onChange(c.id)} activeOpacity={0.8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 20, backgroundColor: active ? C.primary : C.surface, borderWidth: 1, borderColor: active ? C.primary : C.borderStrong }}>
            <CustomText fontType='primary' weight='Bold' style={{ color: active ? C.onPrimary : C.textSecondary, fontSize: 11 }}>{c.label}</CustomText>
            <CustomText fontType='primary' weight='Bold' style={{ color: active ? C.onPrimary : C.textTertiary, fontSize: 11 }}>{counts[c.id]}</CustomText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const LoaderScreen = () => {
  return (
    <View style={{...styles.centered,position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'#00000099',zIndex:1}}>
      <ActivityIndicator size="large" color={C.primaryText} />
    </View>
  );
}



const TopPillBlock = ({filters,setShowSort,setShowFilter,setFilters,isFilterApplied,sort}) => {


  const SortButton = () => (
    <TouchableOpacity style={{...styles.filterItem}} onPress={() => setShowSort(true)}>
      <Octicons name="dot-fill" size={16} color={`${sort ? C.primary : C.borderStrong}`} style={{marginRight:8,marginBottom:-2}} />
      <CustomText fontType='primary' weight='Medium' style={styles.filterItemText}>Sort By</CustomText>
      <Feather name="chevron-down" size={12} color={C.textSecondary} style={{marginLeft:4}} />
    </TouchableOpacity>
  )
  const FilterButton = () => (
    <TouchableOpacity style={{...styles.filterItem}} onPress={() => setShowFilter(true)}>
      <Octicons name="dot-fill" size={16} color={`${isFilterApplied ? C.primary : C.borderStrong}`} style={{marginRight:8,marginBottom:-2}} />
      <CustomText fontType='primary' weight='Medium' style={styles.filterItemText}>Filter</CustomText>
      <Feather name="filter" size={12} color={C.textSecondary} style={{marginLeft:4}} />
    </TouchableOpacity>
  )
  const LuxuryFilterButton = ({onPress}) => (
    <TouchableOpacity style={[styles.filterItem,filters.vehicleType && filters.vehicleType.includes('luxury') ? {backgroundColor:C.primary} : {backgroundColor:C.surface}]} onPress={onPress}>
      <FontAwesome name="crown" size={11} color={filters.vehicleType && filters.vehicleType.includes('luxury') ? C.onPrimary : C.textSecondary} style={{marginRight:6}} />
      <CustomText fontType='primary' weight='Medium' style={{...styles.filterItemText,color:filters.vehicleType && filters.vehicleType.includes('luxury') ? C.onPrimary : C.textSecondary}}>Luxury</CustomText>
    </TouchableOpacity>
  )
  const DynamicFilterButton = ({name,onPress,value,category}) => (
    <TouchableOpacity style={[styles.filterItem,filters[category] && filters[category].includes(value) ? {backgroundColor:C.primary} : {backgroundColor:C.surface}]} onPress={onPress}>
      <CustomText fontType='primary' weight='Medium' style={{...styles.filterItemText,color:filters[category] && filters[category].includes(value) ? C.onPrimary : C.textSecondary}}>{name}</CustomText>
    </TouchableOpacity>
  )

  const onPress = (value, category) => {
    setFilters(prevFilters => {
      const isSelected = prevFilters[category].includes(value);
      if (isSelected) {
        return {
          ...prevFilters,
          [category]: prevFilters[category].filter(item => item !== value)
        };
      } else {
        return {
          ...prevFilters,
          [category]: [...prevFilters[category], value]
        };
      }``
    });
  }
  return (
    <View style={{flexDirection:'row',justifyContent:'flex-start',alignItems:'center',paddingHorizontal:12,paddingVertical:8}}>

    </View>
  )
}

const styles = themedStyleSheet(C => ({
  sortTitle: {
    color: C.textTertiary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  modalFilterItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    // borderRadius: 4,
    // marginRight: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.danger,
    // backgroundColor: '#02020e',
  },

  filterItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    flexDirection:'row',
    justifyContent:'center',
    alignItems:'center',
    marginRight: 8,
    borderWidth: 1,
    // borderColor: '#252525',
    backgroundColor: C.surface,
  },

  modalFilterItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    flexDirection:'row',
    justifyContent:'center',
    alignItems:'center',
    marginRight: 8,
    // borderWidth: 1,
    // borderColor: '#252525',
    backgroundColor: C.surfaceHigh,
  },

  filterItemText: {
    color: C.textSecondary,
    letterSpacing: -0.05,
    fontSize: 12,
  },

  container: {
    flex: 1,
    position:'relative',
    backgroundColor: C.background,
  },

  headerBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical:8,
    paddingTop:16,
  },

  headerBlockLeft: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  headerPrimaryText: {
    fontSize: 11,
    color: C.textSecondary,
  },

  listContainer: {
    padding: 16,
  },

  header: {
    padding: 16,
    backgroundColor: C.background,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },

  vehicleItem: {
    flexDirection: 'column',
    marginBottom: 16,
    backgroundColor: C.surface,
    borderRadius: 12,
    paddingVertical:0,
    paddingHorizontal:0,
    position:'relative',
    overflow: 'hidden',
  },

  blockSecText: {
    fontSize: 12,
    color: C.text,
  },

  vehicleImage: {
    // borderRadius:12,
    width: 240,
    height: 180,
  },

  vehicleInfo: {
    flex: 1,
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center',
    width:'100%',
    paddingVertical: 16,
    paddingHorizontal:16,
    // justifyContent: 'center',
  },

  vehicleInfoText: {
    fontSize: 12,
    color: C.text,
  },

  vehicleName: {
    fontSize: 14,
    color: C.text,
    marginBottom: 2,
  },

  vehiclePrice: {
    // paddingHorizontal:16,
  },

  vehiclePriceText: {
    fontSize: 18,
    marginTop: 4,
    fontWeight: '500',
    color: C.text,
  },

  vehicleYear: {
    fontSize: 16,
    color: C.primaryText,
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.background,
  },

  errorText: {
    color: C.danger,
    fontSize: 18,
  },

  sortItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },

  sortItemText: {
    color: C.text,
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  }
}));
