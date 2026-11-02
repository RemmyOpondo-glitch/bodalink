import React from "react";import{ActivityIndicator,Pressable,StyleSheet,Text,TextInput,TextInputProps,View,ViewStyle}from"react-native";import{theme}from"../theme";
export function ScreenTitle({title,subtitle}:{title:string;subtitle?:string}){return <View style={{marginBottom:20,gap:5}}><Text style={s.title}>{title}</Text>{subtitle?<Text style={s.subtitle}>{subtitle}</Text>:null}</View>}
export function Button({title,onPress,loading,variant="primary",disabled}:{title:string;onPress:()=>void;loading?:boolean;variant?:"primary"|"secondary"|"danger";disabled?:boolean}){return <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled||loading} style={({pressed})=>[s.button,variant==="primary"?s.primary:variant==="danger"?s.danger:s.secondary,(pressed||disabled||loading)&&{opacity:.7}]}>{loading?<ActivityIndicator color={variant==="secondary"?theme.colors.text:"#161100"}/>:<Text style={[s.buttonText,variant==="secondary"&&{color:theme.colors.text},variant==="danger"&&{color:"#fff"}]}>{title}</Text>}</Pressable>}
export function Field({label,...props}:TextInputProps&{label:string}){return <View style={{gap:7,marginBottom:14}}><Text style={s.label}>{label}</Text><TextInput placeholderTextColor="#7C8796" style={s.input}{...props}/></View>}
export function Card({children,style}:{children:React.ReactNode;style?:ViewStyle}){return <View style={[s.card,style]}>{children}</View>}
export function Notice({message,type="error"}:{message:string;type?:"error"|"success"}){return <View style={[s.notice,type==="success"?s.noticeSuccess:s.noticeError]}><Text style={{color:type==="success"?theme.colors.success:theme.colors.danger,fontWeight:"600"}}>{message}</Text></View>}
export const uiStyles=StyleSheet.create({row:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12},muted:{color:theme.colors.muted,fontSize:14,lineHeight:20},h3:{color:theme.colors.text,fontSize:17,fontWeight:"800"},pill:{paddingHorizontal:10,paddingVertical:5,borderRadius:99,backgroundColor:theme.colors.surfaceAlt,overflow:"hidden",color:theme.colors.text,fontSize:12,fontWeight:"700"}});
const s = StyleSheet.create({
  title: { color: theme.colors.text, fontSize: 28, lineHeight: 34, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { color: theme.colors.muted, fontSize: 15, lineHeight: 22 },
  button: { minHeight: 48, borderRadius: theme.radius.md, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  primary: { backgroundColor: theme.colors.accent },
  secondary: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  danger: { backgroundColor: theme.colors.danger },
  buttonText: { color: "#161100", fontSize: 15, fontWeight: "800" },
  label: { color: theme.colors.text, fontSize: 14, fontWeight: "700" },
  input: { minHeight: 49, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 13, backgroundColor: theme.colors.surface, color: theme.colors.text, fontSize: 16 },
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 16, gap: 10 },
  notice: { borderRadius: theme.radius.md, padding: 12, marginBottom: 14, borderWidth: 1 },
  noticeError: { backgroundColor: theme.colors.dangerBg, borderColor: "#F5C4C0" },
  noticeSuccess: { backgroundColor: theme.colors.successBg, borderColor: "#B5E4C9" }
});
