# python-service/app.py
# Local Diffusers FastAPI Service for PixelMotion AI

import argparse
from fastapi import FastAPI, UploadFile, Form, File, HTTPException
from fastapi.responses import Response
from PIL import Image
import io
import torch
import tempfile
import os

app = FastAPI(title="PixelMotion Local Diffusers")

# Global pipeline
pipeline = None
device = "cuda"

@app.get("/health")
async def health():
    return {"status": "ok", "device": device, "pipeline_loaded": pipeline is not None}

@app.post("/startup")
async def startup(model_path: str, device: str = "cuda"):
    global pipeline, device
    try:
        from diffusers import StableDiffusionImg2ImgPipeline

        # Set device
        if device == "cuda" and not torch.cuda.is_available():
            device = "cpu"
        elif device == "directml":
            # DirectML support via torch-directml package
            device = "mps" if torch.backends.mps.is_available() else "cpu"

        # Load pipeline
        pipeline = StableDiffusionImg2ImgPipeline.from_pretrained(
            model_path,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32
        )
        pipeline = pipeline.to(device)

        return {"success": True, "device": device, "model": model_path}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/generate")
async def generate(
    image: UploadFile = File(...),
    prompt: str = Form(...),
    negative_prompt: str = Form(""),
    num_frames: int = Form(8),
    steps: int = Form(20),
    cfg: float = Form(7.0),
    denoise: float = Form(0.75)
):
    global pipeline, device

    if pipeline is None:
        raise HTTPException(status_code=503, detail="Pipeline not initialized. Call /startup first.")

    try:
        # Read input image
        img = Image.open(io.BytesIO(await image.read())).convert("RGB")

        # Calculate output dimensions (horizontal sprite sheet)
        # Assume input is single frame, output is num_frames horizontally
        frame_width, frame_height = img.size
        output_width = frame_width * num_frames
        output_height = frame_height

        # Resize input to match output aspect ratio if needed
        img = img.resize((output_width, output_height), Image.Resampling.NEAREST)

        # Generate
        result = pipeline(
            prompt=prompt,
            image=img,
            negative_prompt=negative_prompt or "blurry, smooth, 3D, photorealistic",
            num_inference_steps=steps,
            guidance_scale=cfg,
            strength=denoise,
            num_images_per_prompt=1
        )

        # Get result image
        output_image = result.images[0]

        # Save to buffer
        buffer = io.BytesIO()
        output_image.save(buffer, format="PNG")
        buffer.seek(0)

        return Response(
            content=buffer.read(),
            media_type="image/png"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@app.post("/shutdown")
async def shutdown():
    global pipeline
    if pipeline:
        del pipeline
        pipeline = None
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    return {"success": True}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PixelMotion Local Diffusers Service")
    parser.add_argument("--model-path", type=str, required=True, help="Path to diffusers model")
    parser.add_argument("--device", type=str, default="cuda", choices=["cuda", "directml", "cpu"])
    parser.add_argument("--port", type=int, default=8765)

    args = parser.parse_args()

    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=args.port)
