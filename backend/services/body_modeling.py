import cv2
import numpy as np
import mediapipe as mp
from PIL import Image
import json
import io
from typing import Dict, List, Tuple, Optional, Any
import torch
import math

class BodyModelingService:
    def __init__(self):
        # Initialize MediaPipe
        self.mp_pose = mp.solutions.pose
        self.mp_drawing = mp.solutions.drawing_utils
        self.pose = self.mp_pose.Pose(
            static_image_mode=True,
            model_complexity=2,
            enable_segmentation=True,
            min_detection_confidence=0.5
        )
        
        # Body measurements estimation
        self.body_proportions = {
            'head_to_shoulder': 0.12,
            'shoulder_to_waist': 0.25,
            'waist_to_hip': 0.15,
            'hip_to_knee': 0.25,
            'knee_to_ankle': 0.23,
            'shoulder_width': 0.18,
            'waist_width': 0.14,
            'hip_width': 0.16
        }
    
    async def create_body_model(self, image_data: bytes, user_height: Optional[float] = None) -> Dict:
        """
        Create 3D body model from user photo
        
        Args:
            image_data: User photo bytes
            user_height: Optional height in cm for scaling
            
        Returns:
            Dictionary with body model data, measurements, and pose landmarks
        """
        try:
            # Convert bytes to image
            image = Image.open(io.BytesIO(image_data))
            cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            # Extract pose landmarks
            landmarks = await self.extract_pose_landmarks(cv_image)
            
            if not landmarks:
                raise Exception("Could not detect pose landmarks")
            
            # Calculate body measurements
            measurements = await self.calculate_body_measurements(landmarks, user_height)
            
            # Generate 3D model parameters
            model_params = await self.generate_3d_model_params(landmarks, measurements)
            
            # Create body mesh data
            mesh_data = await self.create_body_mesh(model_params)
            
            return {
                "landmarks": landmarks,
                "measurements": measurements,
                "model_params": model_params,
                "mesh_data": mesh_data,
                "status": "success"
            }
            
        except Exception as e:
            raise Exception(f"Body modeling failed: {str(e)}")
    
    async def extract_pose_landmarks(self, image: np.ndarray) -> Optional[Dict]:
        """
        Extract pose landmarks using MediaPipe
        """
        try:
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Process image
            results = self.pose.process(rgb_image)
            
            if not results.pose_landmarks:
                return None
            
            # Extract landmark coordinates
            landmarks = []
            for landmark in results.pose_landmarks.landmark:
                landmarks.append({
                    'x': landmark.x,
                    'y': landmark.y,
                    'z': landmark.z,
                    'visibility': landmark.visibility
                })
            
            # Key body points for measurements
            key_points = self._extract_key_body_points(landmarks)
            
            return {
                "landmarks": landmarks,
                "key_points": key_points,
                "total_landmarks": len(landmarks)
            }
            
        except Exception as e:
            print(f"Pose extraction error: {e}")
            return None
    
    async def calculate_body_measurements(
        self, 
        landmarks_data: Dict, 
        user_height: Optional[float] = None
    ) -> Dict:
        """
        Calculate body measurements from pose landmarks
        """
        try:
            landmarks = landmarks_data["landmarks"]
            key_points = landmarks_data["key_points"]
            
            # Calculate pixel distances between key points
            pixel_measurements = {}
            
            # Shoulder width
            if key_points["left_shoulder"] and key_points["right_shoulder"]:
                shoulder_width_px = self._calculate_distance(
                    key_points["left_shoulder"], 
                    key_points["right_shoulder"]
                )
                pixel_measurements["shoulder_width"] = shoulder_width_px
            
            # Torso length (shoulder to hip)
            if key_points["shoulder_center"] and key_points["hip_center"]:
                torso_length_px = self._calculate_distance(
                    key_points["shoulder_center"],
                    key_points["hip_center"]
                )
                pixel_measurements["torso_length"] = torso_length_px
            
            # Leg length (hip to ankle)
            if key_points["hip_center"] and key_points["ankle_center"]:
                leg_length_px = self._calculate_distance(
                    key_points["hip_center"],
                    key_points["ankle_center"]
                )
                pixel_measurements["leg_length"] = leg_length_px
            
            # Hip width
            if key_points["left_hip"] and key_points["right_hip"]:
                hip_width_px = self._calculate_distance(
                    key_points["left_hip"],
                    key_points["right_hip"]
                )
                pixel_measurements["hip_width"] = hip_width_px
            
            # Convert to real measurements if height is provided
            real_measurements = {}
            if user_height and "torso_length" in pixel_measurements:
                # Use total body height in pixels as reference
                total_height_px = self._calculate_total_body_height(key_points)
                if total_height_px > 0:
                    scale_factor = user_height / total_height_px
                    
                    for measurement, px_value in pixel_measurements.items():
                        real_measurements[measurement] = px_value * scale_factor
            
            return {
                "pixel_measurements": pixel_measurements,
                "real_measurements": real_measurements,
                "scale_factor": real_measurements.get("scale_factor", 1.0),
                "estimated_height": user_height or self._estimate_height(pixel_measurements)
            }
            
        except Exception as e:
            raise Exception(f"Measurement calculation failed: {str(e)}")
    
    async def generate_3d_model_params(self, landmarks_data: Dict, measurements: Dict) -> Dict:
        """
        Generate parameters for 3D body model (SMPL-like)
        """
        try:
            key_points = landmarks_data["key_points"]
            
            # Basic body shape parameters
            shape_params = {
                "height_scale": measurements.get("estimated_height", 170) / 170,  # Normalize to average
                "shoulder_width_scale": self._calculate_shoulder_scale(measurements),
                "waist_width_scale": self._calculate_waist_scale(measurements),
                "hip_width_scale": self._calculate_hip_scale(measurements),
                "leg_length_scale": self._calculate_leg_scale(measurements)
            }
            
            # Pose parameters (simplified)
            pose_params = self._extract_pose_parameters(landmarks_data["landmarks"])
            
            return {
                "shape_parameters": shape_params,
                "pose_parameters": pose_params,
                "body_type": self._classify_body_type(shape_params),
                "fit_recommendations": self._generate_fit_recommendations(shape_params)
            }
            
        except Exception as e:
            raise Exception(f"3D model parameter generation failed: {str(e)}")
    
    async def create_body_mesh(self, model_params: Dict) -> Dict:
        """
        Create 3D body mesh data for rendering
        """
        try:
            # Simplified mesh generation (in a real app, you'd use SMPL)
            vertices, faces = self._generate_simplified_body_mesh(model_params)
            
            return {
                "vertices": vertices.tolist(),
                "faces": faces.tolist(),
                "vertex_count": len(vertices),
                "face_count": len(faces),
                "format": "obj_compatible"
            }
            
        except Exception as e:
            raise Exception(f"Body mesh creation failed: {str(e)}")
    
    def _extract_key_body_points(self, landmarks: List[Dict]) -> Dict:
        """Extract key body points from MediaPipe landmarks"""
        # MediaPipe pose landmark indices
        mp_indices = {
            "nose": 0,
            "left_shoulder": 11,
            "right_shoulder": 12,
            "left_elbow": 13,
            "right_elbow": 14,
            "left_wrist": 15,
            "right_wrist": 16,
            "left_hip": 23,
            "right_hip": 24,
            "left_knee": 25,
            "right_knee": 26,
            "left_ankle": 27,
            "right_ankle": 28
        }
        
        key_points = {}
        
        for name, idx in mp_indices.items():
            if idx < len(landmarks):
                landmark = landmarks[idx]
                if landmark["visibility"] > 0.5:  # Only use visible landmarks
                    key_points[name] = {
                        "x": landmark["x"],
                        "y": landmark["y"],
                        "z": landmark["z"]
                    }
        
        # Calculate derived points
        if "left_shoulder" in key_points and "right_shoulder" in key_points:
            key_points["shoulder_center"] = {
                "x": (key_points["left_shoulder"]["x"] + key_points["right_shoulder"]["x"]) / 2,
                "y": (key_points["left_shoulder"]["y"] + key_points["right_shoulder"]["y"]) / 2,
                "z": (key_points["left_shoulder"]["z"] + key_points["right_shoulder"]["z"]) / 2
            }
        
        if "left_hip" in key_points and "right_hip" in key_points:
            key_points["hip_center"] = {
                "x": (key_points["left_hip"]["x"] + key_points["right_hip"]["x"]) / 2,
                "y": (key_points["left_hip"]["y"] + key_points["right_hip"]["y"]) / 2,
                "z": (key_points["left_hip"]["z"] + key_points["right_hip"]["z"]) / 2
            }
        
        if "left_ankle" in key_points and "right_ankle" in key_points:
            key_points["ankle_center"] = {
                "x": (key_points["left_ankle"]["x"] + key_points["right_ankle"]["x"]) / 2,
                "y": (key_points["left_ankle"]["y"] + key_points["right_ankle"]["y"]) / 2,
                "z": (key_points["left_ankle"]["z"] + key_points["right_ankle"]["z"]) / 2
            }
        
        return key_points
    
    def _calculate_distance(self, point1: Dict, point2: Dict) -> float:
        """Calculate Euclidean distance between two 3D points"""
        return math.sqrt(
            (point1["x"] - point2["x"]) ** 2 +
            (point1["y"] - point2["y"]) ** 2 +
            (point1["z"] - point2["z"]) ** 2
        )
    
    def _calculate_total_body_height(self, key_points: Dict) -> float:
        """Calculate total body height in pixels"""
        if "nose" in key_points and "ankle_center" in key_points:
            return abs(key_points["nose"]["y"] - key_points["ankle_center"]["y"])
        return 0.0
    
    def _calculate_shoulder_scale(self, measurements: Dict) -> float:
        """Calculate shoulder width scale factor"""
        pixel_measurements = measurements.get("pixel_measurements", {})
        if "shoulder_width" in pixel_measurements:
            # Normalize against average shoulder width
            return min(max(pixel_measurements["shoulder_width"] / 0.18, 0.7), 1.3)
        return 1.0
    
    def _calculate_waist_scale(self, measurements: Dict) -> float:
        """Calculate waist width scale factor"""
        # Estimate based on shoulder and hip measurements
        shoulder_scale = self._calculate_shoulder_scale(measurements)
        hip_scale = self._calculate_hip_scale(measurements)
        return (shoulder_scale + hip_scale) / 2 * 0.8  # Waist typically smaller
    
    def _calculate_hip_scale(self, measurements: Dict) -> float:
        """Calculate hip width scale factor"""
        pixel_measurements = measurements.get("pixel_measurements", {})
        if "hip_width" in pixel_measurements:
            return min(max(pixel_measurements["hip_width"] / 0.16, 0.7), 1.3)
        return 1.0
    
    def _calculate_leg_scale(self, measurements: Dict) -> float:
        """Calculate leg length scale factor"""
        pixel_measurements = measurements.get("pixel_measurements", {})
        if "leg_length" in pixel_measurements and "torso_length" in pixel_measurements:
            leg_to_torso_ratio = pixel_measurements["leg_length"] / pixel_measurements["torso_length"]
            # Normal ratio is around 1.2-1.4
            return min(max(leg_to_torso_ratio / 1.3, 0.8), 1.2)
        return 1.0
    
    def _estimate_height(self, measurements: Dict) -> float:
        """Estimate height based on body proportions"""
        # Default to average height if no measurements available
        return 170.0  # cm
    
    def _extract_pose_parameters(self, landmarks: List[Dict]) -> Dict:
        """Extract pose parameters for 3D model"""
        # Simplified pose parameter extraction
        pose_params = {
            "spine_curve": 0.0,
            "shoulder_rotation": 0.0,
            "hip_rotation": 0.0,
            "arm_position": "neutral",
            "leg_stance": "standing"
        }
        
        # You would implement more sophisticated pose analysis here
        return pose_params
    
    def _classify_body_type(self, shape_params: Dict) -> str:
        """Classify body type for better clothing recommendations"""
        shoulder_scale = shape_params.get("shoulder_width_scale", 1.0)
        waist_scale = shape_params.get("waist_width_scale", 1.0)
        hip_scale = shape_params.get("hip_width_scale", 1.0)
        
        # Simple body type classification
        if shoulder_scale > hip_scale * 1.1:
            return "inverted_triangle"
        elif hip_scale > shoulder_scale * 1.1:
            return "pear"
        elif waist_scale < min(shoulder_scale, hip_scale) * 0.8:
            return "hourglass"
        elif abs(shoulder_scale - hip_scale) < 0.1 and waist_scale > 0.9:
            return "rectangle"
        else:
            return "oval"
    
    def _generate_fit_recommendations(self, shape_params: Dict) -> Dict:
        """Generate clothing fit recommendations based on body type"""
        body_type = self._classify_body_type(shape_params)
        
        recommendations = {
            "inverted_triangle": {
                "tops": ["fitted", "v-neck", "scoop_neck"],
                "bottoms": ["wide_leg", "flare", "bootcut"],
                "avoid": ["shoulder_pads", "horizontal_stripes_top"]
            },
            "pear": {
                "tops": ["boat_neck", "off_shoulder", "embellished"],
                "bottoms": ["straight_leg", "dark_colors", "high_waisted"],
                "avoid": ["tight_tops", "wide_hips_emphasis"]
            },
            "hourglass": {
                "tops": ["fitted", "wrap_style", "belted"],
                "bottoms": ["high_waisted", "fitted", "pencil_skirts"],
                "avoid": ["baggy_clothes", "shapeless_silhouettes"]
            },
            "rectangle": {
                "tops": ["peplum", "ruffles", "layered"],
                "bottoms": ["wide_leg", "flare", "printed"],
                "avoid": ["straight_lines", "boxy_cuts"]
            },
            "oval": {
                "tops": ["empire_waist", "v_neck", "flowing"],
                "bottoms": ["straight_leg", "bootcut", "dark_colors"],
                "avoid": ["tight_fitting", "horizontal_stripes"]
            }
        }
        
        return recommendations.get(body_type, {
            "tops": ["classic_fit"],
            "bottoms": ["regular_fit"],
            "avoid": []
        })
    
    def _generate_simplified_body_mesh(self, model_params: Dict) -> Tuple[np.ndarray, np.ndarray]:
        """
        Generate simplified 3D body mesh
        In a production app, you'd use SMPL or similar sophisticated models
        """
        shape_params = model_params["shape_parameters"]
        
        # Create a simplified humanoid mesh
        # This is a very basic representation - you'd want to use proper 3D modeling
        
        # Basic body proportions
        height_scale = shape_params.get("height_scale", 1.0)
        shoulder_scale = shape_params.get("shoulder_width_scale", 1.0)
        waist_scale = shape_params.get("waist_width_scale", 1.0)
        hip_scale = shape_params.get("hip_width_scale", 1.0)
        
        # Generate vertices for a simplified body
        vertices = []
        
        # Head (simplified as sphere points)
        head_y = 1.7 * height_scale
        for i in range(8):
            angle = i * math.pi / 4
            x = 0.1 * math.cos(angle)
            z = 0.1 * math.sin(angle)
            vertices.append([x, head_y, z])
        
        # Shoulders
        shoulder_y = 1.5 * height_scale
        shoulder_width = 0.2 * shoulder_scale
        vertices.extend([
            [-shoulder_width, shoulder_y, 0],
            [shoulder_width, shoulder_y, 0],
            [-shoulder_width, shoulder_y, -0.1],
            [shoulder_width, shoulder_y, -0.1]
        ])
        
        # Waist
        waist_y = 1.0 * height_scale
        waist_width = 0.15 * waist_scale
        vertices.extend([
            [-waist_width, waist_y, 0],
            [waist_width, waist_y, 0],
            [-waist_width, waist_y, -0.1],
            [waist_width, waist_y, -0.1]
        ])
        
        # Hips
        hip_y = 0.8 * height_scale
        hip_width = 0.18 * hip_scale
        vertices.extend([
            [-hip_width, hip_y, 0],
            [hip_width, hip_y, 0],
            [-hip_width, hip_y, -0.1],
            [hip_width, hip_y, -0.1]
        ])
        
        # Legs (simplified)
        for leg_x in [-0.1, 0.1]:
            for y in [0.4, 0.0]:  # Knee and ankle
                vertices.extend([
                    [leg_x, y * height_scale, 0],
                    [leg_x, y * height_scale, -0.1]
                ])
        
        vertices = np.array(vertices)
        
        # Generate faces (triangles) - simplified
        faces = []
        # This would be much more complex in a real implementation
        # For now, just create some basic faces
        for i in range(0, len(vertices) - 2, 3):
            faces.append([i, i + 1, i + 2])
        
        faces = np.array(faces)
        
        return vertices, faces

# Global instance
body_modeling_service = BodyModelingService()