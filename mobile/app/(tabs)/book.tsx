import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { api } from "../../lib/api";
import { Button, Card, Field, Notice, ScreenTitle, uiStyles } from "../../components/UI";
import { theme } from "../../theme";
const RATE_PER_KM = 50;
export default function BookScreen() {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [distance, setDistance] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const km = Number(distance);
  const fare = Number.isFinite(km) && km > 0 ? km * RATE_PER_KM : 0;
  async function book() {
    setError("");
    if (!pickup.trim() || !destination.trim() || !distance.trim()) { setError("Complete all fields before booking."); return; }
    if (!Number.isFinite(km) || km <= 0) { setError("Enter a valid distance in kilometres."); return; }
    setLoading(true);
    try {
      const result = await api.book(pickup.trim(), destination.trim(), km);
      Alert.alert("Ride booked", `${result.message}\nRider: ${result.trip.rider_name}\nFare: KSh ${Number(result.trip.fare).toLocaleString("en-KE")}`, [
        { text: "View trips", onPress: () => router.push("/(tabs)/history") },
        { text: "Done", onPress: () => router.replace("/(tabs)") }
      ]);
      setPickup(""); setDestination(""); setDistance("");
    } catch (e) { setError(e instanceof Error ? e.message : "Booking failed. Please try again."); }
    finally { setLoading(false); }
  }
  return <ScrollView style={s.page} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
    <ScreenTitle title="Book a ride" subtitle="Tell us where you're going. We'll find an available rider." />
    <Card style={s.card}><View style={s.icon}><Text style={{ fontSize: 25 }}>🏍</Text></View>
      {error ? <Notice message={error} /> : null}
      <Field label="Pickup point" placeholder="Where should we pick you up?" value={pickup} onChangeText={setPickup} autoCapitalize="words" />
      <Field label="Destination" placeholder="Where are you going?" value={destination} onChangeText={setDestination} autoCapitalize="words" />
      <Field label="Distance (kilometres)" placeholder="e.g. 4.5" keyboardType="decimal-pad" value={distance} onChangeText={setDistance} />
      <View style={s.fareBox}><View><Text style={uiStyles.muted}>Estimated fare</Text><Text style={s.fare}>KSh {fare.toLocaleString("en-KE", { maximumFractionDigits: 2 })}</Text></View><Text style={s.rate}>KSh {RATE_PER_KM}/km</Text></View>
      <Text style={s.note}>The estimate uses the current app fare rate. Your booking and rider assignment are saved to the shared BodaLink database.</Text>
      <Button title="Confirm booking" onPress={book} loading={loading} />
    </Card>
  </ScrollView>;
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background }, content: { padding: 20, paddingTop: 24, paddingBottom: 30 }, card: { padding: 20 },
  icon: { width: 52, height: 52, borderRadius: 16, backgroundColor: theme.colors.surfaceAlt, alignItems: "center", justifyContent: "center", marginBottom: 5 },
  fareBox: { backgroundColor: theme.colors.surfaceAlt, borderRadius: 14, padding: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2, marginBottom: 12 },
  fare: { fontSize: 25, fontWeight: "900", color: theme.colors.text, marginTop: 3 }, rate: { fontSize: 12, color: theme.colors.muted, fontWeight: "800" }, note: { color: theme.colors.muted, fontSize: 12, lineHeight: 18, marginBottom: 15 }
});
