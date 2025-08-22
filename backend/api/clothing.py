from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from typing import List, Optional
import uuid
import os
import aiofiles
from datetime import datetime

from services.background_removal import background_removal_service
from services.clothing_detection import clothing_detection_service

router = APIRouter()

@router.post("/upload")
async def upload_clothing_image(
    file: UploadFile = File(...),
    remove_background: bool = Form(True),
    analyze_clothing: bool = Form(True)
):
    """
    Upload clothing image with optional background removal and analysis
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read file data
        file_data = await file.read()
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        original_filename = f"{file_id}_original.{file.filename.split('.')[-1]}"
        
        # Save original file
        os.makedirs("uploads/clothing", exist_ok=True)
        original_path = f"uploads/clothing/{original_filename}"
        
        async with aiofiles.open(original_path, 'wb') as f:
            await f.write(file_data)
        
        result = {
            "file_id": file_id,
            "original_filename": file.filename,
            "original_path": original_path,
            "upload_time": datetime.now().isoformat()
        }
        
        # Remove background if requested
        if remove_background:
            try:
                processed_data, bg_metadata = await background_removal_service.remove_background(
                    file_data, model_type="clothing"
                )
                
                # Save processed image
                processed_filename = f"{file_id}_processed.png"
                processed_path = f"uploads/clothing/{processed_filename}"
                
                async with aiofiles.open(processed_path, 'wb') as f:
                    await f.write(processed_data)
                
                result.update({
                    "processed_path": processed_path,
                    "background_removed": True,
                    "background_removal_metadata": bg_metadata
                })
                
                # Use processed image for analysis
                analysis_data = processed_data
                
            except Exception as e:
                result.update({
                    "background_removed": False,
                    "background_removal_error": str(e)
                })
                analysis_data = file_data
        else:
            analysis_data = file_data
        
        # Analyze clothing if requested
        if analyze_clothing:
            try:
                analysis_result = await clothing_detection_service.analyze_clothing(analysis_data)
                result.update({
                    "analysis": analysis_result,
                    "analyzed": True
                })
            except Exception as e:
                result.update({
                    "analyzed": False,
                    "analysis_error": str(e)
                })
        
        return JSONResponse(content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/analyze/{file_id}")
async def analyze_existing_clothing(file_id: str):
    """
    Analyze previously uploaded clothing image
    """
    try:
        # Find the file
        processed_path = f"uploads/clothing/{file_id}_processed.png"
        original_path = f"uploads/clothing/{file_id}_original.jpg"
        
        file_path = processed_path if os.path.exists(processed_path) else original_path
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Clothing image not found")
        
        # Read file
        async with aiofiles.open(file_path, 'rb') as f:
            file_data = await f.read()
        
        # Analyze
        analysis_result = await clothing_detection_service.analyze_clothing(file_data)
        
        return JSONResponse(content={
            "file_id": file_id,
            "analysis": analysis_result,
            "analyzed_at": datetime.now().isoformat()
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/remove-background/{file_id}")
async def remove_background_from_existing(file_id: str, model_type: str = "clothing"):
    """
    Remove background from existing clothing image
    """
    try:
        # Find original file
        original_path = f"uploads/clothing/{file_id}_original.jpg"
        
        if not os.path.exists(original_path):
            raise HTTPException(status_code=404, detail="Original image not found")
        
        # Read file
        async with aiofiles.open(original_path, 'rb') as f:
            file_data = await f.read()
        
        # Remove background
        processed_data, metadata = await background_removal_service.remove_background(
            file_data, model_type=model_type
        )
        
        # Save processed image
        processed_filename = f"{file_id}_processed.png"
        processed_path = f"uploads/clothing/{processed_filename}"
        
        async with aiofiles.open(processed_path, 'wb') as f:
            await f.write(processed_data)
        
        return JSONResponse(content={
            "file_id": file_id,
            "processed_path": processed_path,
            "metadata": metadata,
            "processed_at": datetime.now().isoformat()
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Background removal failed: {str(e)}")

@router.get("/list")
async def list_clothing_items():
    """
    List all uploaded clothing items
    """
    try:
        clothing_dir = "uploads/clothing"
        if not os.path.exists(clothing_dir):
            return JSONResponse(content={"items": []})
        
        items = []
        files = os.listdir(clothing_dir)
        
        # Group files by ID
        file_groups = {}
        for filename in files:
            if '_' in filename:
                file_id = filename.split('_')[0]
                if file_id not in file_groups:
                    file_groups[file_id] = {}
                
                if 'original' in filename:
                    file_groups[file_id]['original'] = filename
                elif 'processed' in filename:
                    file_groups[file_id]['processed'] = filename
        
        for file_id, files in file_groups.items():
            item = {
                "file_id": file_id,
                "has_original": 'original' in files,
                "has_processed": 'processed' in files,
                "created_at": datetime.fromtimestamp(
                    os.path.getctime(f"{clothing_dir}/{files.get('original', list(files.values())[0])}")
                ).isoformat()
            }
            items.append(item)
        
        # Sort by creation time
        items.sort(key=lambda x: x["created_at"], reverse=True)
        
        return JSONResponse(content={"items": items})
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list items: {str(e)}")

@router.delete("/{file_id}")
async def delete_clothing_item(file_id: str):
    """
    Delete clothing item and associated files
    """
    try:
        clothing_dir = "uploads/clothing"
        deleted_files = []
        
        # Find and delete all files with this ID
        if os.path.exists(clothing_dir):
            for filename in os.listdir(clothing_dir):
                if filename.startswith(file_id):
                    file_path = os.path.join(clothing_dir, filename)
                    os.remove(file_path)
                    deleted_files.append(filename)
        
        if not deleted_files:
            raise HTTPException(status_code=404, detail="Clothing item not found")
        
        return JSONResponse(content={
            "file_id": file_id,
            "deleted_files": deleted_files,
            "deleted_at": datetime.now().isoformat()
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")

@router.get("/{file_id}/details")
async def get_clothing_details(file_id: str):
    """
    Get detailed information about a clothing item
    """
    try:
        clothing_dir = "uploads/clothing"
        
        # Check if files exist
        original_path = f"{clothing_dir}/{file_id}_original.jpg"
        processed_path = f"{clothing_dir}/{file_id}_processed.png"
        
        if not os.path.exists(original_path) and not os.path.exists(processed_path):
            raise HTTPException(status_code=404, detail="Clothing item not found")
        
        # Get file info
        details = {
            "file_id": file_id,
            "has_original": os.path.exists(original_path),
            "has_processed": os.path.exists(processed_path)
        }
        
        if os.path.exists(original_path):
            stat = os.stat(original_path)
            details.update({
                "original_size": stat.st_size,
                "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat()
            })
        
        return JSONResponse(content=details)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get details: {str(e)}")