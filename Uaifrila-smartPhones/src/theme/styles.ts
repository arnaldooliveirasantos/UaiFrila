import {StyleSheet} from 'react-native';
import {Colors,Spacing} from './colors';
export const makeStyles=(isDark:boolean)=>{const c=isDark?Colors.dark:Colors.light;return StyleSheet.create({
 screen:{flex:1,backgroundColor:c.bgPage,paddingHorizontal:Spacing.screen,paddingTop:16,paddingBottom:16},
 scroll:{flexGrow:1,paddingHorizontal:Spacing.screen,paddingTop:16,paddingBottom:32},
 card:{backgroundColor:c.bgCard,borderWidth:2,borderColor:c.border,padding:Spacing.card,marginBottom:12,shadowColor:'#000',shadowOffset:{width:6,height:6},shadowOpacity:1,shadowRadius:0,elevation:4},
 cardHighlight:{backgroundColor:Colors.accent,borderWidth:4,borderColor:'#000',padding:Spacing.card,marginBottom:12},
 title:{fontSize:22,fontWeight:'900',textTransform:'uppercase',color:c.text,letterSpacing:-0.5},
 subtitle:{fontSize:13,fontWeight:'600',color:c.text,marginTop:6},
 label:{fontSize:10,fontWeight:'900',textTransform:'uppercase',letterSpacing:1,color:c.text,marginBottom:6},
 input:{height:48,borderWidth:2,borderColor:c.border,backgroundColor:isDark?'#000': '#fff',color:c.text,paddingHorizontal:12,fontSize:14},
 buttonPrimary:{backgroundColor:isDark?Colors.primary:'#000',paddingVertical:16,alignItems:'center',borderWidth:2,borderColor:isDark?Colors.primary:'#000'},
 buttonPrimaryText:{color:'#fff',fontWeight:'900',textTransform:'uppercase',fontSize:13},
 buttonSecondary:{backgroundColor:isDark?'#18181B':'#fff',paddingVertical:12,alignItems:'center',borderWidth:2,borderColor:c.border},
 buttonSecondaryText:{color:c.text,fontWeight:'900',textTransform:'uppercase',fontSize:12},
 buttonWarning:{backgroundColor:Colors.accent,paddingVertical:12,alignItems:'center',borderWidth:2,borderColor:'#000'},
 errorBox:{backgroundColor:Colors.danger,padding:10,borderWidth:2,borderColor:'#000',marginVertical:8},
 errorText:{color:'#fff',fontWeight:'700',fontSize:12},
 successBox:{backgroundColor:Colors.success,padding:10,borderWidth:2,borderColor:'#000',marginVertical:8},
 badge:{backgroundColor:Colors.success,paddingHorizontal:8,paddingVertical:4},
 badgeText:{color:'#fff',fontWeight:'900',fontSize:11},
});};
export type AppStyles=ReturnType<typeof makeStyles>;
