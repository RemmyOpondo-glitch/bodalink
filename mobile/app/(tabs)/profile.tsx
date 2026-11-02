import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { api, clearToken, User } from "../../lib/api";
import { Button, Card, Notice, ScreenTitle, uiStyles } from "../../components/UI";
import { theme } from "../../theme";
export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); setError(""); try { const result = await api.profile(); setUser(result.user); } catch (e) { const message = e instanceof Error ? e.message : "Could not load profile."; setError(message); if (/log in|session/i.test(message)) router.replace("/auth"); } finally { setLoading(false); } }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  async function logout() { try { await api.logout(); } catch { /* Clear local token if API is offline. */ } await clearToken(); router.replace("/auth"); }
  return <ScrollView style={s.page} contentContainerStyle={s.content}><ScreenTitle title="Your profile" subtitle="Manage your BodaLink account." />{error ? <Notice message={error} /> : null}
    <Card style={s.profile}><View style={s.avatar}><Text style={s.avatarText}>B</Text></View><Text style={s.phone}>{loading ? "Loading profile…" : user?.phone || "BodaLink user"}</Text><Text style={uiStyles.muted}>Customer account</Text></Card>
    <Card><Text style={uiStyles.h3}>Account details</Text><View style={s.detail}><Text style={uiStyles.muted}>Phone number</Text><Text style={s.value}>{user?.phone || "—"}</Text></View><View style={s.detail}><Text style={uiStyles.muted}>Account ID</Text><Text style={s.value}>{user?.id ?? "—"}</Text></View></Card>
    <Card><Text style={uiStyles.h3}>Need a ride?</Text><Text style={uiStyles.muted}>Book a ride, check available riders and review your trip history from the tabs below.</Text><Button title="Book a ride" onPress={() => router.push("/(tabs)/book")} /></Card>
    <Button title="Log out" variant="danger" onPress={() => Alert.alert("Log out of BodaLink?", "You can sign in again any time.", [{ text: "Cancel", style: "cancel" }, { text: "Log out", style: "destructive", onPress: logout }])} />
  </ScrollView>;
}
const s = StyleSheet.create({ page: { flex: 1, backgroundColor: theme.colors.background }, content: { padding: 20, paddingTop: 24, paddingBottom: 30, gap: 14 }, profile: { alignItems: "center", padding: 24 }, avatar: { width: 72, height: 72, borderRadius: 24, backgroundColor: theme.colors.accent, alignItems: "center", justifyContent: "center", marginBottom: 7 }, avatarText: { fontSize: 38, fontWeight: "900", color: theme.colors.ink }, phone: { color: theme.colors.text, fontSize: 21, fontWeight: "900" }, detail: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border }, value: { color: theme.colors.text, fontWeight: "800" } });
