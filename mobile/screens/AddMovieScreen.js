import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import api from '../api/axios';

const AddMovieScreen = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!title || !recipientEmail) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await api.post('/addMovie', {
        title,
        message,
        recipientEmail,
      });
      Alert.alert('Success', 'Movie added!');
      setTitle('');
      setMessage('');
      setRecipientEmail('');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add movie');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Add a Movie</Text>
        <Text style={styles.helper}>Gift a movie to a friend</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Movie Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter movie title"
            value={title}
            onChangeText={setTitle}
            editable={!loading}
          />

          <Text style={styles.label}>Recipient Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Friend's email"
            value={recipientEmail}
            onChangeText={setRecipientEmail}
            keyboardType="email-address"
            editable={!loading}
          />

          <Text style={styles.label}>Message (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Add a personal note..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAdd}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send Movie Gift</Text>
            )}
          </TouchableOpacity>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  helper: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  form: {
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textarea: {
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#8B5CF6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddMovieScreen;
