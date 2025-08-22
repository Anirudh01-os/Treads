from fastapi import APIRouter, HTTPException, Form
from fastapi.responses import JSONResponse
from typing import Optional, Dict, List
import uuid
import os
import aiofiles
import json
from datetime import datetime

from services.body_modeling import body_modeling_service

router = APIRouter()

@router.post("/create")
async def create_tryon_session(
    body_model_id: str = Form(...),
    clothing_ids: List[str] = Form(...),
    pose_type: str = Form("standing"),
    lighting: str = Form("natural")
):
    """
    Create a new virtual try-on session
    """
    try:
        # Validate body model exists
        body_model_path = f"uploads/body_models/{body_model_id}_model.json"
        if not os.path.exists(body_model_path):
            raise HTTPException(status_code=404, detail="Body model not found")
        
        # Validate clothing items exist
        for clothing_id in clothing_ids:
            clothing_path = f"uploads/clothing/{clothing_id}_processed.png"
            original_path = f"uploads/clothing/{clothing_id}_original.jpg"
            if not os.path.exists(clothing_path) and not os.path.exists(original_path):
                raise HTTPException(status_code=404, detail=f"Clothing item {clothing_id} not found")
        
        # Generate session ID
        session_id = str(uuid.uuid4())
        
        # Load body model
        async with aiofiles.open(body_model_path, 'r') as f:
            body_model = json.loads(await f.read())
        
        # Create try-on configuration
        tryon_config = {
            "session_id": session_id,
            "body_model_id": body_model_id,
            "clothing_ids": clothing_ids,
            "pose_type": pose_type,
            "lighting": lighting,
            "created_at": datetime.now().isoformat(),
            "status": "initialized"
        }
        
        # Generate virtual try-on
        tryon_result = await _generate_virtual_tryon(body_model, clothing_ids, tryon_config)
        
        # Save session data
        os.makedirs("uploads/tryons", exist_ok=True)
        session_path = f"uploads/tryons/{session_id}_session.json"
        
        session_data = {
            **tryon_config,
            "tryon_result": tryon_result,
            "body_model_summary": {
                "body_type": body_model.get("model_params", {}).get("body_type"),
                "measurements": body_model.get("measurements", {}).get("real_measurements", {})
            }
        }
        
        async with aiofiles.open(session_path, 'w') as f:
            await f.write(json.dumps(session_data, indent=2))
        
        return JSONResponse(content={
            "session_id": session_id,
            "tryon_result": tryon_result,
            "fit_analysis": await _analyze_clothing_fit(body_model, clothing_ids),
            "recommendations": await _get_styling_recommendations(body_model, clothing_ids)
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Try-on creation failed: {str(e)}")

@router.get("/{session_id}")
async def get_tryon_session(session_id: str):
    """
    Get existing try-on session data
    """
    try:
        session_path = f"uploads/tryons/{session_id}_session.json"
        
        if not os.path.exists(session_path):
            raise HTTPException(status_code=404, detail="Try-on session not found")
        
        async with aiofiles.open(session_path, 'r') as f:
            session_data = json.loads(await f.read())
        
        return JSONResponse(content=session_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve session: {str(e)}")

@router.post("/{session_id}/update-pose")
async def update_tryon_pose(
    session_id: str,
    pose_type: str = Form(...),
    custom_pose_data: Optional[str] = Form(None)
):
    """
    Update the pose for an existing try-on session
    """
    try:
        session_path = f"uploads/tryons/{session_id}_session.json"
        
        if not os.path.exists(session_path):
            raise HTTPException(status_code=404, detail="Try-on session not found")
        
        # Read session data
        async with aiofiles.open(session_path, 'r') as f:
            session_data = json.loads(await f.read())
        
        # Update pose
        session_data["pose_type"] = pose_type
        if custom_pose_data:
            session_data["custom_pose_data"] = json.loads(custom_pose_data)
        
        # Regenerate try-on with new pose
        body_model_id = session_data["body_model_id"]
        clothing_ids = session_data["clothing_ids"]
        
        # Load body model
        body_model_path = f"uploads/body_models/{body_model_id}_model.json"
        async with aiofiles.open(body_model_path, 'r') as f:
            body_model = json.loads(await f.read())
        
        # Update body model pose if custom pose provided
        if custom_pose_data:
            body_model["model_params"]["pose_parameters"] = json.loads(custom_pose_data)
        
        # Regenerate try-on
        updated_tryon = await _generate_virtual_tryon(body_model, clothing_ids, session_data)
        session_data["tryon_result"] = updated_tryon
        session_data["updated_at"] = datetime.now().isoformat()
        
        # Save updated session
        async with aiofiles.open(session_path, 'w') as f:
            await f.write(json.dumps(session_data, indent=2))
        
        return JSONResponse(content={
            "session_id": session_id,
            "updated_tryon": updated_tryon,
            "updated_at": session_data["updated_at"]
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pose update failed: {str(e)}")

@router.post("/{session_id}/add-clothing")
async def add_clothing_to_tryon(session_id: str, clothing_id: str = Form(...)):
    """
    Add additional clothing item to existing try-on session
    """
    try:
        session_path = f"uploads/tryons/{session_id}_session.json"
        
        if not os.path.exists(session_path):
            raise HTTPException(status_code=404, detail="Try-on session not found")
        
        # Validate clothing exists
        clothing_path = f"uploads/clothing/{clothing_id}_processed.png"
        original_path = f"uploads/clothing/{clothing_id}_original.jpg"
        if not os.path.exists(clothing_path) and not os.path.exists(original_path):
            raise HTTPException(status_code=404, detail="Clothing item not found")
        
        # Read session data
        async with aiofiles.open(session_path, 'r') as f:
            session_data = json.loads(await f.read())
        
        # Add clothing to session
        if clothing_id not in session_data["clothing_ids"]:
            session_data["clothing_ids"].append(clothing_id)
            
            # Regenerate try-on
            body_model_id = session_data["body_model_id"]
            body_model_path = f"uploads/body_models/{body_model_id}_model.json"
            
            async with aiofiles.open(body_model_path, 'r') as f:
                body_model = json.loads(await f.read())
            
            updated_tryon = await _generate_virtual_tryon(
                body_model, session_data["clothing_ids"], session_data
            )
            session_data["tryon_result"] = updated_tryon
            session_data["updated_at"] = datetime.now().isoformat()
            
            # Save updated session
            async with aiofiles.open(session_path, 'w') as f:
                await f.write(json.dumps(session_data, indent=2))
        
        return JSONResponse(content={
            "session_id": session_id,
            "clothing_ids": session_data["clothing_ids"],
            "updated_tryon": session_data["tryon_result"]
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add clothing: {str(e)}")

@router.get("/{session_id}/ar-data")
async def get_ar_tryon_data(session_id: str):
    """
    Get AR-optimized data for real-time try-on visualization
    """
    try:
        session_path = f"uploads/tryons/{session_id}_session.json"
        
        if not os.path.exists(session_path):
            raise HTTPException(status_code=404, detail="Try-on session not found")
        
        async with aiofiles.open(session_path, 'r') as f:
            session_data = json.loads(await f.read())
        
        # Prepare AR-optimized data
        ar_data = {
            "session_id": session_id,
            "body_mesh": session_data["tryon_result"]["body_mesh"],
            "clothing_meshes": session_data["tryon_result"]["clothing_meshes"],
            "anchor_points": session_data["tryon_result"]["anchor_points"],
            "tracking_data": {
                "pose_landmarks": session_data["tryon_result"]["pose_landmarks"],
                "body_bounds": session_data["tryon_result"]["body_bounds"]
            },
            "render_settings": {
                "lighting": session_data["lighting"],
                "pose_type": session_data["pose_type"],
                "scale_factor": session_data["tryon_result"].get("scale_factor", 1.0)
            }
        }
        
        return JSONResponse(content=ar_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get AR data: {str(e)}")

async def _generate_virtual_tryon(body_model: Dict, clothing_ids: List[str], config: Dict) -> Dict:
    """
    Generate virtual try-on result
    """
    try:
        # Extract body mesh and parameters
        body_mesh = body_model.get("mesh_data", {})
        body_params = body_model.get("model_params", {})
        
        # Load and process clothing items
        clothing_meshes = []
        for clothing_id in clothing_ids:
            clothing_mesh = await _process_clothing_for_tryon(clothing_id, body_params)
            clothing_meshes.append(clothing_mesh)
        
        # Generate anchor points for clothing attachment
        anchor_points = _generate_anchor_points(body_model, clothing_meshes)
        
        # Calculate fit adjustments
        fit_adjustments = _calculate_fit_adjustments(body_params, clothing_meshes)
        
        return {
            "body_mesh": body_mesh,
            "clothing_meshes": clothing_meshes,
            "anchor_points": anchor_points,
            "fit_adjustments": fit_adjustments,
            "pose_landmarks": body_model.get("landmarks", {}),
            "body_bounds": _calculate_body_bounds(body_mesh),
            "scale_factor": body_params.get("shape_parameters", {}).get("height_scale", 1.0),
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise Exception(f"Virtual try-on generation failed: {str(e)}")

async def _process_clothing_for_tryon(clothing_id: str, body_params: Dict) -> Dict:
    """
    Process clothing item for virtual try-on
    """
    # Load clothing analysis data (would be stored separately in real app)
    clothing_path = f"uploads/clothing/{clothing_id}_processed.png"
    if not os.path.exists(clothing_path):
        clothing_path = f"uploads/clothing/{clothing_id}_original.jpg"
    
    # Create simplified clothing mesh based on clothing type and body parameters
    # This is a placeholder - in a real app you'd use sophisticated 3D clothing modeling
    
    return {
        "clothing_id": clothing_id,
        "clothing_path": clothing_path,
        "mesh_vertices": [],  # Would contain actual 3D mesh
        "mesh_faces": [],
        "texture_path": clothing_path,
        "fit_parameters": {
            "scale_x": body_params.get("shape_parameters", {}).get("shoulder_width_scale", 1.0),
            "scale_y": body_params.get("shape_parameters", {}).get("height_scale", 1.0),
            "scale_z": 1.0
        }
    }

def _generate_anchor_points(body_model: Dict, clothing_meshes: List[Dict]) -> Dict:
    """
    Generate anchor points for attaching clothing to body model
    """
    landmarks = body_model.get("landmarks", {})
    key_points = landmarks.get("key_points", {})
    
    anchor_points = {
        "shoulders": {
            "left": key_points.get("left_shoulder", {"x": -0.2, "y": 1.5, "z": 0}),
            "right": key_points.get("right_shoulder", {"x": 0.2, "y": 1.5, "z": 0})
        },
        "waist": {
            "center": {"x": 0, "y": 1.0, "z": 0}
        },
        "hips": {
            "left": key_points.get("left_hip", {"x": -0.15, "y": 0.8, "z": 0}),
            "right": key_points.get("right_hip", {"x": 0.15, "y": 0.8, "z": 0})
        },
        "chest": {
            "center": {"x": 0, "y": 1.3, "z": 0}
        }
    }
    
    return anchor_points

def _calculate_fit_adjustments(body_params: Dict, clothing_meshes: List[Dict]) -> Dict:
    """
    Calculate how clothing should be adjusted to fit the body model
    """
    shape_params = body_params.get("shape_parameters", {})
    
    adjustments = {
        "global_scale": shape_params.get("height_scale", 1.0),
        "shoulder_adjustment": shape_params.get("shoulder_width_scale", 1.0),
        "waist_adjustment": shape_params.get("waist_width_scale", 1.0),
        "hip_adjustment": shape_params.get("hip_width_scale", 1.0),
        "length_adjustment": shape_params.get("leg_length_scale", 1.0)
    }
    
    # Per-clothing adjustments
    clothing_adjustments = {}
    for clothing_mesh in clothing_meshes:
        clothing_id = clothing_mesh["clothing_id"]
        clothing_adjustments[clothing_id] = {
            "position_offset": {"x": 0, "y": 0, "z": 0},
            "rotation": {"x": 0, "y": 0, "z": 0},
            "scale_factors": clothing_mesh["fit_parameters"]
        }
    
    adjustments["clothing_specific"] = clothing_adjustments
    return adjustments

def _calculate_body_bounds(body_mesh: Dict) -> Dict:
    """
    Calculate bounding box for body mesh
    """
    vertices = body_mesh.get("vertices", [])
    
    if not vertices:
        return {"min": {"x": -1, "y": 0, "z": -1}, "max": {"x": 1, "y": 2, "z": 1}}
    
    # Calculate actual bounds
    import numpy as np
    vertices_array = np.array(vertices)
    
    min_bounds = np.min(vertices_array, axis=0)
    max_bounds = np.max(vertices_array, axis=0)
    
    return {
        "min": {"x": float(min_bounds[0]), "y": float(min_bounds[1]), "z": float(min_bounds[2])},
        "max": {"x": float(max_bounds[0]), "y": float(max_bounds[1]), "z": float(max_bounds[2])}
    }

async def _analyze_clothing_fit(body_model: Dict, clothing_ids: List[str]) -> Dict:
    """
    Analyze how well clothing items fit the body model
    """
    body_type = body_model.get("model_params", {}).get("body_type", "unknown")
    fit_recommendations = body_model.get("model_params", {}).get("fit_recommendations", {})
    
    # Analyze each clothing item
    fit_analysis = {}
    
    for clothing_id in clothing_ids:
        # Load clothing analysis (simplified)
        clothing_analysis_path = f"uploads/clothing/{clothing_id}_analysis.json"
        
        # Default analysis if file doesn't exist
        clothing_analysis = {
            "clothing_type": {"type": "unknown"},
            "colors": {"dominant_color": "unknown"},
            "material": {"material": "cotton"}
        }
        
        if os.path.exists(clothing_analysis_path):
            try:
                async with aiofiles.open(clothing_analysis_path, 'r') as f:
                    clothing_analysis = json.loads(await f.read())
            except Exception:
                pass
        
        # Analyze fit compatibility
        clothing_type = clothing_analysis.get("clothing_type", {}).get("type", "unknown")
        
        fit_score = _calculate_fit_score(body_type, clothing_type, fit_recommendations)
        
        fit_analysis[clothing_id] = {
            "clothing_type": clothing_type,
            "fit_score": fit_score,
            "recommendations": _get_fit_recommendations(body_type, clothing_type),
            "size_suggestion": _suggest_size(body_model, clothing_analysis)
        }
    
    return fit_analysis

def _calculate_fit_score(body_type: str, clothing_type: str, fit_recommendations: Dict) -> float:
    """
    Calculate fit score between body type and clothing type
    """
    # Simplified fit scoring
    recommended_tops = fit_recommendations.get("tops", [])
    recommended_bottoms = fit_recommendations.get("bottoms", [])
    avoid_items = fit_recommendations.get("avoid", [])
    
    score = 0.5  # Base score
    
    # Check if clothing type is recommended
    if clothing_type in recommended_tops or clothing_type in recommended_bottoms:
        score += 0.3
    
    # Check if clothing type should be avoided
    if any(avoid_item in clothing_type for avoid_item in avoid_items):
        score -= 0.2
    
    return max(0.0, min(1.0, score))

def _get_fit_recommendations(body_type: str, clothing_type: str) -> List[str]:
    """
    Get specific fit recommendations for body type and clothing combination
    """
    recommendations = []
    
    # General recommendations based on body type
    body_type_recommendations = {
        "pear": ["Emphasize upper body", "Choose fitted tops", "Avoid tight bottoms"],
        "inverted_triangle": ["Balance with wider bottoms", "Avoid shoulder emphasis"],
        "hourglass": ["Emphasize waist", "Choose fitted silhouettes"],
        "rectangle": ["Create curves", "Add volume and texture"],
        "oval": ["Choose empire waists", "Avoid tight fitting clothes"]
    }
    
    recommendations.extend(body_type_recommendations.get(body_type, ["Choose classic fit"]))
    
    return recommendations

def _suggest_size(body_model: Dict, clothing_analysis: Dict) -> str:
    """
    Suggest clothing size based on body measurements
    """
    measurements = body_model.get("measurements", {}).get("real_measurements", {})
    
    # Simplified size suggestion logic
    shoulder_width = measurements.get("shoulder_width", 40)  # cm
    
    if shoulder_width < 35:
        return "XS"
    elif shoulder_width < 40:
        return "S"
    elif shoulder_width < 45:
        return "M"
    elif shoulder_width < 50:
        return "L"
    else:
        return "XL"

async def _get_styling_recommendations(body_model: Dict, clothing_ids: List[str]) -> Dict:
    """
    Get AI-powered styling recommendations
    """
    body_type = body_model.get("model_params", {}).get("body_type", "unknown")
    
    recommendations = {
        "outfit_rating": 7.5,  # Out of 10
        "style_tips": [
            "Consider adding a belt to define your waist",
            "This color complements your body type well",
            "Try layering for more visual interest"
        ],
        "alternative_suggestions": [
            "Try a slightly looser fit for comfort",
            "Consider similar items in different colors",
            "Add accessories to complete the look"
        ],
        "body_type_specific": body_model.get("model_params", {}).get("fit_recommendations", {}),
        "confidence_score": 0.8
    }
    
    return recommendations