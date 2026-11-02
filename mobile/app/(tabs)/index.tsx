import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { api, Rider, Trip } from "../../lib/api";
import { Button, Card, Notice, ScreenTitle, uiStyles } from "../../components/UI";
import { theme } from "../../theme";
export default function HomeScreen() {
 const [riders,setRiders]=useState<Rider[]>([]); const [latest,setLatest]=useState<Trip|null>(null); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
 const load=useCallback(async()=>{setLoading(true);setError("");try{const [r,t]=await Promise.all([api.riders(),api.trips()]);setRiders(r.riders);setLatest(t.trips[0]||null);}catch(e){const m=e instanceof Error?e.message:"Unable to load dashboard.";setError(m);if(/log in|session/i.test(m))router.replace("/auth");}finally{setLoading(false);}},[]);
 useFocusEffect(useCallback(()=>{load();},[load]));
 return <ScrollView style={s.page} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={theme.colors.accentDark}/>}> 
  <View style={s.top}><View><Text style={s.eyebrow}>YOUR EVERYDAY RIDE</Text><Text style={s.brand}>BodaLink</Text></View><View style={s.avatar}><Text style={s.avatarText}>B</Text></View></View>
  <View style={s.hero}><Text style={s.heroEyebrow}>MOVE WITH CONFIDENCE</Text><Text style={s.heroTitle}>Where to{"\n"}today?</Text><Text style={s.heroText}>Book a trusted boda ride in just a few simple steps.</Text><View style={{alignSelf:"flex-start",marginTop:18}}><Button title="Book a ride  →" onPress={()=>router.push("/(tabs)/book")}/></View><Text style={s.decor}>B</Text></View>
  {error?<Notice message={error}/>:null}
  <ScreenTitle title="Your activity" subtitle="A quick look at your BodaLink account."/>
  <View style={s.stats}><Card style={{flex:1}}><Text style={s.statValue}>{loading?"—":riders.filter(r=>Boolean(r.available)).length}</Text><Text style={uiStyles.muted}>Riders available</Text></Card><Card style={{flex:1}}><Text style={s.statValue}>{latest?`KSh ${Number(latest.fare).toLocaleString("en-KE")}`:"KSh 0"}</Text><Text style={uiStyles.muted}>Latest trip fare</Text></Card></View>
  <ScreenTitle title="Available riders" subtitle="Availability from the shared BodaLink database."/>
  {riders.length===0&&!loading?<Card><Text style={uiStyles.muted}>No rider records found yet. Add riders to your MySQL riders table to see them here.</Text></Card>:riders.slice(0,5).map(r=><Card key={r.id} style={s.rider}><Text style={{fontSize:22}}>🏍</Text><View style={{flex:1,gap:3}}><Text style={uiStyles.h3}>{r.name}</Text><Text style={uiStyles.muted}>{r.stage}</Text></View><Text style={[uiStyles.pill,{backgroundColor:Boolean(r.available)?theme.colors.successBg:theme.colors.surfaceAlt,color:Boolean(r.available)?theme.colors.success:theme.colors.muted}]}>{Boolean(r.available)?"Available":"On trip"}</Text></Card>)}
  {latest?<Card><Text style={uiStyles.h3}>Recent trip</Text><Text style={uiStyles.muted}>{latest.pickup} → {latest.destination}</Text><Text style={uiStyles.muted}>Rider: {latest.rider_name} · KSh {Number(latest.fare).toLocaleString("en-KE")}</Text><Button title="View trip history" variant="secondary" onPress={()=>router.push("/(tabs)/history")}/></Card>:null}
 </ScrollView>;
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, paddingTop: 18, paddingBottom: 30, gap: 15 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  eyebrow: { color: theme.colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  brand: { color: theme.colors.text, fontSize: 24, fontWeight: "900", letterSpacing: -0.7 },
  avatar: { height: 44, width: 44, borderRadius: 15, backgroundColor: theme.colors.accent, alignItems: "center", justifyContent: "center" },
  avatarText: { fontWeight: "900", fontSize: 22, color: theme.colors.ink },
  hero: { backgroundColor: theme.colors.ink, borderRadius: 22, padding: 22, overflow: "hidden", minHeight: 235, justifyContent: "center" },
  heroEyebrow: { color: theme.colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  heroTitle: { color: "#FFFFFF", fontSize: 37, lineHeight: 39, fontWeight: "900", marginTop: 10, letterSpacing: -1 },
  heroText: { color: "#C4CBD6", fontSize: 14, lineHeight: 21, marginTop: 9, maxWidth: "78%" },
  decor: { position: "absolute", right: -12, bottom: -38, fontSize: 150, fontWeight: "900", color: "#27303D" },
  stats: { flexDirection: "row", gap: 12 },
  statValue: { fontSize: 22, fontWeight: "900", color: theme.colors.text },
  rider: { flexDirection: "row", alignItems: "center", gap: 12 }
});
