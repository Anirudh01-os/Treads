import io
import numpy as np
from PIL import Image
from rembg import remove, new_session
import cv2
from typing import Optional, Tuple
import base64

class BackgroundRemovalService:
    def __init__(self):
        # Initialize different models for different use cases
        self.general_session = new_session('u2net')  # General purpose
        self.clothing_session = new_session('u2netp')  # Better for products
        self.person_session = new_session('silueta')  # Better for people
    
    async def remove_background(
        self, 
        image_data: bytes, 
        model_type: str = "clothing"
    ) -> Tuple[bytes, dict]:
        """
        Remove background from image
        
        Args:
            image_data: Raw image bytes
            model_type: "clothing", "person", or "general"
            
        Returns:
            Tuple of (processed_image_bytes, metadata)
        """
        try:
            # Select appropriate session
            session = self._get_session(model_type)
            
            # Remove background
            output_image = remove(image_data, session=session)
            
            # Convert to PIL for processing
            pil_image = Image.open(io.BytesIO(output_image))
            
            # Get image metadata
            metadata = self._extract_metadata(pil_image)
            
            # Convert back to bytes
            img_byte_arr = io.BytesIO()
            pil_image.save(img_byte_arr, format='PNG')
            processed_bytes = img_byte_arr.getvalue()
            
            return processed_bytes, metadata
            
        except Exception as e:
            raise Exception(f"Background removal failed: {str(e)}")
    
    async def remove_background_with_mask(
        self, 
        image_data: bytes, 
        model_type: str = "clothing"
    ) -> Tuple[bytes, bytes, dict]:
        """
        Remove background and return both result and mask
        
        Returns:
            Tuple of (processed_image_bytes, mask_bytes, metadata)
        """
        try:
            session = self._get_session(model_type)
            
            # Get original image
            original_image = Image.open(io.BytesIO(image_data))
            
            # Remove background
            output_image = remove(image_data, session=session)
            result_image = Image.open(io.BytesIO(output_image))
            
            # Create mask from alpha channel
            if result_image.mode == 'RGBA':
                mask = result_image.split()[-1]  # Alpha channel
            else:
                # Create mask from non-transparent pixels
                mask = self._create_mask_from_image(result_image)
            
            # Convert to bytes
            result_bytes = self._image_to_bytes(result_image, 'PNG')
            mask_bytes = self._image_to_bytes(mask, 'PNG')
            
            metadata = self._extract_metadata(result_image)
            metadata['has_mask'] = True
            
            return result_bytes, mask_bytes, metadata
            
        except Exception as e:
            raise Exception(f"Background removal with mask failed: {str(e)}")
    
    async def refine_edges(self, image_data: bytes) -> bytes:
        """
        Refine edges of background-removed image for better quality
        """
        try:
            # Convert to OpenCV format
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
            
            if img.shape[2] == 4:  # RGBA
                # Extract alpha channel
                alpha = img[:, :, 3]
                
                # Apply morphological operations to refine edges
                kernel = np.ones((3, 3), np.uint8)
                alpha = cv2.morphologyEx(alpha, cv2.MORPH_CLOSE, kernel)
                alpha = cv2.GaussianBlur(alpha, (3, 3), 0)
                
                # Update alpha channel
                img[:, :, 3] = alpha
            
            # Convert back to bytes
            _, buffer = cv2.imencode('.png', img)
            return buffer.tobytes()
            
        except Exception as e:
            raise Exception(f"Edge refinement failed: {str(e)}")
    
    def _get_session(self, model_type: str):
        """Get appropriate rembg session based on model type"""
        sessions = {
            "clothing": self.clothing_session,
            "person": self.person_session,
            "general": self.general_session
        }
        return sessions.get(model_type, self.general_session)
    
    def _extract_metadata(self, image: Image.Image) -> dict:
        """Extract metadata from processed image"""
        return {
            "width": image.width,
            "height": image.height,
            "mode": image.mode,
            "format": image.format,
            "has_transparency": image.mode in ('RGBA', 'LA') or 'transparency' in image.info
        }
    
    def _create_mask_from_image(self, image: Image.Image) -> Image.Image:
        """Create binary mask from image"""
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to grayscale
        gray = image.convert('L')
        
        # Create binary mask (non-white pixels)
        mask_array = np.array(gray)
        mask_array = (mask_array < 250).astype(np.uint8) * 255
        
        return Image.fromarray(mask_array, mode='L')
    
    def _image_to_bytes(self, image: Image.Image, format: str = 'PNG') -> bytes:
        """Convert PIL Image to bytes"""
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format=format)
        return img_byte_arr.getvalue()

# Global instance
background_removal_service = BackgroundRemovalService()