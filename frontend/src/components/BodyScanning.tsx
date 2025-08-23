import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';

const ScanContainer = styled.div`
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

const ScanLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 3rem;

  @media (max-width: ${props => props.theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const CameraSection = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid ${props => props.theme.colors.border};
  text-align: center;
`;

const CameraContainer = styled.div`
  position: relative;
  display: inline-block;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.background};
`;

const WebcamStyled = styled(Webcam)`
  width: 100%;
  max-width: 480px;
  height: auto;
  display: block;
`;

const CameraOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
`;

const PoseGuide = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 300px;
  border: 2px dashed ${props => props.theme.colors.primary};
  border-radius: 12px;
  opacity: 0.6;
  
  &::before {
    content: '🧍';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 3rem;
    opacity: 0.5;
  }
`;

const CameraControls = styled.div`
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const ControlButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;

  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: ${props.theme.colors.primary};
          color: white;
          &:hover { background: ${props.theme.colors.primary}dd; }
        `;
      case 'danger':
        return `
          background: ${props.theme.colors.error};
          color: white;
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

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const FormSection = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid ${props => props.theme.colors.border};
`;

const FormTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: ${props => props.theme.colors.text};
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

const InstructionsPanel = styled(motion.div)`
  background: ${props => props.theme.colors.background};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid ${props => props.theme.colors.border};
`;

const InstructionStep = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  background: ${props => props.$active ? `${props.theme.colors.primary}15` : 'transparent'};
  border: 1px solid ${props => props.$active ? props.theme.colors.primary : 'transparent'};
`;

const StepNumber = styled.div<{ $active?: boolean }>`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.border};
  color: ${props => props.$active ? 'white' : props.theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
`;

const StepText = styled.div`
  color: ${props => props.theme.colors.text};
  font-weight: 500;
`;

const ResultsPanel = styled(motion.div)`
  background: ${props => props.theme.colors.background};
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid ${props => props.theme.colors.border};
  margin-top: 2rem;
`;

const BodyScanning: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [bodyModelResult, setBodyModelResult] = useState<any>(null);
  
  // Form data
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('');

  const steps = [
    'Position yourself in the camera view',
    'Stand straight with arms slightly away from body',
    'Capture your photo',
    'Provide your measurements',
    'Generate 3D body model'
  ];

  const startCamera = useCallback(() => {
    setCameraActive(true);
    setCurrentStep(1);
  }, []);

  const stopCamera = useCallback(() => {
    setCameraActive(false);
    setCapturedImage(null);
    setCurrentStep(1);
  }, []);

  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setCameraActive(false);
      setCurrentStep(4);
      toast.success('Photo captured! Now provide your measurements.');
    }
  }, []);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setCameraActive(true);
    setCurrentStep(2);
  }, []);

  const generateBodyModel = async () => {
    if (!capturedImage) {
      toast.error('Please capture a photo first');
      return;
    }

    setIsProcessing(true);
    setCurrentStep(5);

    try {
      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('file', blob, 'body_scan.jpg');
      
      if (height) formData.append('height', height);
      if (weight) formData.append('weight', weight);
      if (age) formData.append('age', age);
      if (gender) formData.append('gender', gender);

      const apiResponse = await axios.post('/api/body/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setBodyModelResult(apiResponse.data);
      toast.success('3D body model generated successfully!');
      
    } catch (error) {
      console.error('Body model generation failed:', error);
      toast.error('Failed to generate body model. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ScanContainer>
      <PageTitle>Body Scanning</PageTitle>
      
      <InstructionsPanel
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 style={{ marginBottom: '1rem', color: '#1e293b' }}>Instructions</h3>
        {steps.map((step, index) => (
          <InstructionStep key={index} $active={currentStep === index + 1}>
            <StepNumber $active={currentStep === index + 1}>{index + 1}</StepNumber>
            <StepText>{step}</StepText>
          </InstructionStep>
        ))}
      </InstructionsPanel>

      <ScanLayout>
        <CameraSection>
          <h3 style={{ marginBottom: '1.5rem' }}>Camera</h3>
          
          <CameraContainer>
            {cameraActive && (
              <>
                <WebcamRef
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    width: 480,
                    height: 640,
                    facingMode: "user"
                  }}
                />
                <CameraOverlay>
                  <PoseGuide />
                </CameraOverlay>
              </>
            )}
            
            {capturedImage && !cameraActive && (
              <img
                src={capturedImage}
                alt="Captured"
                style={{ width: '100%', maxWidth: '480px', height: 'auto', display: 'block' }}
              />
            )}
            
            {!cameraActive && !capturedImage && (
              <div style={{ 
                width: '480px', 
                height: '640px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#64748b',
                fontSize: '1.1rem'
              }}>
                Camera not active
              </div>
            )}
          </CameraContainer>

          <CameraControls>
            {!cameraActive && !capturedImage && (
              <ControlButton $variant="primary" onClick={startCamera}>
                Start Camera
              </ControlButton>
            )}
            
            {cameraActive && (
              <>
                <ControlButton $variant="primary" onClick={capturePhoto}>
                  📸 Capture
                </ControlButton>
                <ControlButton onClick={stopCamera}>
                  Stop Camera
                </ControlButton>
              </>
            )}
            
            {capturedImage && (
              <ControlButton onClick={retakePhoto}>
                🔄 Retake Photo
              </ControlButton>
            )}
          </CameraControls>
        </CameraSection>

        <FormSection>
          <FormTitle>Your Measurements</FormTitle>
          
          <FormGroup>
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="e.g., 175"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="weight">Weight (kg) - Optional</Label>
            <Input
              id="weight"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g., 70"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="age">Age - Optional</Label>
            <Input
              id="age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g., 25"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="gender">Gender - Optional</Label>
            <Select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Select gender</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </Select>
          </FormGroup>

          <ControlButton
            $variant="primary"
            onClick={generateBodyModel}
            disabled={!capturedImage || isProcessing}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {isProcessing ? 'Generating Model...' : 'Generate 3D Model'}
          </ControlButton>

          {bodyModelResult && (
            <ResultsPanel
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h4 style={{ marginBottom: '1rem', color: '#1e293b' }}>Body Model Created!</h4>
              
              <div style={{ marginBottom: '1rem' }}>
                <strong>Body Type:</strong> {bodyModelResult.body_model?.model_params?.body_type || 'Unknown'}
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <strong>Estimated Height:</strong> {bodyModelResult.body_model?.measurements?.estimated_height || 'Unknown'} cm
              </div>
              
              {bodyModelResult.body_model?.model_params?.fit_recommendations && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Fit Recommendations:</strong>
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
                    {bodyModelResult.body_model.model_params.fit_recommendations.tops?.map((rec: string, index: number) => (
                      <li key={index} style={{ color: '#64748b', fontSize: '0.9rem' }}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <ControlButton
                $variant="primary"
                onClick={() => {
                  toast.success('Ready for virtual try-on!');
                  window.location.href = '/try-on';
                }}
                style={{ width: '100%' }}
              >
                Start Virtual Try-On →
              </ControlButton>
            </ResultsPanel>
          )}
        </FormSection>
      </ScanLayout>

      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
          >
            <motion.div
              style={{
                background: 'white',
                padding: '3rem',
                borderRadius: '16px',
                textAlign: 'center',
                maxWidth: '400px'
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <motion.div
                style={{
                  width: '60px',
                  height: '60px',
                  border: '4px solid #e2e8f0',
                  borderTop: '4px solid #6366f1',
                  borderRadius: '50%',
                  margin: '0 auto 1.5rem'
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <h3 style={{ marginBottom: '1rem', color: '#1e293b' }}>Generating 3D Model</h3>
              <p style={{ color: '#64748b' }}>
                Analyzing your body pose and measurements...
                <br />
                This may take a moment.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ScanContainer>
  );
};

// Styled Webcam wrapper to handle ref properly
const WebcamRef = React.forwardRef<Webcam, any>((props, ref) => (
  <WebcamStyled {...props} ref={ref} />
));

export default BodyScanning;