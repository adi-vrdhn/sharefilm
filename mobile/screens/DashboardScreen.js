import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();

  const menuItems = [
    {
      title: 'Add Movie',
      description: 'Send a recommendation',
      icon: 'add-circle',
      screen: 'AddMovie',
    },
    {
      title: 'My Movies',
      description: 'View gifted movies',
      icon: 'list',
      screen: 'MovieList',
    },
    {
      title: 'Friends',
      description: 'Manage connections',
      icon: 'people',
      screen: 'Friends',
    },
    {
      title: 'Notifications',
      description: 'See updates',
      icon: 'notifications',
      screen: 'Notifications',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>Hey {user?.name}! 👋</Text>
        <Text style={styles.tagline}>Ready to share a movie?</Text>

        <View style={styles.grid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Ionicons name={item.icon} size={32} color="#8B5CF6" />
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    textAlign: 'center',
  },
});

export default DashboardScreen;
