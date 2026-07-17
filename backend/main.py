import os
import base64
import uuid
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from groq import Groq
from pydantic import BaseModel
from typing import List
import re
import fitz
import json

load_dotenv()

app = FastAPI(title="AI Summary Module - Groq Vision Fixed")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class FAQ(BaseModel):
    question: str
    answer: str

def preprocess_text(text: str) -> str:
    return re.sub(r'\s+', ' ', text.strip())

def parse_json_response(result: str):
    result = result.strip()
    if result.startswith("```json"):
        result = result[7:]
    if result.startswith("```"):
        result = result[3:]
    if result.endswith("```"):
        result = result[:-3]
    return json.loads(result.strip())

# ====================== EXTRACT TEXT ATAU IMAGE DARI PDF ======================
async def process_pdf(file_bytes: bytes, filename: str):
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text() or ""
    
    text = text.strip()
    alpha_chars = sum(c.isalpha() for c in text)
    
    is_scanned = False
    if len(text) < 300 or alpha_chars < 200:
        is_scanned = True
    elif len(text) > 0 and (alpha_chars / len(text)) < 0.5:
        is_scanned = True

    if is_scanned:
        page = doc.load_page(0)
        pix = page.get_pixmap() # Pakai resolusi standar agar lebih cepat
        img_bytes = pix.tobytes("jpeg") # Pakai JPEG supaya sizenya jauh lebih kecil (bisa 10x lipat lebih cepat loadingnya)
        return await process_with_vision(img_bytes, "image/jpeg", filename)
    else:
        return await process_with_text(text)

# ====================== PROCESS DENGAN VISION (untuk Image) ======================
async def process_with_vision(file_bytes: bytes, mime_type: str, filename: str):
    base64_image = base64.b64encode(file_bytes).decode('utf-8')
    image_url = f"data:{mime_type};base64,{base64_image}"

    prompt = """
You are an expert academic assistant.
Analyze the document/image and do the following in English:

1. Write a concise academic summary (max 180 words).
2. Extract 6-8 high-level conceptual topics.
3. Generate 5 insightful FAQ pairs (question + answer).

Return ONLY valid JSON:
{
  "summary": "...",
  "topics": ["topic1", "topic2", ...],
  "faqs": [
    {"question": "...", "answer": "..."}
  ]
}
"""

    try:
        completion = client.chat.completions.create(
            model="llama-3.2-11b-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": image_url}}
                    ]
                }
            ],
            temperature=0.3,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )
        result = completion.choices[0].message.content
        return parse_json_response(result) if isinstance(result, str) else result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vision processing failed: {str(e)}")

# ====================== PROCESS DENGAN TEXT MODEL ======================
async def process_with_text(content: str):
    if len(content.strip()) < 50:
        raise HTTPException(status_code=400, detail="Content too short")

    # Potong text maksimal ~15,000 karakter agar tidak kena limit 6000 TPM Groq Free Tier
    content = content[:15000]

    system_prompt = """
You are an expert academic assistant for university students.

Follow these steps:
1. Write a clear academic summary (max 180 words).
2. Extract 6-8 meaningful conceptual topics.
3. Generate 5 insightful FAQ pairs.

Return ONLY valid JSON with keys: "summary", "topics", "faqs"
"""

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": content}
            ],
            temperature=0.25,
            max_tokens=4000,
            response_format={"type": "json_object"}
        )
        result = completion.choices[0].message.content
        return parse_json_response(result) if isinstance(result, str) else result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

# ====================== MAIN ENDPOINT ======================
@app.post("/ai-summary")
async def ai_summary(text: str = Form(None), file: UploadFile = File(None)):
    if not text and not file:
        raise HTTPException(status_code=400, detail="Provide text or upload file")

    try:
        if file:
            file_bytes = await file.read()
            filename = file.filename.lower()

            if file.content_type.startswith("image/"):
                result = await process_with_vision(file_bytes, file.content_type, filename)
            elif filename.endswith(".pdf"):
                result = await process_pdf(file_bytes, filename)
            else:
                raise HTTPException(status_code=400, detail="Only PDF and images (jpg, png, webp) supported")
        else:
            content = preprocess_text(text)
            result = await process_with_text(content)

        return {
            "status": "success",
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now().isoformat(),
            "summary": result.get("summary", ""),
            "topics": result.get("topics", []),
            "faqs": result.get("faqs", [])
        }

    except Exception as e:
        print("Error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

class TranslateRequest(BaseModel):
    text: str

@app.post("/translate")
async def translate_text(req: TranslateRequest):
    if not req.text:
        raise HTTPException(status_code=400, detail="Provide text to translate")
        
    prompt = f"""
You are a translation assistant. Translate the following text into Indonesian if it is in English, or into English if it is in Indonesian. Keep the original formatting and meaning intact.

Text to translate:
{req.text}

Return ONLY the translated text without any conversational filler or quotes.
"""

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=1000,
        )
        result = completion.choices[0].message.content
        return {"status": "success", "translated_text": result.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

@app.post("/ai-chatbot")
async def ai_chatbot(req: ChatRequest):
    if not req.messages:
        raise HTTPException(status_code=400, detail="Provide messages")
        
    try:
        # Format messages for groq
        groq_msgs = [{"role": "system", "content": "You are PU Hub Assistant, a helpful AI for students."}]
        for m in req.messages:
            groq_msgs.append({"role": m.role, "content": m.content})
            
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=groq_msgs,
            temperature=0.5,
            max_tokens=1000,
        )
        reply = completion.choices[0].message.content
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
