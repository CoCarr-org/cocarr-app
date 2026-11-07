import { C } from '../theme';
const ErrorModal = ({title}) => {
    return (
        <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'rgba(0,0,0,0.5)'}}>
            <View style={{backgroundColor:C.inverseSurface,padding:16,borderRadius:12}}>
                <CustomText fontType='primary' weight='SemiBold' style={{color:C.onPrimary, fontSize:16,marginBottom:0}}>{title}</CustomText>
            </View>
        </View>
    );

}