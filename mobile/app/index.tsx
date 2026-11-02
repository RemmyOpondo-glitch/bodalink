import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Redirect, router } from "expo-router";
import { getToken } from "../lib/api";
import { theme } from "../theme";

export default function LandingScreen() {
  const [destination, setDestination] = useState<"/(tabs)" | null>(null);
  const [checking, setChecking] = useState(true);
  const { height, width } = useWindowDimensions();
  const compact = height < 760;

  useEffect(() => {
    getToken()
      .then((token) => {
        if (token) setDestination("/(tabs)");
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  if (destination) return <Redirect href={destination} />;
  if (checking) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ImageBackground
        source={require("../assets/bodalink-hero.jpg")}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      >
        <View style={styles.photoTint} />
        <View style={styles.bottomShade} />
      </ImageBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.page}>
          <ScrollView
            style={styles.scroller}
            contentContainerStyle={[
              styles.content,
              { minHeight: Math.max(height - 112, 560), paddingHorizontal: width < 380 ? 18 : 24 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.brandBlock}>
                <View style={styles.brandRow}>
                  <Text style={styles.bike}>♧</Text>
                  <Text style={[styles.brand, { fontSize: width < 380 ? 27 : 31 }]}>Boda<Text style={styles.brandAccent}>Link</Text></Text>
                </View>
                <Text style={styles.tagline}>Safe Rides. Better Journeys.</Text>
              </View>
              <View style={styles.authButtons}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Log in"
                  style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}
                  onPress={() => router.push({ pathname: "/auth", params: { mode: "login" } })}
                >
                  <Text style={styles.loginText}>Log In</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Create account"
                  style={({ pressed }) => [styles.signupButton, pressed && styles.pressed]}
                  onPress={() => router.push({ pathname: "/auth", params: { mode: "signup" } })}
                >
                  <Text style={styles.signupText}>Create Account</Text>
                </Pressable>
              </View>
            </View>

            <View style={[styles.heroCopy, compact && styles.heroCopyCompact]}>
              <Text style={[styles.title, { fontSize: width < 380 ? 34 : 39, lineHeight: width < 380 ? 38 : 44 }]}>Quick, Safe and</Text>
              <Text style={[styles.title, styles.yellow, { fontSize: width < 380 ? 34 : 39, lineHeight: width < 380 ? 38 : 44 }]}>Reliable Rides</Text>
              <Text style={styles.subtitle}>Get to your destination with ease. Book a ride today!</Text>
            </View>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                onPress={() => router.push({ pathname: "/auth", params: { mode: "login" } })}
              >
                <Text style={styles.buttonIconDark}>♧</Text>
                <Text style={styles.primaryButtonText}>Book a Ride</Text>
                <Text style={styles.arrowDark}>→</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                onPress={() => router.push("/(tabs)/book")}
              >
                <Text style={styles.buttonIconLight}>⌖</Text>
                <Text style={styles.secondaryButtonText}>Find Riders</Text>
                <Text style={styles.arrowLight}>→</Text>
              </Pressable>
            </View>

            <View style={styles.benefits}>
              <View style={styles.benefit}><Text style={styles.benefitIcon}>♢</Text><Text style={styles.benefitTitle}>Safe Rides</Text></View>
              <View style={styles.benefitDivider} />
              <View style={styles.benefit}><Text style={styles.benefitIcon}>◷</Text><Text style={styles.benefitTitle}>Fast Service</Text></View>
              <View style={styles.benefitDivider} />
              <View style={styles.benefit}><Text style={styles.benefitIcon}>⌖</Text><Text style={styles.benefitTitle}>Trusted Riders</Text></View>
              <View style={styles.benefitDivider} />
              <View style={styles.benefit}><Text style={styles.benefitIcon}>☆</Text><Text style={styles.benefitTitle}>Better Journeys</Text></View>
            </View>
          </ScrollView>

          <View style={styles.bottomNav}>
            <Pressable style={styles.navItem} onPress={() => {}}><Text style={[styles.navIcon, styles.activeNav]}>⌂</Text><Text style={[styles.navLabel, styles.activeNav]}>Home</Text></Pressable>
            <Pressable style={styles.navItem} onPress={() => router.push("/(tabs)/book")}><Text style={styles.navIcon}>⌕</Text><Text style={styles.navLabel}>Book</Text></Pressable>
            <Pressable style={styles.navItem} onPress={() => router.push("/(tabs)/history")}><Text style={styles.navIcon}>◷</Text><Text style={styles.navLabel}>History</Text></Pressable>
            <Pressable style={styles.navItem} onPress={() => router.push("/(tabs)/profile")}><Text style={styles.navIcon}>♙</Text><Text style={styles.navLabel}>Profile</Text></Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#07111D" },
  screen: { flex: 1, backgroundColor: "#07111D" },
  photoTint: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(3, 10, 19, 0.28)" },
  bottomShade: { position: "absolute", left: 0, right: 0, bottom: 0, height: "48%", backgroundColor: "rgba(3, 10, 19, 0.62)" },
  safe: { flex: 1 },
  page: { flex: 1 },
  scroller: { flex: 1 },
  content: { paddingTop: 12, paddingBottom: 24, justifyContent: "space-between" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  brandBlock: { flex: 1, minWidth: 0 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  bike: { fontSize: 32, color: "#FFCA28", fontWeight: "900" },
  brand: { color: "#FFFFFF", fontWeight: "900", letterSpacing: -1.2 },
  brandAccent: { color: "#FFCA28" },
  tagline: { color: "#FFFFFF", fontSize: 10, marginLeft: 40, marginTop: 1 },
  authButtons: { flexDirection: "row", alignItems: "center", gap: 7 },
  loginButton: { minHeight: 42, paddingHorizontal: 13, borderRadius: 24, borderWidth: 1.5, borderColor: "#FFFFFF", justifyContent: "center", alignItems: "center" },
  loginText: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 },
  signupButton: { minHeight: 42, paddingHorizontal: 12, borderRadius: 24, backgroundColor: "#FFCA28", justifyContent: "center", alignItems: "center" },
  signupText: { color: "#101318", fontWeight: "900", fontSize: 11 },
  heroCopy: { marginTop: 50, marginBottom: 28 },
  heroCopyCompact: { marginTop: 28, marginBottom: 18 },
  title: { color: "#FFFFFF", fontWeight: "900", letterSpacing: -1.1 },
  yellow: { color: "#FFCA28" },
  subtitle: { color: "#F2F4F7", fontSize: 17, lineHeight: 24, marginTop: 15, maxWidth: 330 },
  actions: { gap: 12, marginBottom: 32 },
  primaryButton: { minHeight: 64, borderRadius: 36, backgroundColor: "#FFCA28", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 22 },
  primaryButtonText: { color: "#111111", fontSize: 17, fontWeight: "900", flex: 1, textAlign: "center" },
  buttonIconDark: { fontSize: 26, color: "#111111" },
  arrowDark: { color: "#111111", fontSize: 28, fontWeight: "700" },
  secondaryButton: { minHeight: 60, borderRadius: 34, borderWidth: 1.7, borderColor: "#FFFFFF", backgroundColor: "rgba(7,12,20,0.30)", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 25 },
  secondaryButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800", flex: 1, textAlign: "center" },
  buttonIconLight: { color: "#FFFFFF", fontSize: 27 },
  arrowLight: { color: "#FFFFFF", fontSize: 27, fontWeight: "700" },
  benefits: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.28)", paddingTop: 18, gap: 4 },
  benefit: { flex: 1, alignItems: "center", justifyContent: "center" },
  benefitIcon: { color: "#FFCA28", fontSize: 29, fontWeight: "700", marginBottom: 6 },
  benefitTitle: { color: "#FFFFFF", fontSize: 10, fontWeight: "800", textAlign: "center" },
  benefitDivider: { height: 48, width: 1, backgroundColor: "rgba(255,255,255,0.3)" },
  bottomNav: { height: 82, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.22)", backgroundColor: "rgba(4,10,18,0.88)", flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingBottom: 5 },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2 },
  navIcon: { color: "#929BAB", fontSize: 30, fontWeight: "700", lineHeight: 34 },
  navLabel: { color: "#929BAB", fontSize: 11, fontWeight: "700" },
  activeNav: { color: "#FFCA28" },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
