# Treads - Virtual Try-On App
AI-Powered Virtual Clothing Try-On Experience

## Features

### Core Features
- **Smart Photo Upload**: Upload clothing images with automatic background removal
- **AI Clothing Analysis**: Auto-detection of clothing type, color, and material
- **3D Body Modeling**: Generate 3D body models from user photos/scans
- **Real-time AR Try-Ons**: Accurate fit visualization with augmented reality
- **Style Recommendations**: AI understands and suggests your style

### Future Features
- Accessories try-on integration
- Makeup try-on capabilities
- Social sharing and style communities

## Technology Stack

### Frontend
- **React** with TypeScript for web interface
- **Three.js** for 3D rendering and AR
- **MediaPipe** for body pose detection
- **TensorFlow.js** for client-side AI inference

### Backend
- **FastAPI** (Python) for API services
- **PyTorch** for deep learning models
- **OpenCV** for image processing
- **Rembg** for background removal
- **MediaPipe** for body analysis

### AI/ML Models
- **U2Net** for background removal
- **YOLO** for clothing detection
- **ResNet** for material classification
- **SMPL** for 3D body modeling

## Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.9+
- CUDA (optional, for GPU acceleration)

### Installation

1. **Clone and setup**
```bash
git clone <repository-url>
cd treads
```

2. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Frontend Setup**
```bash
cd frontend
npm install
```

4. **Run the Application**
```bash
# Terminal 1 - Backend
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm start
```

## Project Structure
```
treads/
├── backend/           # Python FastAPI backend
│   ├── models/        # AI/ML models
│   ├── services/      # Business logic
│   ├── api/          # API endpoints
│   └── utils/        # Utility functions
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── utils/
│   └── public/
├── models/           # Pre-trained model files
└── docs/            # Documentation
```

## API Documentation
Once running, visit: http://localhost:8000/docs

## Contributing
Please read our contributing guidelines before submitting pull requests.

## License
MIT License - see LICENSE file for details.
