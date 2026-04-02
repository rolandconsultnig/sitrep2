import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph } from 'react-native-paper';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THREAT_TYPES = [
  'Kidnapping', 'Armed Robbery', 'Banditry', 'Terrorism', 'Cultism',
  'Rape / Sexual Violence', 'Cybercrime', 'Homicide', 'Drug trafficking',
  'Human trafficking'
];

const SEVERITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

export default function SubmissionScreen({ navigation }) {
  const [formData, setFormData] = useState({
    threat_domain: '',
    severity: '',
    lga_or_address: '',
    narrative: '',
    latitude: null,
    longitude: null,
  });
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      setFormData(prev => ({
        ...prev,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }));
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access camera roll was denied');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.cancelled) {
      // Handle image upload
      console.log('Image selected:', result.uri);
    }
  };

  const submitIncident = async () => {
    if (!formData.threat_domain || !formData.severity || !formData.narrative) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = JSON.parse(await AsyncStorage.getItem('user') || '{}');

      const submission = {
        report_date: new Date().toISOString(),
        state: userData.state || 'FCT',
        lga_or_address: formData.lga_or_address || 'Location captured',
        threat_domain: formData.threat_domain,
        severity: formData.severity,
        narrative: formData.narrative,
        ...(formData.latitude && { latitude: formData.latitude }),
        ...(formData.longitude && { longitude: formData.longitude }),
      };

      const response = await axios.post(
        'http://your-api-url:8000/api/submissions',
        submission,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      alert('Incident submitted successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit incident. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Report Incident</Title>
          <Paragraph>Fill in the details below to submit a new incident report.</Paragraph>

          <TextInput
            label="Threat Domain *"
            value={formData.threat_domain}
            onChangeText={(text) => setFormData({ ...formData, threat_domain: text })}
            mode="outlined"
            style={styles.input}
            placeholder="Select threat type"
          />

          <TextInput
            label="Severity *"
            value={formData.severity}
            onChangeText={(text) => setFormData({ ...formData, severity: text })}
            mode="outlined"
            style={styles.input}
            placeholder="Select severity level"
          />

          <TextInput
            label="LGA or Address"
            value={formData.lga_or_address}
            onChangeText={(text) => setFormData({ ...formData, lga_or_address: text })}
            mode="outlined"
            style={styles.input}
            multiline
          />

          <TextInput
            label="Narrative *"
            value={formData.narrative}
            onChangeText={(text) => setFormData({ ...formData, narrative: text })}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={6}
            placeholder="Describe the incident in detail..."
          />

          <Button
            mode="outlined"
            onPress={getCurrentLocation}
            style={styles.button}
            icon="map-marker"
          >
            {location ? 'Location Captured' : 'Capture GPS Location'}
          </Button>

          <Button
            mode="outlined"
            onPress={pickImage}
            style={styles.button}
            icon="camera"
          >
            Attach Photo
          </Button>

          <Button
            mode="contained"
            onPress={submitIncident}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
          >
            Submit Incident
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
  },
});
