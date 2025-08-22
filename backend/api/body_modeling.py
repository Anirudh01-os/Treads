from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from typing import Optional
import uuid
import os
import aiofiles
from datetime import datetime

from services.body_modeling import body_modeling_service

router = APIRouter()

@router.post("/upload")
async def upload_body_image(
    file: UploadFile = File(...),
    height: Optional[float] = Form(None),
    weight: Optional[float] = Form(None),
    age: Optional[int] = Form(None),
    gender: Optional[str] = Form(None)
):
    """
    Upload user body image and create 3D model
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read file data
        file_data = await file.read()
        
        # Generate unique ID
        model_id = str(uuid.uuid4())
        original_filename = f"{model_id}_body_original.{file.filename.split('.')[-1]}"
        
        # Save original file
        os.makedirs("uploads/body_models", exist_ok=True)
        original_path = f"uploads/body_models/{original_filename}"
        
        async with aiofiles.open(original_path, 'wb') as f:
            await f.write(file_data)
        
        # Create 3D body model
        try:
            body_model = await body_modeling_service.create_body_model(
                file_data, user_height=height
            )
            
            # Save model data
            model_filename = f"{model_id}_model.json"
            model_path = f"uploads/body_models/{model_filename}"
            
            async with aiofiles.open(model_path, 'w') as f:
                import json
                await f.write(json.dumps(body_model, indent=2))
            
            result = {
                "model_id": model_id,
                "original_filename": file.filename,
                "original_path": original_path,
                "model_path": model_path,
                "user_data": {
                    "height": height,
                    "weight": weight,
                    "age": age,
                    "gender": gender
                },
                "body_model": body_model,
                "created_at": datetime.now().isoformat(),
                "status": "success"
            }
            
        except Exception as e:
            result = {
                "model_id": model_id,
                "original_path": original_path,
                "modeling_error": str(e),
                "status": "failed"
            }
        
        return JSONResponse(content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Body model creation failed: {str(e)}")

@router.get("/{model_id}")
async def get_body_model(model_id: str):
    """
    Get existing body model data
    """
    try:
        model_path = f"uploads/body_models/{model_id}_model.json"
        
        if not os.path.exists(model_path):
            raise HTTPException(status_code=404, detail="Body model not found")
        
        # Read model data
        async with aiofiles.open(model_path, 'r') as f:
            import json
            model_data = json.loads(await f.read())
        
        return JSONResponse(content={
            "model_id": model_id,
            "body_model": model_data,
            "retrieved_at": datetime.now().isoformat()
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve model: {str(e)}")

@router.put("/{model_id}/measurements")
async def update_body_measurements(
    model_id: str,
    height: Optional[float] = Form(None),
    weight: Optional[float] = Form(None),
    chest: Optional[float] = Form(None),
    waist: Optional[float] = Form(None),
    hips: Optional[float] = Form(None)
):
    """
    Update body measurements and regenerate model
    """
    try:
        model_path = f"uploads/body_models/{model_id}_model.json"
        
        if not os.path.exists(model_path):
            raise HTTPException(status_code=404, detail="Body model not found")
        
        # Read existing model
        async with aiofiles.open(model_path, 'r') as f:
            import json
            model_data = json.loads(await f.read())
        
        # Update measurements
        measurements = model_data.get("measurements", {})
        
        if height:
            measurements["estimated_height"] = height
        if weight:
            measurements["weight"] = weight
        if chest:
            measurements["chest"] = chest
        if waist:
            measurements["waist"] = waist
        if hips:
            measurements["hips"] = hips
        
        # Regenerate model parameters with new measurements
        if "landmarks" in model_data:
            updated_params = await body_modeling_service.generate_3d_model_params(
                model_data["landmarks"], measurements
            )
            model_data["model_params"] = updated_params
            
            # Regenerate mesh
            updated_mesh = await body_modeling_service.create_body_mesh(updated_params)
            model_data["mesh_data"] = updated_mesh
        
        model_data["measurements"] = measurements
        model_data["updated_at"] = datetime.now().isoformat()
        
        # Save updated model
        async with aiofiles.open(model_path, 'w') as f:
            await f.write(json.dumps(model_data, indent=2))
        
        return JSONResponse(content={
            "model_id": model_id,
            "updated_measurements": measurements,
            "body_model": model_data,
            "updated_at": model_data["updated_at"]
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update measurements: {str(e)}")

@router.get("/list")
async def list_body_models():
    """
    List all created body models
    """
    try:
        models_dir = "uploads/body_models"
        if not os.path.exists(models_dir):
            return JSONResponse(content={"models": []})
        
        models = []
        files = os.listdir(models_dir)
        
        # Find model files
        model_files = [f for f in files if f.endswith('_model.json')]
        
        for model_file in model_files:
            model_id = model_file.replace('_model.json', '')
            model_path = os.path.join(models_dir, model_file)
            
            # Get basic info
            stat = os.stat(model_path)
            
            try:
                # Try to read model data for additional info
                async with aiofiles.open(model_path, 'r') as f:
                    import json
                    model_data = json.loads(await f.read())
                
                body_type = model_data.get("model_params", {}).get("body_type", "unknown")
                height = model_data.get("measurements", {}).get("estimated_height", None)
                
            except Exception:
                body_type = "unknown"
                height = None
            
            models.append({
                "model_id": model_id,
                "body_type": body_type,
                "estimated_height": height,
                "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "file_size": stat.st_size
            })
        
        # Sort by creation time
        models.sort(key=lambda x: x["created_at"], reverse=True)
        
        return JSONResponse(content={"models": models})
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list models: {str(e)}")

@router.delete("/{model_id}")
async def delete_body_model(model_id: str):
    """
    Delete body model and associated files
    """
    try:
        models_dir = "uploads/body_models"
        deleted_files = []
        
        # Find and delete all files with this ID
        if os.path.exists(models_dir):
            for filename in os.listdir(models_dir):
                if filename.startswith(model_id):
                    file_path = os.path.join(models_dir, filename)
                    os.remove(file_path)
                    deleted_files.append(filename)
        
        if not deleted_files:
            raise HTTPException(status_code=404, detail="Body model not found")
        
        return JSONResponse(content={
            "model_id": model_id,
            "deleted_files": deleted_files,
            "deleted_at": datetime.now().isoformat()
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")

@router.post("/{model_id}/export")
async def export_body_model(model_id: str, format: str = "obj"):
    """
    Export body model in specified format (obj, ply, etc.)
    """
    try:
        model_path = f"uploads/body_models/{model_id}_model.json"
        
        if not os.path.exists(model_path):
            raise HTTPException(status_code=404, detail="Body model not found")
        
        # Read model data
        async with aiofiles.open(model_path, 'r') as f:
            import json
            model_data = json.loads(await f.read())
        
        mesh_data = model_data.get("mesh_data")
        if not mesh_data:
            raise HTTPException(status_code=400, detail="No mesh data available")
        
        # Export based on format
        if format.lower() == "obj":
            obj_content = await _export_to_obj(mesh_data)
            export_filename = f"{model_id}_body.obj"
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {format}")
        
        # Save export file
        export_path = f"uploads/body_models/{export_filename}"
        async with aiofiles.open(export_path, 'w') as f:
            await f.write(obj_content)
        
        return JSONResponse(content={
            "model_id": model_id,
            "export_path": export_path,
            "format": format,
            "exported_at": datetime.now().isoformat()
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

async def _export_to_obj(mesh_data: dict) -> str:
    """Convert mesh data to OBJ format"""
    vertices = mesh_data["vertices"]
    faces = mesh_data["faces"]
    
    obj_lines = ["# Treads Body Model Export", ""]
    
    # Write vertices
    for vertex in vertices:
        obj_lines.append(f"v {vertex[0]:.6f} {vertex[1]:.6f} {vertex[2]:.6f}")
    
    obj_lines.append("")
    
    # Write faces (OBJ uses 1-based indexing)
    for face in faces:
        obj_lines.append(f"f {face[0]+1} {face[1]+1} {face[2]+1}")
    
    return "\n".join(obj_lines)