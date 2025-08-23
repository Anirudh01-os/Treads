import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';

const UploadContainer = styled.div`
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

const UploadSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  margin-bottom: 3rem;

  @media (max-width: ${props => props.theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const DropzoneContainer = styled(motion.div)<{ $isDragActive: boolean }>`
  border: 2px dashed ${props => props.$isDragActive ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: 16px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.$isDragActive ? `${props.theme.colors.primary}10` : props.theme.colors.surface};

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    background: ${props => props.theme.colors.primary}05;
  }
`;

const DropzoneIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.6;
`;

const DropzoneTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.colors.text};
`;

const DropzoneSubtitle = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: 1.5rem;
`;

const UploadButton = styled.button`
  background: ${props => props.theme.colors.primary};
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.primary}dd;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const PreviewSection = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid ${props => props.theme.colors.border};
`;

const PreviewTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: ${props => props.theme.colors.text};
`;

const ImagePreview = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.border};
`;

const AnalysisResults = styled(motion.div)`
  background: ${props => props.theme.colors.background};
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid ${props => props.theme.colors.border};
`;

const AnalysisItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid ${props => props.theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const AnalysisLabel = styled.span`
  font-weight: 500;
  color: ${props => props.theme.colors.text};
`;

const AnalysisValue = styled.span`
  color: ${props => props.theme.colors.textSecondary};
  font-weight: 400;
`;

const ColorPalette = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const ColorSwatch = styled.div<{ $color: string }>`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background-color: ${props => props.$color};
  border: 1px solid ${props => props.theme.colors.border};
`;

const LoadingSpinner = styled(motion.div)`
  width: 40px;
  height: 40px;
  border: 3px solid ${props => props.theme.colors.border};
  border-top: 3px solid ${props => props.theme.colors.primary};
  border-radius: 50%;
  margin: 2rem auto;
`;

const OptionsPanel = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const OptionCheckbox = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  
  input {
    accent-color: ${props => props.theme.colors.primary};
  }
`;

interface UploadedFile {
  file: File;
  preview: string;
  id: string;
}

interface AnalysisResult {
  clothing_type: {
    type: string;
    confidence: number;
  };
  colors: {
    colors: Array<{
      name: string;
      hex: string;
      percentage: number;
    }>;
    dominant_color: string;
  };
  material: {
    material: string;
    confidence: number;
  };
}

const ClothingUpload: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<Record<string, AnalysisResult>>({});
  const [removeBackground, setRemoveBackground] = useState(true);
  const [analyzeClothing, setAnalyzeClothing] = useState(true);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Auto-upload files
    newFiles.forEach(uploadFile);
  }, [removeBackground, analyzeClothing]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 10
  });

  const uploadFile = async (fileData: UploadedFile) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', fileData.file);
      formData.append('remove_background', removeBackground.toString());
      formData.append('analyze_clothing', analyzeClothing.toString());

      const response = await axios.post('/api/clothing/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.analysis) {
        setAnalysisResults(prev => ({
          ...prev,
          [fileData.id]: response.data.analysis
        }));
      }

      toast.success('Clothing uploaded and analyzed successfully!');
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload clothing. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
    setAnalysisResults(prev => {
      const newResults = { ...prev };
      delete newResults[id];
      return newResults;
    });
  };

  return (
    <UploadContainer>
      <PageTitle>Upload Your Clothes</PageTitle>
      
      <UploadSection>
        <div>
          <OptionsPanel>
            <OptionCheckbox>
              <input
                type="checkbox"
                checked={removeBackground}
                onChange={(e) => setRemoveBackground(e.target.checked)}
              />
              Remove Background
            </OptionCheckbox>
            <OptionCheckbox>
              <input
                type="checkbox"
                checked={analyzeClothing}
                onChange={(e) => setAnalyzeClothing(e.target.checked)}
              />
              Analyze Clothing
            </OptionCheckbox>
          </OptionsPanel>

          <DropzoneContainer
            {...getRootProps()}
            $isDragActive={isDragActive}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <input {...getInputProps()} />
            <DropzoneIcon>
              {isDragActive ? '📤' : '📷'}
            </DropzoneIcon>
            <DropzoneTitle>
              {isDragActive ? 'Drop your clothes here!' : 'Upload Clothing Photos'}
            </DropzoneTitle>
            <DropzoneSubtitle>
              Drag & drop images here, or click to select files
              <br />
              Supports JPG, PNG, WebP formats
            </DropzoneSubtitle>
            <UploadButton type="button" disabled={isUploading}>
              {isUploading ? 'Processing...' : 'Choose Files'}
            </UploadButton>
          </DropzoneContainer>
        </div>

        <PreviewSection>
          <PreviewTitle>Analysis Results</PreviewTitle>
          
          {isUploading && (
            <LoadingSpinner
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          )}

          <AnimatePresence>
            {uploadedFiles.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{ marginBottom: '2rem' }}
              >
                <ImagePreview>
                  <div>
                    <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>Original</h4>
                    <PreviewImage src={file.preview} alt="Original" />
                  </div>
                  <div>
                    <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>Processed</h4>
                    <PreviewImage src={file.preview} alt="Processed" />
                  </div>
                </ImagePreview>

                {analysisResults[file.id] && (
                  <AnalysisResults
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <AnalysisItem>
                      <AnalysisLabel>Type</AnalysisLabel>
                      <AnalysisValue>
                        {analysisResults[file.id].clothing_type.type} 
                        ({Math.round(analysisResults[file.id].clothing_type.confidence * 100)}%)
                      </AnalysisValue>
                    </AnalysisItem>
                    
                    <AnalysisItem>
                      <AnalysisLabel>Material</AnalysisLabel>
                      <AnalysisValue>
                        {analysisResults[file.id].material.material}
                        ({Math.round(analysisResults[file.id].material.confidence * 100)}%)
                      </AnalysisValue>
                    </AnalysisItem>
                    
                    <AnalysisItem>
                      <AnalysisLabel>Colors</AnalysisLabel>
                      <ColorPalette>
                        {analysisResults[file.id].colors.colors.slice(0, 5).map((color, index) => (
                          <ColorSwatch
                            key={index}
                            $color={color.hex}
                            title={`${color.name} (${color.percentage}%)`}
                          />
                        ))}
                      </ColorPalette>
                    </AnalysisItem>
                    
                    <AnalysisItem>
                      <AnalysisLabel>Dominant Color</AnalysisLabel>
                      <AnalysisValue>{analysisResults[file.id].colors.dominant_color}</AnalysisValue>
                    </AnalysisItem>
                  </AnalysisResults>
                )}

                <button
                  onClick={() => removeFile(file.id)}
                  style={{
                    background: 'none',
                    border: `1px solid ${theme.colors.error}`,
                    color: theme.colors.error,
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    marginTop: '1rem',
                    fontSize: '0.9rem'
                  }}
                >
                  Remove
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {uploadedFiles.length === 0 && !isUploading && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              No clothes uploaded yet. Start by uploading some clothing photos above!
            </div>
          )}
        </PreviewSection>
      </UploadSection>

      {uploadedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center' }}
        >
          <UploadButton
            as={motion.button}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              borderRadius: '12px'
            }}
            onClick={() => {
              toast.success('Ready for virtual try-on!');
              // Navigate to try-on page
              window.location.href = '/try-on';
            }}
          >
            Start Virtual Try-On →
          </UploadButton>
        </motion.div>
      )}
    </UploadContainer>
  );
};

// Access theme for inline styles
const theme = {
  colors: {
    error: '#ef4444',
    primary: '#6366f1',
    secondary: '#ec4899'
  }
};

export default ClothingUpload;