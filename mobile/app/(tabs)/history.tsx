import React, { useCallback, useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { api, Trip } from "../../lib/api";
import { Button, Card, Notice, ScreenTitle, uiStyles } from "../../components/UI";
import { theme } from "../../theme";
export default function HistoryScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [stats, setStats] = useState({ totalTrips: 0, totalFare: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const result = await api.trips(); setTrips(result.trips); setStats({ totalTrips: Number(result.stats.totalTrips), totalFare: Number(result.stats.totalFare) }); }
    catch (e) { const message = e instanceof Error ? e.message : "Could not load trips."; setError(message); if (/log in|session/i.test(message)) router.replace("/auth"); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  async function completeTrip(trip: Trip) {
    try { await api.complete(trip.id); await load(); Alert.alert("Trip completed", "The trip is marked complete and the rider is available again."); }
    catch (e) { Alert.alert("Unable to complete trip", e instanceof Error ? e.message : "Please try again."); }
  }
  return <ScrollView style={s.page} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={theme.colors.accentDark} />}>
    <ScreenTitle title="My trips" subtitle="Your bookings and ride history in one place." />{error ? <Notice message={error} /> : null}
    <View style={s.stats}><Card style={{ flex: 1 }}><Text style={s.stat}>{stats.totalTrips}</Text><Text style={uiStyles.muted}>Total trips</Text></Card><Card style={{ flex: 1 }}><Text style={s.stat}>KSh {stats.totalFare.toLocaleString("en-KE", { maximumFractionDigits: 0 })}</Text><Text style={uiStyles.muted}>Total fare</Text></Card></View>
    <Text style={s.section}>Booking history</Text>
    {!trips.length && !loading ? <Card style={s.empty}><Text style={{ fontSize: 25 }}>◷</Text><Text style={uiStyles.h3}>No trips yet</Text><Text style={[uiStyles.muted, { textAlign: "center" }]}>Your ride bookings will appear here when you book your first trip.</Text><Button title="Book your first ride" onPress={() => router.push("/(tabs)/book")} /></Card> : null}
    {trips.map(trip => <Card key={trip.id} style={s.trip}><View style={uiStyles.row}><Text style={s.number}>TRIP #{trip.id}</Text><Text style={[uiStyles.pill, trip.status.toLowerCase() === "completed" && { backgroundColor: theme.colors.successBg, color: theme.colors.success }]}>{trip.status}</Text></View>
      <Text style={s.route}>{trip.pickup}</Text><Text style={s.arrow}>↓</Text><Text style={s.route}>{trip.destination}</Text><View style={s.line} />
      <View style={uiStyles.row}><Text style={uiStyles.muted}>Rider: {trip.rider_name}</Text><Text style={s.fare}>KSh {Number(trip.fare).toLocaleString("en-KE", { maximumFractionDigits: 2 })}</Text></View><Text style={uiStyles.muted}>{Number(trip.distance).toLocaleString("en-KE")} km · {trip.stage}</Text>
      {trip.status.toLowerCase() !== "completed" ? <Button title="Mark trip complete" variant="secondary" onPress={() => completeTrip(trip)} /> : null}
    </Card>)}
  </ScrollView>;
}
const s = StyleSheet.create({ page: { flex: 1, backgroundColor: theme.colors.background }, content: { padding: 20, paddingTop: 24, paddingBottom: 30, gap: 14 }, stats: { flexDirection: "row", gap: 12 }, stat: { fontSize: 21, fontWeight: "900", color: theme.colors.text, marginBottom: 4 }, section: { fontSize: 18, fontWeight: "900", color: theme.colors.text, marginTop: 8 }, empty: { alignItems: "center", padding: 24 }, trip: { gap: 10 }, number: { color: theme.colors.muted, fontSize: 11, fontWeight: "900", letterSpacing: 1 }, route: { color: theme.colors.text, fontSize: 17, fontWeight: "800" }, arrow: { color: theme.colors.accentDark, fontSize: 17, fontWeight: "900", marginTop: -7, marginBottom: -7 }, line: { height: 1, backgroundColor: theme.colors.border, marginVertical: 2 }, fare: { color: theme.colors.text, fontWeight: "900", fontSize: 15 } });
