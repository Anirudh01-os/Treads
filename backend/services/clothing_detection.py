import cv2
import numpy as np
from PIL import Image
import torch
import torchvision.transforms as transforms
from ultralytics import YOLO
from sklearn.cluster import KMeans
import webcolors
from typing import Dict, List, Tuple, Optional
import io
import json

class ClothingDetectionService:
    def __init__(self):
        # Load YOLO model for clothing detection
        self.clothing_model = None
        self._load_models()
        
        # Color mappings
        self.color_names = {
            'red': (255, 0, 0),
            'green': (0, 255, 0),
            'blue': (0, 0, 255),
            'yellow': (255, 255, 0),
            'purple': (128, 0, 128),
            'orange': (255, 165, 0),
            'pink': (255, 192, 203),
            'brown': (165, 42, 42),
            'black': (0, 0, 0),
            'white': (255, 255, 255),
            'gray': (128, 128, 128),
            'navy': (0, 0, 128),
            'beige': (245, 245, 220),
            'maroon': (128, 0, 0)
        }
        
        # Clothing categories
        self.clothing_categories = {
            0: "t-shirt",
            1: "shirt", 
            2: "sweater",
            3: "dress",
            4: "pants",
            5: "jeans",
            6: "shorts",
            7: "skirt",
            8: "jacket",
            9: "coat",
            10: "hoodie",
            11: "blazer",
            12: "suit",
            13: "tank-top",
            14: "polo",
            15: "cardigan"
        }
        
        # Material patterns (simplified)
        self.material_keywords = {
            "cotton": ["cotton", "soft", "breathable"],
            "denim": ["denim", "jeans", "sturdy"],
            "silk": ["silk", "smooth", "shiny"],
            "wool": ["wool", "warm", "textured"],
            "polyester": ["polyester", "synthetic"],
            "leather": ["leather", "smooth", "dark"],
            "linen": ["linen", "light", "breathable"],
            "cashmere": ["cashmere", "soft", "luxury"]
        }
    
    def _load_models(self):
        """Load AI models for clothing detection"""
        try:
            # Load YOLO model (you can train custom model or use pretrained)
            # For now, we'll use a general object detection model
            self.clothing_model = YOLO('yolov8n.pt')  # Lightweight model
        except Exception as e:
            print(f"Warning: Could not load YOLO model: {e}")
            self.clothing_model = None
    
    async def analyze_clothing(self, image_data: bytes) -> Dict:
        """
        Comprehensive clothing analysis
        
        Returns:
            Dictionary with clothing_type, colors, material, confidence scores
        """
        try:
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_data))
            
            # Parallel analysis
            clothing_type = await self.detect_clothing_type(image)
            colors = await self.extract_colors(image)
            material = await self.predict_material(image)
            
            return {
                "clothing_type": clothing_type,
                "colors": colors,
                "material": material,
                "analysis_confidence": self._calculate_overall_confidence(
                    clothing_type, colors, material
                )
            }
            
        except Exception as e:
            raise Exception(f"Clothing analysis failed: {str(e)}")
    
    async def detect_clothing_type(self, image: Image.Image) -> Dict:
        """
        Detect type of clothing using computer vision
        """
        try:
            # Convert PIL to OpenCV format
            cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            # Use YOLO for detection if available
            if self.clothing_model:
                results = self.clothing_model(cv_image)
                
                # Process YOLO results
                detections = []
                for result in results:
                    boxes = result.boxes
                    if boxes is not None:
                        for box in boxes:
                            class_id = int(box.cls)
                            confidence = float(box.conf)
                            
                            # Map to clothing categories (simplified)
                            clothing_type = self._map_yolo_to_clothing(class_id)
                            if clothing_type:
                                detections.append({
                                    "type": clothing_type,
                                    "confidence": confidence
                                })
                
                if detections:
                    # Return highest confidence detection
                    best_detection = max(detections, key=lambda x: x["confidence"])
                    return best_detection
            
            # Fallback: Rule-based detection using image properties
            return await self._rule_based_clothing_detection(image)
            
        except Exception as e:
            return {"type": "unknown", "confidence": 0.0, "error": str(e)}
    
    async def extract_colors(self, image: Image.Image, num_colors: int = 5) -> Dict:
        """
        Extract dominant colors from clothing image
        """
        try:
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize for faster processing
            image_small = image.resize((150, 150))
            
            # Convert to numpy array
            img_array = np.array(image_small)
            
            # Reshape for clustering
            pixels = img_array.reshape(-1, 3)
            
            # Remove white/transparent background pixels
            mask = np.sum(pixels, axis=1) < 750  # Not pure white
            filtered_pixels = pixels[mask]
            
            if len(filtered_pixels) == 0:
                return {"colors": [], "dominant_color": "white"}
            
            # K-means clustering for color extraction
            kmeans = KMeans(n_clusters=min(num_colors, len(filtered_pixels)), random_state=42)
            kmeans.fit(filtered_pixels)
            
            colors = []
            for i, color in enumerate(kmeans.cluster_centers_):
                color_rgb = tuple(map(int, color))
                color_name = self._get_color_name(color_rgb)
                percentage = np.sum(kmeans.labels_ == i) / len(kmeans.labels_) * 100
                
                colors.append({
                    "rgb": color_rgb,
                    "hex": "#{:02x}{:02x}{:02x}".format(*color_rgb),
                    "name": color_name,
                    "percentage": round(percentage, 2)
                })
            
            # Sort by percentage
            colors.sort(key=lambda x: x["percentage"], reverse=True)
            
            return {
                "colors": colors,
                "dominant_color": colors[0]["name"] if colors else "unknown"
            }
            
        except Exception as e:
            return {"colors": [], "dominant_color": "unknown", "error": str(e)}
    
    async def predict_material(self, image: Image.Image) -> Dict:
        """
        Predict clothing material using image analysis
        """
        try:
            # Convert to grayscale for texture analysis
            gray = image.convert('L')
            gray_array = np.array(gray)
            
            # Texture analysis features
            features = self._extract_texture_features(gray_array)
            
            # Rule-based material prediction (simplified)
            material_scores = {}
            
            # Analyze texture variance
            variance = features['variance']
            smoothness = features['smoothness']
            contrast = features['contrast']
            
            # Simple heuristics for material detection
            if smoothness > 0.8 and variance < 100:
                material_scores['silk'] = 0.7
                material_scores['satin'] = 0.6
            elif variance > 500 and contrast > 0.6:
                material_scores['denim'] = 0.8
                material_scores['canvas'] = 0.6
            elif smoothness > 0.6 and variance < 200:
                material_scores['cotton'] = 0.7
                material_scores['polyester'] = 0.6
            elif variance > 300:
                material_scores['wool'] = 0.6
                material_scores['tweed'] = 0.5
            else:
                material_scores['cotton'] = 0.5
            
            # Get best prediction
            if material_scores:
                best_material = max(material_scores.items(), key=lambda x: x[1])
                return {
                    "material": best_material[0],
                    "confidence": best_material[1],
                    "all_predictions": material_scores,
                    "texture_features": features
                }
            else:
                return {
                    "material": "cotton",
                    "confidence": 0.3,
                    "texture_features": features
                }
                
        except Exception as e:
            return {"material": "unknown", "confidence": 0.0, "error": str(e)}
    
    def _map_yolo_to_clothing(self, class_id: int) -> Optional[str]:
        """Map YOLO class IDs to clothing categories"""
        # This is a simplified mapping - you'd need to train a custom model
        # or use a clothing-specific dataset
        yolo_to_clothing = {
            0: "t-shirt",  # person -> could be wearing t-shirt
            # Add more mappings based on your model
        }
        return yolo_to_clothing.get(class_id)
    
    async def _rule_based_clothing_detection(self, image: Image.Image) -> Dict:
        """
        Fallback rule-based clothing detection using image properties
        """
        # Analyze image dimensions and aspect ratio
        width, height = image.size
        aspect_ratio = width / height
        
        # Simple heuristics based on common clothing proportions
        if aspect_ratio > 1.2:
            return {"type": "pants", "confidence": 0.6}
        elif aspect_ratio < 0.8:
            return {"type": "dress", "confidence": 0.5}
        elif 0.9 <= aspect_ratio <= 1.1:
            return {"type": "t-shirt", "confidence": 0.5}
        else:
            return {"type": "shirt", "confidence": 0.4}
    
    def _extract_texture_features(self, gray_array: np.ndarray) -> Dict:
        """Extract texture features for material analysis"""
        # Calculate various texture metrics
        variance = np.var(gray_array)
        
        # Smoothness (inverse of variance)
        smoothness = 1 / (1 + variance)
        
        # Contrast using standard deviation
        contrast = np.std(gray_array) / 255.0
        
        # Local binary pattern (simplified)
        lbp_variance = self._calculate_lbp_variance(gray_array)
        
        return {
            "variance": float(variance),
            "smoothness": float(smoothness),
            "contrast": float(contrast),
            "lbp_variance": float(lbp_variance)
        }
    
    def _calculate_lbp_variance(self, gray_array: np.ndarray) -> float:
        """Calculate Local Binary Pattern variance for texture analysis"""
        try:
            # Simplified LBP calculation
            rows, cols = gray_array.shape
            lbp = np.zeros((rows-2, cols-2))
            
            for i in range(1, rows-1):
                for j in range(1, cols-1):
                    center = gray_array[i, j]
                    binary_string = ""
                    
                    # 8-neighborhood
                    neighbors = [
                        gray_array[i-1, j-1], gray_array[i-1, j], gray_array[i-1, j+1],
                        gray_array[i, j+1], gray_array[i+1, j+1], gray_array[i+1, j],
                        gray_array[i+1, j-1], gray_array[i, j-1]
                    ]
                    
                    for neighbor in neighbors:
                        binary_string += '1' if neighbor >= center else '0'
                    
                    lbp[i-1, j-1] = int(binary_string, 2)
            
            return np.var(lbp)
            
        except Exception:
            return 0.0
    
    def _get_color_name(self, rgb_color: Tuple[int, int, int]) -> str:
        """Get closest color name for RGB value"""
        try:
            # Try to get exact match first
            color_name = webcolors.rgb_to_name(rgb_color)
            return color_name
        except ValueError:
            # Find closest color
            min_distance = float('inf')
            closest_color = 'unknown'
            
            for name, rgb in self.color_names.items():
                distance = sum(abs(a - b) for a, b in zip(rgb_color, rgb))
                if distance < min_distance:
                    min_distance = distance
                    closest_color = name
            
            return closest_color
    
    def _calculate_overall_confidence(self, clothing_type: Dict, colors: Dict, material: Dict) -> float:
        """Calculate overall confidence score for clothing analysis"""
        type_confidence = clothing_type.get("confidence", 0.0)
        color_confidence = 1.0 if colors.get("colors") else 0.0
        material_confidence = material.get("confidence", 0.0)
        
        return (type_confidence + color_confidence + material_confidence) / 3.0

# Global instance
clothing_detection_service = ClothingDetectionService()