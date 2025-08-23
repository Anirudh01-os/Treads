import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import toast from 'react-hot-toast';
import axios from 'axios';

const TryOnContainer = styled.div`
  padding: 2rem;
  max-width: 1400px;
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

const TryOnLayout = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: 2rem;
  height: calc(100vh - 200px);

  @media (max-width: ${props => props.theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
    height: auto;
    gap: 1rem;
  }
`;

const SidePanel = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid ${props => props.theme.colors.border};
  height: fit-content;
`;

const PanelTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: ${props => props.theme.colors.text};
`;

const ViewerContainer = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 16px;
  border: 1px solid ${props => props.theme.colors.border};
  overflow: hidden;
  position: relative;
  height: 600px;

  @media (max-width: ${props => props.theme.breakpoints.desktop}) {
    height: 400px;
  }
`;

const ControlButton = styled.button<{ $active?: boolean }>`
  width: 100%;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  border: 1px solid ${props => props.$active ? props.theme.colors.primary : props.theme.colors.border};
  background: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.surface};
  color: ${props => props.$active ? 'white' : props.theme.colors.text};
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    background: ${props => props.$active ? props.theme.colors.primary : `${props.theme.colors.primary}10`};
  }
`;

const ClothingItem = styled(motion.div)<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid ${props => props.$selected ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: 8px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.$selected ? `${props.theme.colors.primary}10` : props.theme.colors.background};

  &:hover {
    border-color: ${props => props.theme.colors.primary};
  }
`;

const ClothingThumbnail = styled.img`
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid ${props => props.theme.colors.border};
`;

const ClothingInfo = styled.div`
  flex: 1;
`;

const ClothingName = styled.div`
  font-weight: 500;
  color: ${props => props.theme.colors.text};
  font-size: 0.9rem;
`;

const ClothingDetails = styled.div`
  font-size: 0.8rem;
  color: ${props => props.theme.colors.textSecondary};
`;

const ARControls = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  z-index: 10;
`;

const ARButton = styled.button<{ $active?: boolean }>`
  padding: 0.5rem 1rem;
  background: ${props => props.$active ? props.theme.colors.primary : 'rgba(255, 255, 255, 0.9)'};
  color: ${props => props.$active ? 'white' : props.theme.colors.text};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$active ? props.theme.colors.primary : 'rgba(255, 255, 255, 1)'};
  }
`;

const LoadingOverlay = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
`;

const LoadingSpinner = styled(motion.div)`
  width: 50px;
  height: 50px;
  border: 3px solid ${props => props.theme.colors.border};
  border-top: 3px solid ${props => props.theme.colors.primary};
  border-radius: 50%;
`;

// 3D Body Model Component
const BodyModel: React.FC<{ bodyData?: any; clothingData?: any[] }> = ({ bodyData, clothingData }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  // Create geometry from body data
  const geometry = React.useMemo(() => {
    if (!bodyData?.mesh_data?.vertices) {
      // Default body geometry
      return new THREE.CylinderGeometry(0.3, 0.2, 1.8, 8);
    }
    
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(bodyData.mesh_data.vertices.flat());
    const faces = new Uint16Array(bodyData.mesh_data.faces.flat());
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(faces, 1));
    geometry.computeVertexNormals();
    
    return geometry;
  }, [bodyData]);

  return (
    <group>
      {/* Body mesh */}
      <mesh ref={meshRef} geometry={geometry} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#fdbcb4"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Clothing meshes */}
      {clothingData?.map((clothing, index) => (
        <mesh key={index} position={[0, 0.1, 0]}>
          <boxGeometry args={[0.6, 0.8, 0.2]} />
          <meshStandardMaterial
            color="#4f46e5"
            roughness={0.6}
            metalness={0.2}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
      
      {/* Floor shadow */}
      <ContactShadows
        position={[0, -0.9, 0]}
        opacity={0.4}
        scale={2}
        blur={2}
        far={1}
      />
    </group>
  );
};

// Scene setup component
const Scene: React.FC<{ bodyData?: any; clothingData?: any[] }> = ({ bodyData, clothingData }) => {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 1, 3]} fov={50} />
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={8}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI - Math.PI / 6}
      />
      
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-10, -10, -5]} intensity={0.3} />
      
      <Environment preset="studio" />
      
      <BodyModel bodyData={bodyData} clothingData={clothingData} />
    </>
  );
};

const VirtualTryOn: React.FC = () => {
  const [selectedClothing, setSelectedClothing] = useState<string[]>([]);
  const [bodyModelId, setBodyModelId] = useState<string>('');
  const [availableClothing, setAvailableClothing] = useState<any[]>([]);
  const [bodyModels, setBodyModels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentBodyData, setCurrentBodyData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'3d' | 'ar'>('3d');
  const [tryonSession, setTryonSession] = useState<any>(null);

  useEffect(() => {
    loadAvailableData();
  }, []);

  const loadAvailableData = async () => {
    try {
      // Load available clothing items
      const clothingResponse = await axios.get('/api/clothing/list');
      setAvailableClothing(clothingResponse.data.items || []);

      // Load available body models
      const bodyResponse = await axios.get('/api/body/list');
      setBodyModels(bodyResponse.data.models || []);
      
      // Auto-select first body model if available
      if (bodyResponse.data.models?.length > 0) {
        setBodyModelId(bodyResponse.data.models[0].model_id);
        loadBodyModel(bodyResponse.data.models[0].model_id);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load clothing and body data');
    }
  };

  const loadBodyModel = async (modelId: string) => {
    try {
      const response = await axios.get(`/api/body/${modelId}`);
      setCurrentBodyData(response.data.body_model);
    } catch (error) {
      console.error('Failed to load body model:', error);
      toast.error('Failed to load body model');
    }
  };

  const startTryOnSession = async () => {
    if (!bodyModelId || selectedClothing.length === 0) {
      toast.error('Please select a body model and at least one clothing item');
      return;
    }

    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('body_model_id', bodyModelId);
      selectedClothing.forEach(id => formData.append('clothing_ids', id));
      formData.append('pose_type', 'standing');
      formData.append('lighting', 'natural');

      const response = await axios.post('/api/tryons/create', formData);
      setTryonSession(response.data);
      toast.success('Virtual try-on session created!');
      
    } catch (error) {
      console.error('Try-on creation failed:', error);
      toast.error('Failed to create try-on session');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleClothingSelection = (clothingId: string) => {
    setSelectedClothing(prev => 
      prev.includes(clothingId)
        ? prev.filter(id => id !== clothingId)
        : [...prev, clothingId]
    );
  };

  return (
    <TryOnContainer>
      <PageTitle>Virtual Try-On Experience</PageTitle>
      
      <TryOnLayout>
        {/* Left Panel - Body Models */}
        <SidePanel>
          <PanelTitle>Body Models</PanelTitle>
          {bodyModels.map((model) => (
            <ControlButton
              key={model.model_id}
              $active={bodyModelId === model.model_id}
              onClick={() => {
                setBodyModelId(model.model_id);
                loadBodyModel(model.model_id);
              }}
            >
              {model.body_type} ({model.estimated_height}cm)
            </ControlButton>
          ))}
          
          {bodyModels.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              No body models found.
              <br />
              <a href="/body-scan" style={{ color: '#6366f1', textDecoration: 'underline' }}>
                Create one here
              </a>
            </div>
          )}
        </SidePanel>

        {/* Center - 3D Viewer */}
        <ViewerContainer>
          <ARControls>
            <ARButton
              $active={viewMode === '3d'}
              onClick={() => setViewMode('3d')}
            >
              3D View
            </ARButton>
            <ARButton
              $active={viewMode === 'ar'}
              onClick={() => setViewMode('ar')}
            >
              AR Mode
            </ARButton>
          </ARControls>

          {isLoading && (
            <LoadingOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <LoadingSpinner
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </LoadingOverlay>
          )}

          <Canvas shadows>
            <Suspense fallback={null}>
              <Scene
                bodyData={currentBodyData}
                clothingData={selectedClothing}
              />
            </Suspense>
          </Canvas>
        </ViewerContainer>

        {/* Right Panel - Clothing Selection */}
        <SidePanel>
          <PanelTitle>Clothing Items</PanelTitle>
          
          <div style={{ marginBottom: '1rem' }}>
            <ControlButton
              onClick={startTryOnSession}
              disabled={!bodyModelId || selectedClothing.length === 0}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                color: 'white',
                fontWeight: '600'
              }}
            >
              Start Try-On
            </ControlButton>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {availableClothing.map((clothing) => (
              <ClothingItem
                key={clothing.file_id}
                $selected={selectedClothing.includes(clothing.file_id)}
                onClick={() => toggleClothingSelection(clothing.file_id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ClothingThumbnail
                  src={`/uploads/clothing/${clothing.file_id}_processed.png`}
                  alt="Clothing"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `/uploads/clothing/${clothing.file_id}_original.jpg`;
                  }}
                />
                <ClothingInfo>
                  <ClothingName>Clothing Item</ClothingName>
                  <ClothingDetails>
                    {clothing.has_processed ? 'Processed' : 'Original'}
                  </ClothingDetails>
                </ClothingInfo>
              </ClothingItem>
            ))}
          </div>

          {availableClothing.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              No clothing items found.
              <br />
              <a href="/upload-clothing" style={{ color: '#6366f1', textDecoration: 'underline' }}>
                Upload some here
              </a>
            </div>
          )}

          {tryonSession && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: '1rem',
                padding: '1rem',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px'
              }}
            >
              <h4 style={{ color: '#166534', marginBottom: '0.5rem' }}>Fit Analysis</h4>
              {tryonSession.fit_analysis && Object.entries(tryonSession.fit_analysis).map(([clothingId, analysis]: [string, any]) => (
                <div key={clothingId} style={{ fontSize: '0.9rem', color: '#166534' }}>
                  {analysis.clothing_type}: {Math.round(analysis.fit_score * 100)}% fit
                </div>
              ))}
            </motion.div>
          )}
        </SidePanel>
      </TryOnLayout>
    </TryOnContainer>
  );
};

export default VirtualTryOn;