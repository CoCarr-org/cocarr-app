import { TouchableOpacity, View } from "react-native";
import Icon from 'react-native-vector-icons/AntDesign';

import { C } from '../../theme';

const FiveStar = ({ onPress,size=12,rating=0 }) => {
  
    return (
      <TouchableOpacity onPress={onPress} style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
        <View style={{flexDirection:'row', justifyContent:'space-between',marginVertical:12, alignItems:'center',gap:10}}>
        <View style={{ flexDirection: 'row', justifyContent: 'center'}}>
          {[...Array(5)].map((_, index) => (
              <Icon key={index}
                name={rating >= index + 1 ? 'star' : 'staro'}
                size={size}
                style={{marginLeft:2}}
                color={rating >= index + 1 ? C.primaryText : C.textTertiary}
                />
          ))}
        </View>
          </View>
      </TouchableOpacity>
    );
  };

export default FiveStar;