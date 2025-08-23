import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';

const ProfileContainer = styled.div`
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
  min-height: calc(100vh - 70px);
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 3rem;
  color: ${props => props.theme.colors.text};
`;

const ProfileCard = styled(motion.div)`
  background: ${props => props.theme.colors.surface};
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid ${props => props.theme.colors.border};
  margin-bottom: 2rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.colors.text};
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  font-size: 1rem;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  transition: border-color 0.2s ease;

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    outline: none;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  font-size: 1rem;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  cursor: pointer;

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    outline: none;
  }
`;

const StylePreferences = styled.div`
  margin-bottom: 2rem;
`;

const PreferenceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const PreferenceTag = styled.button<{ $selected: boolean }>`
  padding: 0.75rem 1rem;
  border: 1px solid ${props => props.$selected ? props.theme.colors.primary : props.theme.colors.border};
  background: ${props => props.$selected ? props.theme.colors.primary : props.theme.colors.background};
  color: ${props => props.$selected ? 'white' : props.theme.colors.text};
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    background: ${props => props.$selected ? props.theme.colors.primary : `${props.theme.colors.primary}10`};
  }
`;

const SaveButton = styled.button`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.secondary});
  color: white;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const RecommendationsCard = styled(motion.div)`
  background: ${props => props.theme.colors.background};
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid ${props => props.theme.colors.border};
  margin-top: 2rem;
`;

const Profile: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [recommendations, setRecommendations] = useState<any>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    gender: '',
    height: '',
    weight: ''
  });

  const [stylePreferences, setStylePreferences] = useState<string[]>([]);

  const availablePreferences = [
    'minimalist', 'colorful', 'professional', 'casual', 'trendy', 'classic',
    'bohemian', 'sporty', 'elegant', 'edgy', 'romantic', 'vintage'
  ];

  useEffect(() => {
    // Generate or load user ID (in a real app, this would come from authentication)
    const storedUserId = localStorage.getItem('treads_user_id');
    if (storedUserId) {
      setUserId(storedUserId);
      loadUserProfile(storedUserId);
    } else {
      const newUserId = Math.random().toString(36).substr(2, 9);
      setUserId(newUserId);
      localStorage.setItem('treads_user_id', newUserId);
    }
  }, []);

  const loadUserProfile = async (id: string) => {
    try {
      const response = await axios.get(`/api/user/${id}/profile`);
      const profile = response.data;
      
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        age: profile.age?.toString() || '',
        gender: profile.gender || '',
        height: profile.height?.toString() || '',
        weight: profile.weight?.toString() || ''
      });
      
      setStylePreferences(profile.style_preferences || []);
      
    } catch (error) {
      // Profile doesn't exist yet, which is fine
      console.log('Profile not found, will create new one');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleStylePreference = (preference: string) => {
    setStylePreferences(prev => 
      prev.includes(preference)
        ? prev.filter(p => p !== preference)
        : [...prev, preference]
    );
  };

  const saveProfile = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Please fill in your name and email');
      return;
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      if (formData.age) formDataToSend.append('age', formData.age);
      if (formData.gender) formDataToSend.append('gender', formData.gender);
      if (formData.height) formDataToSend.append('height', formData.height);
      if (formData.weight) formDataToSend.append('weight', formData.weight);
      formDataToSend.append('style_preferences', JSON.stringify(stylePreferences));

      // Try to update first, then create if doesn't exist
      try {
        await axios.put(`/api/user/${userId}/profile`, formDataToSend);
        toast.success('Profile updated successfully!');
      } catch (updateError) {
        // If update fails, try to create
        const response = await axios.post('/api/user/profile', formDataToSend);
        setUserId(response.data.user_id);
        localStorage.setItem('treads_user_id', response.data.user_id);
        toast.success('Profile created successfully!');
      }

      // Load recommendations
      await loadRecommendations();
      
    } catch (error) {
      console.error('Profile save failed:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const response = await axios.get(`/api/user/${userId}/recommendations`);
      setRecommendations(response.data.recommendations);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  return (
    <ProfileContainer>
      <PageTitle>Your Profile</PageTitle>
      
      <ProfileCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 style={{ marginBottom: '2rem', fontSize: '1.5rem', fontWeight: '600' }}>
          Personal Information
        </h3>
        
        <FormGrid>
          <FormGroup>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter your full name"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="your.email@example.com"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              value={formData.age}
              onChange={(e) => handleInputChange('age', e.target.value)}
              placeholder="25"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="gender">Gender</Label>
            <Select
              id="gender"
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
            >
              <option value="">Select gender</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              type="number"
              value={formData.height}
              onChange={(e) => handleInputChange('height', e.target.value)}
              placeholder="175"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              value={formData.weight}
              onChange={(e) => handleInputChange('weight', e.target.value)}
              placeholder="70"
            />
          </FormGroup>
        </FormGrid>

        <StylePreferences>
          <Label>Style Preferences</Label>
          <PreferenceGrid>
            {availablePreferences.map((preference) => (
              <PreferenceTag
                key={preference}
                type="button"
                $selected={stylePreferences.includes(preference)}
                onClick={() => toggleStylePreference(preference)}
              >
                {preference.charAt(0).toUpperCase() + preference.slice(1)}
              </PreferenceTag>
            ))}
          </PreferenceGrid>
        </StylePreferences>

        <SaveButton onClick={saveProfile} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Profile'}
        </SaveButton>
      </ProfileCard>

      {recommendations && (
        <RecommendationsCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>
            Your Style Recommendations
          </h3>
          
          {recommendations.style_categories.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.5rem', fontWeight: '500' }}>Recommended Styles:</h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {recommendations.style_categories.map((category: string, index: number) => (
                  <span
                    key={index}
                    style={{
                      background: '#6366f1',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.9rem'
                    }}
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}

          {recommendations.color_palette.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.5rem', fontWeight: '500' }}>Your Color Palette:</h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {recommendations.color_palette.map((color: string, index: number) => (
                  <span
                    key={index}
                    style={{
                      background: '#f1f5f9',
                      color: '#334155',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    {color}
                  </span>
                ))}
              </div>
            </div>
          )}

          {recommendations.clothing_suggestions.length > 0 && (
            <div>
              <h4 style={{ marginBottom: '0.5rem', fontWeight: '500' }}>Clothing Suggestions:</h4>
              <ul style={{ paddingLeft: '1rem' }}>
                {recommendations.clothing_suggestions.map((suggestion: string, index: number) => (
                  <li key={index} style={{ color: '#64748b', marginBottom: '0.25rem' }}>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </RecommendationsCard>
      )}
    </ProfileContainer>
  );
};

export default Profile;