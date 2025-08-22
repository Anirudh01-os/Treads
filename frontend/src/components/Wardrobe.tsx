import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';

const WardrobeContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
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

const WardrobeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const WardrobeStats = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: ${props => props.theme.colors.textSecondary};
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 0.5rem;
  background: ${props => props.theme.colors.background};
  padding: 0.25rem;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.border};
`;

const FilterTab = styled.button<{ $active: boolean }>`
  padding: 0.5rem 1rem;
  border: none;
  background: ${props => props.$active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.$active ? 'white' : props.theme.colors.textSecondary};
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$active ? props.theme.colors.primary : `${props.theme.colors.primary}20`};
  }
`;

const ClothingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const ClothingCard = styled(motion.div)`
  background: ${props => props.theme.colors.surface};
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid ${props => props.theme.colors.border};
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: ${props => props.theme.colors.primary};
  }
`;

const ClothingImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid ${props => props.theme.colors.border};
`;

const ClothingInfo = styled.div`
  margin-bottom: 1rem;
`;

const ClothingType = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin-bottom: 0.25rem;
`;

const ClothingDetails = styled.div`
  font-size: 0.9rem;
  color: ${props => props.theme.colors.textSecondary};
`;

const ClothingActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  flex: 1;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: ${props.theme.colors.primary};
          color: white;
          border: none;
          &:hover { background: ${props.theme.colors.primary}dd; }
        `;
      case 'danger':
        return `
          background: ${props.theme.colors.error};
          color: white;
          border: none;
          &:hover { background: ${props.theme.colors.error}dd; }
        `;
      default:
        return `
          background: ${props.theme.colors.background};
          color: ${props.theme.colors.text};
          border: 1px solid ${props.theme.colors.border};
          &:hover { border-color: ${props.theme.colors.primary}; }
        `;
    }
  }}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: ${props => props.theme.colors.textSecondary};
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
`;

const EmptyTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.text};
`;

const EmptyDescription = styled.p`
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const EmptyButton = styled.button`
  background: ${props => props.theme.colors.primary};
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.primary}dd;
    transform: translateY(-1px);
  }
`;

const Wardrobe: React.FC = () => {
  const [clothingItems, setClothingItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');

  const filters = [
    { key: 'all', label: 'All Items' },
    { key: 'tops', label: 'Tops' },
    { key: 'bottoms', label: 'Bottoms' },
    { key: 'dresses', label: 'Dresses' },
    { key: 'outerwear', label: 'Outerwear' },
    { key: 'favorites', label: 'Favorites' }
  ];

  useEffect(() => {
    const storedUserId = localStorage.getItem('treads_user_id');
    if (storedUserId) {
      setUserId(storedUserId);
      loadWardrobe(storedUserId);
    }
    loadAllClothingItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [clothingItems, activeFilter]);

  const loadWardrobe = async (id: string) => {
    try {
      const response = await axios.get(`/api/user/${id}/wardrobe`);
      // This would contain user's saved items
      console.log('User wardrobe:', response.data);
    } catch (error) {
      console.error('Failed to load wardrobe:', error);
    }
  };

  const loadAllClothingItems = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/clothing/list');
      setClothingItems(response.data.items || []);
    } catch (error) {
      console.error('Failed to load clothing items:', error);
      toast.error('Failed to load clothing items');
    } finally {
      setIsLoading(false);
    }
  };

  const filterItems = () => {
    if (activeFilter === 'all') {
      setFilteredItems(clothingItems);
    } else {
      // In a real app, you'd filter based on clothing analysis data
      setFilteredItems(clothingItems);
    }
  };

  const addToWardrobe = async (clothingId: string) => {
    if (!userId) {
      toast.error('Please create a profile first');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('clothing_id', clothingId);
      
      await axios.post(`/api/user/${userId}/wardrobe/add`, formData);
      toast.success('Added to wardrobe!');
    } catch (error) {
      console.error('Failed to add to wardrobe:', error);
      toast.error('Failed to add to wardrobe');
    }
  };

  const deleteClothingItem = async (clothingId: string) => {
    try {
      await axios.delete(`/api/clothing/${clothingId}`);
      setClothingItems(prev => prev.filter(item => item.file_id !== clothingId));
      toast.success('Item deleted successfully');
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast.error('Failed to delete item');
    }
  };

  if (isLoading) {
    return (
      <WardrobeContainer>
        <PageTitle>Your Wardrobe</PageTitle>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <motion.div
            style={{
              width: '50px',
              height: '50px',
              border: '3px solid #e2e8f0',
              borderTop: '3px solid #6366f1',
              borderRadius: '50%',
              margin: '0 auto'
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading your wardrobe...</p>
        </div>
      </WardrobeContainer>
    );
  }

  return (
    <WardrobeContainer>
      <PageTitle>Your Wardrobe</PageTitle>
      
      <WardrobeHeader>
        <WardrobeStats>
          <StatItem>
            <StatNumber>{clothingItems.length}</StatNumber>
            <StatLabel>Total Items</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>{filteredItems.length}</StatNumber>
            <StatLabel>Filtered</StatLabel>
          </StatItem>
        </WardrobeStats>

        <FilterTabs>
          {filters.map((filter) => (
            <FilterTab
              key={filter.key}
              $active={activeFilter === filter.key}
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.label}
            </FilterTab>
          ))}
        </FilterTabs>
      </WardrobeHeader>

      {filteredItems.length > 0 ? (
        <ClothingGrid>
          <AnimatePresence>
            {filteredItems.map((item, index) => (
              <ClothingCard
                key={item.file_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                layout
              >
                <ClothingImage
                  src={`/uploads/clothing/${item.file_id}_processed.png`}
                  alt="Clothing item"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `/uploads/clothing/${item.file_id}_original.jpg`;
                  }}
                />
                
                <ClothingInfo>
                  <ClothingType>Clothing Item</ClothingType>
                  <ClothingDetails>
                    Added {new Date(item.created_at).toLocaleDateString()}
                  </ClothingDetails>
                </ClothingInfo>

                <ClothingActions>
                  <ActionButton
                    $variant="primary"
                    onClick={() => addToWardrobe(item.file_id)}
                  >
                    Add to Wardrobe
                  </ActionButton>
                  <ActionButton
                    onClick={() => {
                      // Navigate to try-on with this item selected
                      window.location.href = `/try-on?clothing=${item.file_id}`;
                    }}
                  >
                    Try On
                  </ActionButton>
                  <ActionButton
                    $variant="danger"
                    onClick={() => deleteClothingItem(item.file_id)}
                  >
                    Delete
                  </ActionButton>
                </ClothingActions>
              </ClothingCard>
            ))}
          </AnimatePresence>
        </ClothingGrid>
      ) : (
        <EmptyState>
          <EmptyIcon>👗</EmptyIcon>
          <EmptyTitle>Your wardrobe is empty</EmptyTitle>
          <EmptyDescription>
            Start building your virtual wardrobe by uploading photos of your clothes.
            Our AI will analyze them and help you create amazing outfits!
          </EmptyDescription>
          <EmptyButton
            onClick={() => window.location.href = '/upload-clothing'}
          >
            Upload Your First Item
          </EmptyButton>
        </EmptyState>
      )}
    </WardrobeContainer>
  );
};

export default Wardrobe;