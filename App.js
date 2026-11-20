import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, FlatList, Image, SafeAreaView, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";

const API = "https://api.jikan.moe/v4";
const DEMO_VIDEO = ""; // ضع رابط فيديو تملكه أو لديك إذن باستخدامه للاختبار.

function Player({ uri, onBack }) {
  const player = useVideoPlayer(uri || null, p => { p.loop = false; });
  const [cc, setCc] = useState(false);
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.back}><Text style={styles.buttonText}>رجوع</Text></TouchableOpacity>
      {uri ? <VideoView player={player} style={styles.video} nativeControls allowsFullscreen />
        : <View style={styles.empty}><Text style={styles.title}>المشغل جاهز</Text><Text style={styles.muted}>أضف رابط فيديو قانوني في إعدادات مصدر المشاهدة داخل المشروع لاختبار التشغيل.</Text></View>}
      <TouchableOpacity style={styles.cc} onPress={() => setCc(v => !v)}>
        <Text style={styles.buttonText}>CC {cc ? "مفعّل" : "إيقاف"}</Text>
      </TouchableOpacity>
      {cc && <Text style={styles.notice}>زر CC جاهز للواجهة؛ ربط ملفات الترجمة الفعلية يحتاج مسار ترجمة WebVTT متوافقاً مع مصدر الفيديو.</Text>}
    </SafeAreaView>
  );
}

export default function App() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [tab, setTab] = useState("home");

  async function load(path = "/top/anime?limit=18") {
    setLoading(true); setError("");
    try {
      const res = await fetch(API + path);
      if (!res.ok) throw new Error("تعذر الاتصال بمصدر معلومات الأنمي.");
      const json = await res.json();
      setItems(json.data || []);
    } catch (e) { setError(e.message || "حدث خطأ أثناء تحميل الأنميات."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function search() {
    if (!query.trim()) return load();
    load("/anime?q=" + encodeURIComponent(query.trim()) + "&limit=18");
  }
  const toggleFavorite = id => setFavorites(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]);
  const shown = tab === "favorites" ? items.filter(x => favorites.includes(x.mal_id)) : items;

  if (selected === "player") return <Player uri={DEMO_VIDEO} onBack={() => setSelected(null)} />;
  if (selected && typeof selected === "object") {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.detail}>
          <TouchableOpacity onPress={() => setSelected(null)}><Text style={styles.link}>‹ رجوع</Text></TouchableOpacity>
          <Image source={{ uri: selected.images?.jpg?.large_image_url }} style={styles.hero} />
          <Text style={styles.title}>{selected.title}</Text>
          <Text style={styles.muted}>{selected.type || "أنمي"} • {selected.episodes ?? "عدد الحلقات غير معروف"} حلقة • ⭐ {selected.score ?? "—"}</Text>
          <Text style={styles.description}>{selected.synopsis || "لا يوجد وصف متاح."}</Text>
          <TouchableOpacity style={styles.primary} onPress={() => setSelected("player")}><Text style={styles.buttonText}>فتح المشغّل</Text></TouchableOpacity>
          <Text style={styles.notice}>ملاحظة: معلومات الأنمي من Jikan API. تشغيل الحلقات يحتاج مزود فيديو مرخّص أو روابط تملك حق استخدامها؛ هذا المشروع لا يضم حلقات محمية بحقوق نشر.</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.brand}>dygothebest</Text>
        <Text style={styles.subtitle}>عالم الأنمي بين يديك</Text>
      </View>
      <View style={styles.searchRow}>
        <TextInput value={query} onChangeText={setQuery} onSubmitEditing={search}
          placeholder="ابحث عن أنمي..." placeholderTextColor="#888" style={styles.input} />
        <TouchableOpacity onPress={search} style={styles.searchButton}><Text style={styles.buttonText}>بحث</Text></TouchableOpacity>
      </View>
      <View style={styles.tabs}>
        <TouchableOpacity onPress={() => {setTab("home"); load();}}><Text style={tab==="home"?styles.activeTab:styles.tab}>الرئيسية</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setTab("favorites")}><Text style={tab==="favorites"?styles.activeTab:styles.tab}>المفضلة ({favorites.length})</Text></TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator size="large" color="#9b72ff" style={{marginTop:40}} /> :
        error ? <View style={styles.empty}><Text style={styles.notice}>{error}</Text><TouchableOpacity onPress={() => load()} style={styles.primary}><Text style={styles.buttonText}>إعادة المحاولة</Text></TouchableOpacity></View> :
        <FlatList data={shown} keyExtractor={x => String(x.mal_id)} numColumns={2}
          contentContainerStyle={styles.grid}
          ListEmptyComponent={<Text style={styles.muted}>ماكو أنميات بالمفضلة حالياً.</Text>}
          renderItem={({item}) => (
            <TouchableOpacity style={styles.card} onPress={() => setSelected(item)}>
              <Image source={{uri:item.images?.jpg?.image_url}} style={styles.poster} />
              <Text numberOfLines={2} style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.muted}>⭐ {item.score ?? "—"}</Text>
              <TouchableOpacity onPress={() => toggleFavorite(item.mal_id)} style={styles.fav}>
                <Text style={styles.buttonText}>{favorites.includes(item.mal_id) ? "♥ محفوظ" : "♡ أضف للمفضلة"}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )} />}
      <Text style={styles.footer}>المعلومات تُحمّل من الإنترنت • يلزم الاتصال بالشبكة</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:"#101018",paddingTop:8},
  header:{paddingHorizontal:18,paddingVertical:14},
  brand:{color:"#fff",fontSize:27,fontWeight:"900",textAlign:"right"},
  subtitle:{color:"#a99bc9",textAlign:"right",marginTop:3},
  searchRow:{flexDirection:"row",paddingHorizontal:14,gap:8},
  input:{flex:1,backgroundColor:"#20202c",color:"#fff",borderRadius:12,paddingHorizontal:14,textAlign:"right"},
  searchButton:{backgroundColor:"#7652d6",padding:13,borderRadius:12,justifyContent:"center"},
  buttonText:{color:"#fff",fontWeight:"bold"},
  tabs:{flexDirection:"row",justifyContent:"space-around",padding:15},
  tab:{color:"#aaa",fontWeight:"bold"},activeTab:{color:"#b99aff",fontWeight:"bold"},
  grid:{paddingHorizontal:8,paddingBottom:25},
  card:{flex:1,margin:7,backgroundColor:"#1b1b27",borderRadius:13,padding:8},
  poster:{width:"100%",height:190,borderRadius:9,backgroundColor:"#292936"},
  cardTitle:{color:"#fff",fontWeight:"bold",textAlign:"right",marginTop:8,minHeight:38},
  muted:{color:"#aaa",fontSize:12,textAlign:"right",marginTop:4},
  fav:{backgroundColor:"#39304f",padding:8,borderRadius:8,marginTop:8,alignItems:"center"},
  footer:{color:"#777",fontSize:10,textAlign:"center",padding:8},
  detail:{padding:18},hero:{width:"100%",height:330,resizeMode:"contain",marginVertical:12},
  title:{color:"#fff",fontSize:23,fontWeight:"bold",textAlign:"right",marginVertical:8},
  description:{color:"#ddd",lineHeight:25,textAlign:"right",marginVertical:14},
  primary:{backgroundColor:"#7652d6",padding:14,borderRadius:12,alignItems:"center",marginVertical:12},
  link:{color:"#b99aff",fontSize:17,textAlign:"right"},
  notice:{color:"#e0c98a",textAlign:"right",lineHeight:22,marginTop:12},
  empty:{padding:24,alignItems:"center",justifyContent:"center"},
  back:{padding:14,alignItems:"flex-end"},
  video:{width:"100%",height:250,backgroundColor:"#000"},
  cc:{alignSelf:"flex-end",backgroundColor:"#7652d6",padding:12,borderRadius:10,margin:15}
});
