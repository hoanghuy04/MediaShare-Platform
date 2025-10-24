import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

type LocationItem = {
  id: string;
  name: string;
  address: string;
  distance: string;
  latitude: number;
  longitude: number;
};

type LocationSearchScreenProps = {
  onClose: () => void;
  onSelectLocation: (loc: { name: string; address: string; distance: string }) => void;
};

export function LocationSearchScreen({ onClose, onSelectLocation }: LocationSearchScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [locations, setLocations] = useState<LocationItem[]>([]);

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function formatDistanceText(distanceKm: number): string {
    if (distanceKm < 0.1) return '<0,1 km';
    if (distanceKm < 1) {
      const meters = distanceKm * 1000;
      return `${meters.toFixed(0)} m`;
    }
    return `${distanceKm.toFixed(1).replace('.', ',')} km`;
  }

  function buildAddressString(geo: Location.LocationGeocodedLocation) {
    const parts = [
      geo.street,
      geo.subregion || geo.district,
      geo.city || geo.region || geo.subregion,
    ]
      .filter(Boolean)
      .map(s => String(s).trim());

    const deduped: string[] = [];
    for (const p of parts) {
      if (!deduped.includes(p)) deduped.push(p);
    }

    return deduped.join(', ');
  }

  function buildNearbyCandidateCoords(
    lat: number,
    lon: number
  ): Array<{ lat: number; lon: number }> {
    const deltas = [0, 0.00008, -0.00008, 0.00016, -0.00016];
    const pts: Array<{ lat: number; lon: number }> = [];
    for (const dlat of deltas) {
      for (const dlon of deltas) {
        pts.push({
          lat: lat + dlat,
          lon: lon + dlon,
        });
      }
    }
    return pts;
  }

  async function loadNearbyLocations() {
    try {
      setLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Quyền truy cập vị trí',
          'Vui lòng cấp quyền truy cập vị trí để tìm các địa điểm gần bạn.'
        );
        setLoading(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const baseLat = pos.coords.latitude;
      const baseLon = pos.coords.longitude;
      setUserLocation({ lat: baseLat, lon: baseLon });

      const candidateCoords = buildNearbyCandidateCoords(baseLat, baseLon);

      const collected: LocationItem[] = [];
      const seen = new Set<string>();

      for (let i = 0; i < candidateCoords.length; i++) {
        const { lat, lon } = candidateCoords[i];

        try {
          const revList = await Location.reverseGeocodeAsync({
            latitude: lat,
            longitude: lon,
          });

          for (const rev of revList) {
            const displayName =
              rev.name || rev.street || rev.city || rev.subregion || 'Vị trí gần đây';

            const addrStr = buildAddressString(rev);
            const distKm = calculateDistanceKm(baseLat, baseLon, lat, lon);
            const distText = formatDistanceText(distKm);

            const key = displayName + '|' + addrStr;
            if (!seen.has(key)) {
              seen.add(key);

              collected.push({
                id: `${i}-${key}`,
                name: displayName,
                address: addrStr,
                distance: distText,
                latitude: lat,
                longitude: lon,
              });
            }
          }
        } catch (err) {
          console.log('reverseGeocode error @', i, err);
        }
      }

      collected.sort((a, b) => {
        const parseDist = (d: string) => {
          if (d.startsWith('<0,1')) return 0.05;
          if (d.endsWith(' m')) {
            const n = parseFloat(d.replace(' m', '').replace(',', '.'));
            return n / 1000;
          }
          return parseFloat(d.replace(' km', '').replace(',', '.'));
        };
        return parseDist(a.distance) - parseDist(b.distance);
      });

      setLocations(collected);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Lỗi', 'Không thể lấy vị trí của bạn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  async function searchLocations(query: string) {
    if (!query.trim()) return;
    if (!userLocation) return;

    try {
      setLoading(true);

      const geocoded = await Location.geocodeAsync(query + ', Việt Nam');

      const mapped: LocationItem[] = [];
      const seen = new Set<string>();

      for (let i = 0; i < geocoded.length; i++) {
        const g = geocoded[i];
        const lat = g.latitude;
        const lon = g.longitude;

        let niceName = query;
        let niceAddr = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

        try {
          const rev = await Location.reverseGeocodeAsync({
            latitude: lat,
            longitude: lon,
          });
          if (rev[0]) {
            const rr = rev[0];
            niceName = rr.name || rr.street || query || 'Vị trí đã tìm';
            niceAddr = buildAddressString(rr);
          }
        } catch (err2) {}

        const distKm = calculateDistanceKm(userLocation.lat, userLocation.lon, lat, lon);
        const distText = formatDistanceText(distKm);

        const key = niceName + '|' + niceAddr;
        if (!seen.has(key)) {
          seen.add(key);
          mapped.push({
            id: `search-${i}`,
            name: niceName,
            address: niceAddr,
            distance: distText,
            latitude: lat,
            longitude: lon,
          });
        }
      }

      setLocations(mapped);
    } catch (error) {
      console.error('Error searching locations:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNearbyLocations();
  }, []);

  const handleRefresh = () => {
    loadNearbyLocations();
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      searchLocations(searchQuery.trim());
    }
  };

  const handleLocationPress = (loc: LocationItem) => {
    onSelectLocation({
      name: loc.name,
      address: loc.address,
      distance: loc.distance,
    });
    onClose();
  };

  const handleAddLocation = () => {
    if (!searchQuery.trim()) {
      Alert.alert('Thông báo', 'Vui lòng chọn hoặc nhập vị trí');
      return;
    }
    onSelectLocation({
      name: searchQuery.trim(),
      address: '',
      distance: '',
    });
    onClose();
  };

  const filteredList = searchQuery
    ? locations.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : locations;

  const renderLocationItem = ({ item }: { item: LocationItem }) => (
    <TouchableOpacity style={styles.locationItem} onPress={() => handleLocationPress(item)}>
      <View style={styles.locationInfo}>
        <Text style={styles.locationName} numberOfLines={1}>
          {item.name}
        </Text>

        {item.address ? (
          <Text style={styles.locationAddress} numberOfLines={2}>
            {item.distance ? `${item.distance} · ` : ''}
            {item.address}
          </Text>
        ) : item.distance ? (
          <Text style={styles.locationAddress} numberOfLines={1}>
            {item.distance}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      {Platform.OS === 'android' && <></>}

      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Vị trí</Text>

        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
          <Ionicons name="reload-outline" size={24} color="#4264ff" />
        </TouchableOpacity>
      </View>

      <View style={styles.descSection}>
        <Text style={styles.descTitle}>Chọn vị trí để gắn thẻ</Text>
        <Text style={styles.descText}>
          Những người mà bạn chia sẻ nội dung này có thể nhìn thấy vị trí bạn gắn thẻ và xem nội
          dung này trên bản đồ.
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm vị trí..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4264ff" />
          <Text style={styles.loadingText}>Đang tìm vị trí gần bạn...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          renderItem={renderLocationItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không tìm thấy vị trí nào</Text>
            </View>
          }
        />
      )}

      <View style={styles.bottomBtn}>
        <TouchableOpacity style={styles.addLocationBtn} onPress={handleAddLocation}>
          <Text style={styles.addLocationText}>Thêm vị trí</Text>
        </TouchableOpacity>

        <View style={styles.bottomGrabberWrap}>
          <View style={styles.bottomGrabber} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  refreshBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  descSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  descTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  descText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d9d9dd',
    paddingHorizontal: 12,
    minHeight: 44,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },

  listContent: {
    paddingBottom: 140,
    paddingHorizontal: 16,
  },
  locationItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  locationInfo: { flex: 1 },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6b6b6b',
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
  },

  bottomBtn: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  addLocationBtn: {
    backgroundColor: '#4264ff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  bottomGrabberWrap: {
    marginTop: 12,
    alignItems: 'center',
  },
  bottomGrabber: {
    width: 120,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#1a1a1a',
  },
});
