import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, Text, FlatList, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Dimensions, ScrollView, RefreshControl } from 'react-native';
import axios from 'axios';
import { API_URL, BRAND_COLOR } from '../../utils/constants';
import Ionicons from 'react-native-vector-icons/Ionicons'
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesomeOld from 'react-native-vector-icons/FontAwesome';
import { useSelector } from 'react-redux';
import { formatDate } from '../../utils/utils';
import ActionSheet,{ScrollView as ActionSheetScrollView } from 'react-native-actions-sheet';
import Carousel from 'react-native-reanimated-carousel';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome6';
import CustomText from '../../components/CustomText';
import Slider from '@react-native-community/slider';
import Octicons from 'react-native-vector-icons/Octicons';

export function CarsListingScreen() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const navigation = useNavigation();
  const [count, setCount] = useState(0)
  const [limit, setLimit] = useState(30)
  const [offset, setOffset] = useState(0)
  const [maxAvailablePrice, setMaxAvailablePrice] = useState(0)
  const [maxAvailableDistance, setMaxAvailableDistance] = useState(0)
  const filter = useState('all')
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
    }, [sort,filters]);
    
    useEffect(() => {
      setIsFilterApplied(filters.maxPrice > 0 || filters.minPrice > 0 || filters.distance > 0 || filters.deliveryType.length > 0 || filters.userRating > 0 || filters.vehicleType.length > 0 || filters.vehicleFuelType.length > 0 || filters.vehicleSeats.length > 0 || filters.vehicleTransmissionType.length > 0);
    }, [filters]);


  const fetchVehicles = async (refresh = false) => {
    try {
      if(!refresh) setLoading(true)
        else setRefreshing(true)
      const now = new Date();
      let queryParams = ''
      if(selectedLocation)
        {
          queryParams += `&lat=${selectedLocation.latitude}&lng=${selectedLocation.longitude}`
        }
      if (filters.maxPrice > 0) {
        queryParams += `&maxPrice=${filters.maxPrice}`
      }
      if (filters.minPrice > 0) {
        queryParams += `&minPrice=${filters.minPrice}`
      }
      if (filters.distance > 0) {
        queryParams += `&maxDistance=${filters.distance}`
      }
      if (filters.deliveryType.length > 0) {
        queryParams += `&deliveryType=${filters.deliveryType.join(',')}`
      }
      if (filters.userRating > 0) {
        queryParams += `&userRating=${filters.userRating}`
      }
      if (filters.vehicleType.length > 0) {
        queryParams += `&type=${filters.vehicleType.join(',')}`
      }
      if (filters.vehicleFuelType.length > 0) {
        queryParams += `&fuel=${filters.vehicleFuelType.join(',')}`
      }
      if (filters.vehicleSeats.length > 0) {
        queryParams += `&seats=${filters.vehicleSeats.join(',')}`
      }
      if (filters.vehicleTransmissionType.length > 0) {
        queryParams += `&vehicleTransmissionType=${filters.vehicleTransmissionType.join(',')}`
      }


      

      const startTime = Math.floor(new Date(startDateTime).getTime() / 1000); // Use startDateTime
      const endTime = Math.floor(new Date(endDateTime).getTime() / 1000); // Use endDateTime
      const response = await axios.get(`${API_URL}/vehicle?startTime=${startTime}&endTime=${endTime}&offset=${offset}&limit=${limit}&city=${selectedCity.id}&sortBy=${sort}${queryParams}`);
      setVehicles(response.data.vehicles);
      setCount(response.data.count)
      setMaxAvailablePrice(response.data.maxPrice)
      setMaxAvailableDistance(response.data.maxDistance)
      // console.log('response.data',response.data)
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
        console.log('error',err.message)
      setLoading(false);
      setRefreshing(false);
    }
  };

  const HeaderBlock = () => {
    return (
      <View style={styles.headerBlock}>
        <View style={styles.headerBlockLeft}>
          {/* Back lives in the header above now; this bar is the city/date
              filter only. */}
          <TouchableOpacity onPress={() => navigation.navigate('DatePicker')} style={styles.headerBlockContent}>
            <CustomText fontType='primary' weight='Medium' style={styles.blockSecText}>{selectedCity?.name}</CustomText>
            <CustomText fontType='primary' weight='Regular' style={styles.headerPrimaryText}>{formatDate(startDateTime,'long')} - {formatDate(endDateTime,'long')}</CustomText>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  
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

  const renderVehicleItem = ({ item }) => {
    const width = Dimensions.get('window').width;
    console.log('item',item)
    
    
    return <TouchableOpacity disabled={!item.isAvailable} onPress={()=>navigation.navigate('CarInfo',{vehicleId:item.vehicleId})} activeOpacity={0.8} style={{...styles.vehicleItem,opacity:item.isAvailable ? 1 : 0.5}}>
      <View style={{flex:1,position:'relative'}}>

      {item.images.length > 0 ? (
        <Carousel style={{width:'100%',height:200}} 
        loop
        width={width}
        height={200}
        autoPlay={false}
        data={item.images}
        scrollAnimationDuration={1000}
        pagingEnabled={true}
        snapEnabled={true}
        // dragEnabled={true}
        // autoPlayInterval={1000}
        key={item.vehicleId}
        
        onSnapToItem={(index) => console.log('current index:', index)}
        renderItem={({ item:it ,index}) => {
          // console.log('it',it)
          return (
            <View
            style={{
              flex: 1,
              borderWidth: 1,
              justifyContent: 'center',
            }}
            >
                <Image source={{ uri: it.url }} key={index} style={{width:width,height:200}}/>
            </View> 
            )
          }}
          />
        ) : null}

<View style={{flex:1,flexDirection:'column',position:'absolute',bottom:0,left:0,width:'100%'}}>
        <LinearGradient start={{x:0,y:1}} end={{x:0,y:0}} colors={['#000000','#00000000']} style={{flex:1,paddingHorizontal:12,paddingVertical:12,paddingTop:40}}>
          <View style={{flexDirection:'row',justifyContent:'flex-start',alignItems:'center'}}>
              <CustomText fontType='primary' weight='SemiBold' style={{color:'#a3a3a3',fontSize:11,letterSpacing:-0.05,textTransform:'uppercase'}}>{(item.rating)}</CustomText>
              <Icon name="star" size={14} color="#EDBF31" />
          </View>
          <CustomText fontType='primary' weight='SemiBold' style={{color:'#fff',fontSize:14,fontWeight:'500'}}>{item.vehicleName}</CustomText>
        <CustomText fontType='primary' weight='SemiBold' style={{color:'#c3c3c3',fontSize:11,letterSpacing:-0.05,textTransform:'uppercase'}}>{item.vehicleFuelType} · {item.vehicleSeats} Seater · {item.vehicleYear}</CustomText>
        </LinearGradient>
      </View>

        </View>

      <View style={styles.vehicleInfo}>
        <View style={{flexDirection:'row',justifyContent:'space-between'}}>
          <Icon name="location-outline" size={14} color="#a3a3a3" />
          <CustomText fontType='primary' weight='SemiBold' style={{color:'#a3a3a3',fontSize:11,letterSpacing:-0.05,textTransform:'uppercase'}}>{parseFloat(item.distance).toFixed(2)} km</CustomText>
        </View>
      <View style={styles.vehiclePrice}>
        <CustomText fontType='primary' weight='SemiBold' style={{color:'#fff',fontSize:14,letterSpacing:-0.05,textAlign:'right'}}>{item.isAvailable ? `Rs.${item.vehiclePlan[0].perHourFee}/hr` : 'Sold Out'}</CustomText>
        {item.isAvailable ?  <CustomText fontType='primary' weight='SemiBold' style={{color:'#a3a3a3',fontSize:11,letterSpacing:-0.05,textAlign:'right'}}>Total:Rs.{parseInt(item.totalFee)}</CustomText> : null}
      </View>
      </View>
    </TouchableOpacity>
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
      <HeaderBlock/>
      <TopPillBlock sort={sort} isFilterApplied={isFilterApplied} filters={filters} setShowSort={setShowSort} setShowFilter={setShowFilter} setFilters={setFilters}/>
      <FlatList 
        data={vehicles}
        refreshControl={<RefreshControl progressBackgroundColor='#000' tintColor={BRAND_COLOR} colors={[BRAND_COLOR]} onRefresh={()=>fetchVehicles('refresh')} refreshing={refreshing}/>}
        renderItem={renderVehicleItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />

      {showFilter && <FilterModal maxAvailablePrice={maxAvailablePrice} maxAvailableDistance={maxAvailableDistance} clearAll={clearAll} onFilterSubmit={onFilterSubmit} showFilter={showFilter} setShowFilter={setShowFilter} filters={filters} setFilters={setFilters}/>}
      <SortModal actionRef={sortRef} setShowSort={setShowSort} sort={sort} setSort={setSort}/>
      {loading && <LoaderScreen/>}
    </View>
  );
}

const LoaderScreen = () => {
  return (
    <View style={{...styles.centered,position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'#00000099',zIndex:1}}>
      <ActivityIndicator size="large" color="#EDBF31" />
    </View>
  )
}


const SortModal = ({actionRef,setShowSort,sort,setSort}) => {


  const onSort = (value) => {
    setSort(value)
    if (actionRef.current) {
      actionRef.current.hide();
    }
    setShowSort(false)
  }
  const [parentFilters, setParentFilters] = useState([{name:'Distance - Near to Far',value:'distance'},{name:'Price - Low to High',value:'price'},{name:'Price - High to Low',value:'-price'},{name:'Rating - High to Low',value:'-rating'},{name:'Rating - Low to High',value:'rating'}])
  return (
    <View>
      <ActionSheet ref={actionRef} onClose={() => setShowSort(false)} containerStyle={{backgroundColor:'#151515'}} safeAreaInsets={{bottom:24}} overlayColor='#000' defaultOverlayOpacity={0.85}>
        <View style={{paddingVertical:24,paddingHorizontal:16}}>
          <Text style={styles.sortTitle}>Sort By</Text>
        </View>
        <View style={{flexDirection:'column',justifyContent:'space-between'}}>
            {parentFilters.map((filter,index)=> (
              <TouchableOpacity key={index} onPress={() => onSort(filter.value)} style={{paddingHorizontal:16,paddingVertical:12,borderRadius:4,borderBottomWidth:0,borderBottomColor:'#252525',flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                <Text style={{color:'#e3e3e3',fontSize:12,fontWeight:'400'}}>{filter.name}</Text>
                <FontAwesomeOld name={sort === filter.value ? 'circle' : 'circle'} size={20} color={sort === filter.value ? BRAND_COLOR : '#454545'} />
              </TouchableOpacity>
            ))}
        </View>
      </ActionSheet>
    </View>
  )
}

const FilterModal = ({clearAll,onFilterSubmit,setShowFilter,setFilters,filters,showFilter,maxAvailablePrice,maxAvailableDistance}) => {

  const parentFilters = [{name:'By Delivery Type',value:'deliveryType',values:[{label:'Home Delivery',value:'homeDelivery'},{label:'Self-Pickup',value:'pickup'}]},{name:'By User Rating',value:'userRating',values:[{label:'> 2 Star',value:2},{label:'>3 Star',value:3},{label:'>4 Star',value:4},{label:'5 Star',value:5}]},{name:'By Vehicle Type',value:'vehicleType',values:[{label:'Hatchback',value:'hatchback'},{label:'Sedan',value:'sedan'},{label:'Compact SUV',value:'compact-suv'},{label:'SUV',value:'suv'},{label:'Luxury',value:'luxury'}]},{name:'By Vehicle Fuel Type',value:'vehicleFuelType',values:[{label:'Petrol',value:'petrol'},{label:'Diesel',value:'diesel'},{label:'Electric',value:'electric'}]},{name:'By Vehicle Seats',value:'vehicleSeats',values:[{label:'4/5 Seater',value:'4'},{label:'7 Seater',value:'7'},{label:'8 Seater',value:'8'}]},{name:'By Transmission Type',value:'vehicleTransmissionType',values:[{label:'Automatic',value:'automatic'},{label:'Manual',value:'manual'}]}];
  const actionRef = useRef(null)
  const [localSelectedFilters, setLocalSelectedFilters] = useState(filters)


  const onChange = (filterType, value) => {
    setLocalSelectedFilters((prevFilters) => {
      if (Array.isArray(prevFilters[filterType])) {
        if (prevFilters[filterType].includes(value)) {
          return {
            ...prevFilters,
            [filterType]: prevFilters[filterType].filter((item) => item !== value),
          };
        } else {
          return {
            ...prevFilters,
            [filterType]: [...prevFilters[filterType], value],
          };
        }
      } else {
        return {
          ...prevFilters,
          [filterType]: value,
        };
      }
    });
  };


  useEffect(() => {
    if (showFilter) {
      actionRef.current.show();
    }
    else {
      actionRef.current.hide();
    }
  }, [showFilter]);
  

  const FilterItem = ({filter,onPress}) => {

    const isSelected = (filterType, value) => {
      if (Array.isArray(localSelectedFilters[filterType])) {
        return localSelectedFilters[filterType].includes(value);
      }
      return localSelectedFilters[filterType] === value;
    };

    const handlePress = (filterType, value) => {
      onChange(filterType, value);
    };

    return <View style={{flexDirection:'column',justifyContent:'space-between',paddingVertical:16,borderBottomWidth:1,borderBottomColor:'#252525'}}>
      <CustomText fontType='primary' weight='Bold' style={{color:'#a3a3a3',fontSize:10,letterSpacing:-0.05,textTransform:'uppercase',marginBottom:8}}>{filter.name}</CustomText>

      <ScrollView showsHorizontalScrollIndicator={false} horizontal={true}>
        {filter.values.map((value,index)=> (
           <TouchableOpacity style={{...styles.modalFilterItem,backgroundColor:isSelected(filter.value,value.value) ? BRAND_COLOR : '#2a2a2c'} } onPress={()=>handlePress(filter.value,value.value)}>
           <CustomText fontType='primary' weight='Medium' style={{...styles.filterItemText,fontSize:11,color:isSelected(filter.value,value.value) ? '#000' : '#fff'} }>{value.label}</CustomText>
         </TouchableOpacity>
        ))}
      </ScrollView>
  </View>
  }


  return (
    <View>
      <ActionSheet ref={actionRef} onClose={() => setShowFilter(false)} containerStyle={{backgroundColor:'#1C1C1E',height:'85%'}} overlayColor='#000' defaultOverlayOpacity={0.85} safeAreaInsets={{bottom:150}}>
        
        <View style={{paddingVertical:16,paddingHorizontal:16,flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderBottomWidth:1,borderBottomColor:'#252525'}}>
          <Text style={styles.sortTitle}>Filters</Text>
          <TouchableOpacity style={{padding:8}} onPress={clearAll}>
            <Text style={{color:'#fff',fontSize:12,fontWeight:'400'}}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <View style={{flexDirection:'column',position:'relative'}}>
          <ActionSheetScrollView showsVerticalScrollIndicator={false} bounces={true}>
              <View style={{flexDirection:'column',justifyContent:'space-between',paddingVertical:16,borderBottomWidth:1,borderBottomColor:'#252525',paddingHorizontal:16,flex:1}}>

                <View style={{flexDirection:'column',justifyContent:'space-between',paddingVertical:16,borderBottomWidth:1,borderBottomColor:'#252525'}}>
                  <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                    <CustomText fontType='primary' weight='Bold' style={{color:'#a3a3a3',fontSize:10,letterSpacing:-0.05,textTransform:'uppercase',marginBottom:8}}>Max Distance</CustomText>
                    <Text style={{color:'#a3a3a3',fontSize:12,fontWeight:'400'}}>{localSelectedFilters.distance ? `${parseInt(localSelectedFilters.distance)} km` : 'N/A'}</Text>
                  </View>
                    <Slider
                      style={{width: '100%', height: 32}}
                      minimumValue={0}
                      maximumValue={maxAvailableDistance ? parseInt(Math.floor(maxAvailableDistance)) : 100}
                      step={5}
                      value={localSelectedFilters.distance ? localSelectedFilters.distance : 0}
                      thumbTintColor={BRAND_COLOR}
                      trackTintColor="#a3a3a3"
                      maximumTrackTintColor="#c69d1f"
                      minimumTrackTintColor={'#c69d1f'}
                      onValueChange={(value) => setLocalSelectedFilters(prevFilters => ({...prevFilters, distance: value}))}
                    />
                </View>



                <View style={{flexDirection:'column',justifyContent:'space-between',paddingVertical:16,borderBottomWidth:1,borderBottomColor:'#252525'}}>
                  <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                    <CustomText fontType='primary' weight='Bold' style={{color:'#a3a3a3',fontSize:10,letterSpacing:-0.05,textTransform:'uppercase',marginBottom:8}}>Max price</CustomText>
                    <Text style={{color:'#a3a3a3',fontSize:12,fontWeight:'400'}}>{localSelectedFilters.maxPrice ? `${parseInt(localSelectedFilters.maxPrice)}/Hr` : 'N/A'}</Text>
                  </View>
                    <Slider
                      style={{width: '100%', height: 32}}
                      minimumValue={0}
                      maximumValue={maxAvailablePrice ? parseInt(Math.floor(maxAvailablePrice)) : 50000}
                      step={5}
                      value={localSelectedFilters.maxPrice ? localSelectedFilters.maxPrice : 0}
                      thumbTintColor={BRAND_COLOR}
                      trackTintColor="#a3a3a3"
                      maximumTrackTintColor="#c69d1f"
                      minimumTrackTintColor={'#c69d1f'}
                      onValueChange={(value) => setLocalSelectedFilters(prevFilters => ({...prevFilters, maxPrice: value}))}
                    />
                </View>


              {/* <CustomText fontType='primary' weight='Bold' style={{color:'#a3a3a3',fontSize:10,letterSpacing:-0.05,textTransform:'uppercase',marginBottom:8}}>{filter.name}</CustomText> */}
            {parentFilters.map((filter,index)=> (
              <FilterItem key={index} filter={filter} onPress={onChange}/>
            ))}
            </View>
          </ActionSheetScrollView>

            {/* <View style={{position:'absolute',bottom:0,left:0,right:0,backgroundColor:'#000',padding:16,paddingHorizontal:0,paddingBottom:16}}>

            <TouchableOpacity style={{backgroundColor:BRAND_COLOR,padding:16,borderRadius:7,flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
              <CustomText fontType='primary' weight='Bold' style={{color:'#000',fontSize:12,textTransform:'uppercase'}}>Apply Filters</CustomText>
            </TouchableOpacity>
            </View> */}
        <View style={{padding:16,paddingHorizontal:16}}>
          <TouchableOpacity onPress={()=>onFilterSubmit(localSelectedFilters)} style={{padding:16,backgroundColor:BRAND_COLOR,borderRadius:7,flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
            <CustomText fontType='primary' weight='Bold' style={{color:'#000',fontSize:12,textTransform:'uppercase'}}>Apply Filters</CustomText>
          </TouchableOpacity>
        </View>
        </View>

      </ActionSheet>
    </View>
  )
}



const TopPillBlock = ({filters,setShowSort,setShowFilter,setFilters,isFilterApplied,sort}) => {


  const SortButton = () => (
    <TouchableOpacity style={{...styles.filterItem}} onPress={() => setShowSort(true)}>
      <Octicons name="dot-fill" size={16} color={`${sort ? '#EDBF31' : '#454545'}`} style={{marginRight:8,marginBottom:-2}} />
      <CustomText fontType='primary' weight='Medium' style={styles.filterItemText}>Sort By</CustomText>
      <Feather name="chevron-down" size={12} color="#a3a3a3" style={{marginLeft:4}} />
    </TouchableOpacity>
  )
  const FilterButton = () => (
    <TouchableOpacity style={{...styles.filterItem}} onPress={() => setShowFilter(true)}>
      <Octicons name="dot-fill" size={16} color={`${isFilterApplied ? '#EDBF31' : '#454545'}`} style={{marginRight:8,marginBottom:-2}} />
      <CustomText fontType='primary' weight='Medium' style={styles.filterItemText}>Filter</CustomText>
      <Feather name="filter" size={12} color="#a3a3a3" style={{marginLeft:4}} />
    </TouchableOpacity>
  )
  const LuxuryFilterButton = ({onPress}) => (
    <TouchableOpacity style={[styles.filterItem,filters.vehicleType && filters.vehicleType.includes('luxury') ? {backgroundColor:'#EDBF31'} : {backgroundColor:'#1c1c1e'}]} onPress={onPress}>
      <FontAwesome name="crown" size={11} color={filters.vehicleType && filters.vehicleType.includes('luxury') ? '#000' : '#a3a3a3'} style={{marginRight:6}} />
      <CustomText fontType='primary' weight='Medium' style={{...styles.filterItemText,color:filters.vehicleType && filters.vehicleType.includes('luxury') ? '#000' : '#a3a3a3'}}>Luxury</CustomText>
    </TouchableOpacity>
  )
  const DynamicFilterButton = ({name,onPress,value,category}) => (
    <TouchableOpacity style={[styles.filterItem,filters[category] && filters[category].includes(value) ? {backgroundColor:'#EDBF31'} : {backgroundColor:'#1c1c1e'}]} onPress={onPress}>
      <CustomText fontType='primary' weight='Medium' style={{...styles.filterItemText,color:filters[category] && filters[category].includes(value) ? '#000' : '#a3a3a3'}}>{name}</CustomText>
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
      <SortButton />
      <FilterButton />
      {/* <View style={{flexDirection:'row',justifyContent:'flex-start',alignItems:'center',paddingHorizontal:12,paddingVertical:8}}> */}
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} >

        <LuxuryFilterButton onPress={() => onPress('luxury','vehicleType')} />
        <DynamicFilterButton name="Home Delivery" value="homeDelivery" category="deliveryType" onPress={() => onPress('homeDelivery','deliveryType')} />
        <DynamicFilterButton name="Automatic" value="automatic" category="vehicleTransmissionType" onPress={() => onPress('automatic','vehicleTransmissionType')} />
        </ScrollView>
      {/* </View> */}
    </View>
  )
}

const styles = StyleSheet.create({
  sortTitle: {
    color: '#959595',
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
    borderBottomColor: '#ff0000',
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
    backgroundColor: '#1c1c1e',
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
    backgroundColor: '#2a2a2c',
  },
  filterItemText: {
    color: '#a3a3a3',
    letterSpacing: -0.05,
    fontSize: 12,
  },
  container: {
    flex: 1,
    position:'relative',
    backgroundColor: '#000',
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
    color: '#a3a3a3',
  },
  listContainer: {
    padding: 16,
  },
  header: {
    padding: 16,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  vehicleItem: {
    flexDirection: 'column',
    marginBottom: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingVertical:0,
    paddingHorizontal:0,
    position:'relative',
    overflow: 'hidden',
  },
  blockSecText: {
    fontSize: 12,
    color: '#e3e3e3',
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
    color: '#e3e3e3',
  },
  vehicleName: {
    fontSize: 14,
    color: '#efefef',
    marginBottom: 2,
  },
  vehiclePrice: {
    // paddingHorizontal:16,
  },
  vehiclePriceText: {
    fontSize: 18,
    marginTop: 4,
    fontWeight: '500',
    fontFamily:'Inter-Bold',
    color: '#efefef',
  },
  vehicleYear: {
    fontSize: 16,
    color: '#EDBF31',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 18,
  },
  sortItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
  },
  sortItemText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});
