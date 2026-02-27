import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import api from '../api/axios';

const MovieListScreen = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const response = await api.get('/movies');
      setMovies(response.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load movies');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#8B5CF6" style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Your Movies</Text>

        {movies.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No movies yet!</Text>
            <Text style={styles.emptySubtext}>Ask friends to gift you some</Text>
          </View>
        ) : (
          movies.map((movie) => (
            <View key={movie.id} style={styles.movieCard}>
              <View>
                <Text style={styles.movieTitle}>{movie.title}</Text>
                <Text style={styles.movieFrom}>From: {movie.fromUser?.name}</Text>
              </View>
              <TouchableOpacity style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>×</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  loader: {
    marginTop: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  movieCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  movieFrom: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    fontSize: 24,
    color: '#999',
  },
});

export default MovieListScreen;
