from fastapi import APIRouter, HTTPException, Form
from fastapi.responses import JSONResponse
from typing import Optional, Dict
import uuid
import os
import aiofiles
import json
from datetime import datetime

router = APIRouter()

@router.post("/profile")
async def create_user_profile(
    name: str = Form(...),
    email: str = Form(...),
    age: Optional[int] = Form(None),
    gender: Optional[str] = Form(None),
    height: Optional[float] = Form(None),
    weight: Optional[float] = Form(None),
    style_preferences: Optional[str] = Form(None)
):
    """
    Create user profile
    """
    try:
        user_id = str(uuid.uuid4())
        
        profile_data = {
            "user_id": user_id,
            "name": name,
            "email": email,
            "age": age,
            "gender": gender,
            "height": height,
            "weight": weight,
            "style_preferences": json.loads(style_preferences) if style_preferences else [],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # Save profile
        os.makedirs("uploads/users", exist_ok=True)
        profile_path = f"uploads/users/{user_id}_profile.json"
        
        async with aiofiles.open(profile_path, 'w') as f:
            await f.write(json.dumps(profile_data, indent=2))
        
        return JSONResponse(content={
            "user_id": user_id,
            "profile": profile_data,
            "message": "Profile created successfully"
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profile creation failed: {str(e)}")

@router.get("/{user_id}/profile")
async def get_user_profile(user_id: str):
    """
    Get user profile data
    """
    try:
        profile_path = f"uploads/users/{user_id}_profile.json"
        
        if not os.path.exists(profile_path):
            raise HTTPException(status_code=404, detail="User profile not found")
        
        async with aiofiles.open(profile_path, 'r') as f:
            profile_data = json.loads(await f.read())
        
        return JSONResponse(content=profile_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve profile: {str(e)}")

@router.put("/{user_id}/profile")
async def update_user_profile(
    user_id: str,
    name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    age: Optional[int] = Form(None),
    gender: Optional[str] = Form(None),
    height: Optional[float] = Form(None),
    weight: Optional[float] = Form(None),
    style_preferences: Optional[str] = Form(None)
):
    """
    Update user profile
    """
    try:
        profile_path = f"uploads/users/{user_id}_profile.json"
        
        if not os.path.exists(profile_path):
            raise HTTPException(status_code=404, detail="User profile not found")
        
        # Read existing profile
        async with aiofiles.open(profile_path, 'r') as f:
            profile_data = json.loads(await f.read())
        
        # Update fields
        if name is not None:
            profile_data["name"] = name
        if email is not None:
            profile_data["email"] = email
        if age is not None:
            profile_data["age"] = age
        if gender is not None:
            profile_data["gender"] = gender
        if height is not None:
            profile_data["height"] = height
        if weight is not None:
            profile_data["weight"] = weight
        if style_preferences is not None:
            profile_data["style_preferences"] = json.loads(style_preferences)
        
        profile_data["updated_at"] = datetime.now().isoformat()
        
        # Save updated profile
        async with aiofiles.open(profile_path, 'w') as f:
            await f.write(json.dumps(profile_data, indent=2))
        
        return JSONResponse(content={
            "user_id": user_id,
            "profile": profile_data,
            "message": "Profile updated successfully"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profile update failed: {str(e)}")

@router.get("/{user_id}/wardrobe")
async def get_user_wardrobe(user_id: str):
    """
    Get user's virtual wardrobe (saved clothing items)
    """
    try:
        wardrobe_path = f"uploads/users/{user_id}_wardrobe.json"
        
        if not os.path.exists(wardrobe_path):
            return JSONResponse(content={"wardrobe": [], "total_items": 0})
        
        async with aiofiles.open(wardrobe_path, 'r') as f:
            wardrobe_data = json.loads(await f.read())
        
        return JSONResponse(content=wardrobe_data)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve wardrobe: {str(e)}")

@router.post("/{user_id}/wardrobe/add")
async def add_to_wardrobe(user_id: str, clothing_id: str = Form(...)):
    """
    Add clothing item to user's wardrobe
    """
    try:
        # Validate clothing exists
        clothing_path = f"uploads/clothing/{clothing_id}_processed.png"
        original_path = f"uploads/clothing/{clothing_id}_original.jpg"
        if not os.path.exists(clothing_path) and not os.path.exists(original_path):
            raise HTTPException(status_code=404, detail="Clothing item not found")
        
        wardrobe_path = f"uploads/users/{user_id}_wardrobe.json"
        
        # Load existing wardrobe or create new
        if os.path.exists(wardrobe_path):
            async with aiofiles.open(wardrobe_path, 'r') as f:
                wardrobe_data = json.loads(await f.read())
        else:
            wardrobe_data = {"wardrobe": [], "total_items": 0}
        
        # Check if item already exists
        existing_item = next((item for item in wardrobe_data["wardrobe"] if item["clothing_id"] == clothing_id), None)
        
        if not existing_item:
            # Add new item
            wardrobe_item = {
                "clothing_id": clothing_id,
                "added_at": datetime.now().isoformat(),
                "wear_count": 0,
                "favorite": False
            }
            
            wardrobe_data["wardrobe"].append(wardrobe_item)
            wardrobe_data["total_items"] = len(wardrobe_data["wardrobe"])
            wardrobe_data["updated_at"] = datetime.now().isoformat()
            
            # Save updated wardrobe
            async with aiofiles.open(wardrobe_path, 'w') as f:
                await f.write(json.dumps(wardrobe_data, indent=2))
            
            return JSONResponse(content={
                "user_id": user_id,
                "clothing_id": clothing_id,
                "wardrobe": wardrobe_data,
                "message": "Item added to wardrobe"
            })
        else:
            return JSONResponse(content={
                "user_id": user_id,
                "clothing_id": clothing_id,
                "message": "Item already in wardrobe"
            })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add to wardrobe: {str(e)}")

@router.get("/{user_id}/recommendations")
async def get_style_recommendations(user_id: str):
    """
    Get personalized style recommendations for user
    """
    try:
        # Load user profile
        profile_path = f"uploads/users/{user_id}_profile.json"
        if not os.path.exists(profile_path):
            raise HTTPException(status_code=404, detail="User profile not found")
        
        async with aiofiles.open(profile_path, 'r') as f:
            profile_data = json.loads(await f.read())
        
        # Load user's body model if available
        body_model_data = None
        models_dir = "uploads/body_models"
        if os.path.exists(models_dir):
            # Find user's most recent body model (simplified)
            model_files = [f for f in os.listdir(models_dir) if f.endswith('_model.json')]
            if model_files:
                # Use most recent model
                latest_model = max(model_files, key=lambda x: os.path.getctime(os.path.join(models_dir, x)))
                async with aiofiles.open(os.path.join(models_dir, latest_model), 'r') as f:
                    body_model_data = json.loads(await f.read())
        
        # Generate recommendations
        recommendations = await _generate_personalized_recommendations(profile_data, body_model_data)
        
        return JSONResponse(content={
            "user_id": user_id,
            "recommendations": recommendations,
            "generated_at": datetime.now().isoformat()
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")

async def _generate_personalized_recommendations(profile_data: Dict, body_model_data: Optional[Dict]) -> Dict:
    """
    Generate personalized style recommendations
    """
    recommendations = {
        "style_categories": [],
        "color_palette": [],
        "clothing_suggestions": [],
        "fit_tips": [],
        "seasonal_recommendations": []
    }
    
    # Age-based recommendations
    age = profile_data.get("age")
    if age:
        if age < 25:
            recommendations["style_categories"].extend(["trendy", "casual", "streetwear"])
        elif age < 40:
            recommendations["style_categories"].extend(["professional", "smart-casual", "contemporary"])
        else:
            recommendations["style_categories"].extend(["classic", "elegant", "sophisticated"])
    
    # Gender-based recommendations
    gender = profile_data.get("gender")
    if gender == "female":
        recommendations["clothing_suggestions"].extend([
            "Wrap dresses for flattering silhouette",
            "High-waisted bottoms for elongating legs",
            "Statement accessories for personality"
        ])
    elif gender == "male":
        recommendations["clothing_suggestions"].extend([
            "Well-fitted blazers for professional look",
            "Quality denim for versatile styling",
            "Classic white shirts as wardrobe staples"
        ])
    
    # Body type recommendations if available
    if body_model_data:
        body_type = body_model_data.get("model_params", {}).get("body_type")
        fit_recommendations = body_model_data.get("model_params", {}).get("fit_recommendations", {})
        
        if body_type:
            recommendations["fit_tips"].extend([
                f"Your {body_type} body type suits {', '.join(fit_recommendations.get('tops', []))} tops",
                f"Choose {', '.join(fit_recommendations.get('bottoms', []))} for bottoms",
                f"Avoid {', '.join(fit_recommendations.get('avoid', []))}"
            ])
    
    # Style preference recommendations
    style_prefs = profile_data.get("style_preferences", [])
    if "minimalist" in style_prefs:
        recommendations["color_palette"].extend(["black", "white", "gray", "navy", "beige"])
    if "colorful" in style_prefs:
        recommendations["color_palette"].extend(["red", "blue", "green", "yellow", "purple"])
    if "professional" in style_prefs:
        recommendations["clothing_suggestions"].append("Invest in quality blazers and dress shirts")
    
    return recommendations