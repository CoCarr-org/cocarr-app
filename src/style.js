import 'react-native';
import { C, themedStyleSheet } from './theme';

export const styles = themedStyleSheet(C => ({
  brandColor: {
    color: C.primaryText
  },

  bgPrimaryGrey: {
    backgroundColor: C.surface,
  },

  // Border radius
  roundedNone: {
    borderRadius: 0,
  },

  roundedSm: {
    borderRadius: 2,
  },

  rounded: {
    borderRadius: 4,
  },

  roundedMd: {
    borderRadius: 6,
  },

  roundedLg: {
    borderRadius: 8,
  },

  roundedXl: {
    borderRadius: 12,
  },

  rounded2xl: {
    borderRadius: 16,
  },

  rounded3xl: {
    borderRadius: 24,
  },

  roundedFull: {
    borderRadius: 9999,
  },

  // Individual corner border radius
  roundedTopNone: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },

  roundedTopSm: {
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },

  roundedTop: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },

  roundedTopMd: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },

  roundedTopLg: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },

  roundedTopXl: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },

  roundedTop2xl: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  roundedTop3xl: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  roundedTopFull: {
    borderTopLeftRadius: 9999,
    borderTopRightRadius: 9999,
  },

  // Text styles
  textXs: {
    fontSize: 12, // iOS/Android caption
  },

  textSm: {
    fontSize: 14, // iOS subhead, Android button
  },

  textBase: {
    fontSize: 16, // iOS body, Android body1
  },

  textLg: {
    fontSize: 17, // iOS headline
  },

  textXl: {
    fontSize: 20, // iOS title2, Android h6
  },

  text2xl: {
    fontSize: 24, // iOS title1, Android h5
  },

  text3xl: {
    fontSize: 34, // iOS large title, Android h3
  },

  // Button base styles
  buttonBase: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Primary button variants
  buttonPrimarySm: {
    backgroundColor: C.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
},

  buttonPrimaryMd: {
      backgroundColor: C.primary,
      minHeight: 48,
      paddingVertical: 14,
      textAlign: 'center',
      color: C.onPrimary,
      width: '100%',
      paddingHorizontal: 20,
      fontWeight: '700',
      fontSize: 15,
      borderRadius: 12,
      overflow: 'hidden',
    },

  buttonPrimaryLg: {
    backgroundColor: C.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },

  // Secondary button variants  
  buttonSecondarySm: {
    borderColor: C.primary,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },

  buttonSecondaryMd: {
    borderColor: C.primary,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },

  buttonSecondaryLg: {
    borderColor: C.primary,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },

  // Button text colors
  buttonPrimaryText: {
    color: C.onPrimary,
    fontWeight: '600',
  },

  buttonSecondaryText: {
    color: C.primaryText,
    fontWeight: '600',
  },

  // Text alignment
  textLeft: {
    textAlign: 'left',
  },

  textCenter: {
    textAlign: 'center', 
  },

  textRight: {
    textAlign: 'right',
  },

  textJustify: {
    textAlign: 'justify',
  },

  // Font weights
  fontLight: {
    fontWeight: '300',
  },

  fontNormal: {
    fontWeight: '400',
  },

  fontMedium: {
    fontWeight: '500',
  },

  fontSemibold: {
    fontWeight: '600',
  },

  fontBold: {
    fontWeight: '700',
  },

  // Text colors
  textWhite: {
    color: C.text,
  },

  textGray: {
    color: C.textTertiary,
  },

  textLightGray: {
    color: C.textSecondary,
  },

  textDarkGray: {
    color: C.textDisabled,
  },

  // Flex
  flex1: {
    flex: 1,
  },

  flexGrow: {
    flexGrow: 1,
  },

  flexShrink: {
    flexShrink: 1,
  },

  flexWrap: {
    flexWrap: 'wrap',
  },

  flexNowrap: {
    flexWrap: 'nowrap',
  },

  // Flex Direction
  flexRow: {
    flexDirection: 'row',
  },

  flexRowReverse: {
    flexDirection: 'row-reverse', 
  },

  flexCol: {
    flexDirection: 'column',
  },

  flexColReverse: {
    flexDirection: 'column-reverse',
  },

  // Justify Content
  justifyStart: {
    justifyContent: 'flex-start',
  },

  justifyEnd: {
    justifyContent: 'flex-end',
  },

  justifyCenter: {
    justifyContent: 'center',
  },

  justifyBetween: {
    justifyContent: 'space-between',
  },

  justifyAround: {
    justifyContent: 'space-around',
  },

  justifyEvenly: {
    justifyContent: 'space-evenly',
  },

  // Align Items
  itemsStart: {
    alignItems: 'flex-start',
  },

  itemsEnd: {
    alignItems: 'flex-end',
  },

  itemsCenter: {
    alignItems: 'center',
  },

  itemsBaseline: {
    alignItems: 'baseline',
  },

  itemsStretch: {
    alignItems: 'stretch',
  },

  // Grid (using flexbox since RN doesn't have CSS Grid)
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },

  grid3: {
    flexDirection: 'row', 
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },

  grid4: {
    flexDirection: 'row',
    flexWrap: 'wrap', 
    marginHorizontal: -4,
  },

  gridCol2: {
    width: '50%',
    paddingHorizontal: 8,
  },

  gridCol3: {
    width: '33.333333%',
    paddingHorizontal: 6,
  },

  gridCol4: {
    width: '25%',
    paddingHorizontal: 4,
  },

  // Margins
  m1: {
    margin: 4,
  },

  m2: {
    margin: 8,
  },

  m3: {
    margin: 12,
  },

  m4: {
    margin: 16,
  },

  m5: {
    margin: 20,
  },

  // Margin vertical
  myAuto: {
    marginVertical: 'auto',
  },

  my1: {
    marginVertical: 4,
  },

  my2: {
    marginVertical: 8,
  },

  my3: {
    marginVertical: 12,
  },

  my4: {
    marginVertical: 16,
  },

  my5: {
    marginVertical: 20,
  },

  // Margin horizontal  
  mx1: {
    marginHorizontal: 4,
  },

  mx2: {
    marginHorizontal: 8,
  },

  mx3: {
    marginHorizontal: 12,
  },

  mx4: {
    marginHorizontal: 16,
  },

  mx5: {
    marginHorizontal: 20,
  },

  mxAuto: {
    marginHorizontal: 'auto',
  },

  // Margin left
  ml1: {
    marginLeft: 4,
  },

  ml2: {
    marginLeft: 8,
  },

  ml3: {
    marginLeft: 12,
  },

  ml4: {
    marginLeft: 16,
  },

  ml5: {
    marginLeft: 20,
  },

  // Margin right
  mr1: {
    marginRight: 4,
  },

  mr2: {
    marginRight: 8,
  },

  mr3: {
    marginRight: 12,
  },

  mr4: {
    marginRight: 16,
  },

  mr5: {
    marginRight: 20,
  },

  // Margin top
  mt1: {
    marginTop: 4,
  },

  mt2: {
    marginTop: 8,
  },

  mt3: {
    marginTop: 12,
  },

  mt4: {
    marginTop: 16,
  },

  mt5: {
    marginTop: 20,
  },

  // Margin bottom
  mb1: {
    marginBottom: 4,
  },

  mb2: {
    marginBottom: 8,
  },

  mb3: {
    marginBottom: 12,
  },

  mb4: {
    marginBottom: 16,
  },

  mb5: {
    marginBottom: 20,
  },

  // Padding left
  pl1: {
    paddingLeft: 4,
  },

  pl2: {
    paddingLeft: 8,
  },

  pl3: {
    paddingLeft: 12,
  },

  pl4: {
    paddingLeft: 16,
  },

  pl5: {
    paddingLeft: 20,
  },

  // Padding right
  pr1: {
    paddingRight: 4,
  },

  pr2: {
    paddingRight: 8,
  },

  pr3: {
    paddingRight: 12,
  },

  pr4: {
    paddingRight: 16,
  },

  pr5: {
    paddingRight: 20,
  },

  // Padding top
  pt1: {
    paddingTop: 4,
  },

  pt2: {
    paddingTop: 8,
  },

  pt3: {
    paddingTop: 12,
  },

  pt4: {
    paddingTop: 16,
  },

  pt5: {
    paddingTop: 20,
  },

  // Padding bottom
  pb1: {
    paddingBottom: 4,
  },

  pb2: {
    paddingBottom: 8,
  },

  pb3: {
    paddingBottom: 12,
  },

  pb4: {
    paddingBottom: 16,
  },

  pb5: {
    paddingBottom: 20,
  },

  // Padding
  p1: {
    padding: 4,
  },

  p2: {
    padding: 8,
  },

  p3: {
    padding: 12,
  },

  p4: {
    padding: 16,
  },

  p5: {
    padding: 20,
  },

  // Padding vertical
  py1: {
    paddingVertical: 4,
  },

  py2: {
    paddingVertical: 8,
  },

  py3: {
    paddingVertical: 12,
  },

  py4: {
    paddingVertical: 16,
  },

  py5: {
    paddingVertical: 20,
  },

  // Padding horizontal
  px1: {
    paddingHorizontal: 4,
  },

  px2: {
    paddingHorizontal: 8,
  },

  px3: {
    paddingHorizontal: 12,
  },

  px4: {
    paddingHorizontal: 16,
  },

  px5: {
    paddingHorizontal: 20,
  }
}));