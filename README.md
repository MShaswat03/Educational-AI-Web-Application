# Educational AI Web Application

An AI-powered learning portal that combines:
- Chapter PDF ingention (vectorized using `nomic-embed-text`).
- Retrieval-Augmented Generation (RAG) with Ollama + LangChain.
- Interactive frontend (React + Bootstrap) for quizzes, baseline tests, and AI tutoring.

---
## Features
- Uploads and indexs PDF chapters automatically.
- Generates chunked embeddings using LangChain and ChromaDB.
- Runs a Flask backend with the `/rag` endpoint
- React frontend includes:
    - Baseline Assessments
    - MCQs (Novice, Intermediate, Advanced)
    - AI Tutor (RAG-powered Q&A) with source citations
---
## Requirements 
- Python 3.10+ (tested on 3.13 with venv)
- Node.js 18+ and npm
- Git
- Ollama (running locally)

---

## Setup Instructions 

### 1. Clone the repository
```bash
git clone  https://github.com/MShaswat03/Educational-AI-Web-Application.git
cd Educational-AI-Web-Aplication
```
### 2. Backend Setup (Flask + LangChain)

### 2.1 Create and activate a virtual environment 
```bash 
  python3 -m venv venv
  source venv/bin/activate  # macOS/Linux
  venv\Scripts\activate     # Windows 
  ```
2.2 Install dependencies
```
pip install -r requirements.txt
```

2.3 Start Ollama & pull models

Download Ollama from ttps://ollama.com/download

Pull required models:
```
ollama pull nomic-embed-text
ollama pull llama3:8b
```

2.4 Environment Variables (optional)

You can configure via .env or directly in shell:
```
export CHATER_DIR=./admin_engine/uploads
export EMBED_MODEL=nomic-embed-text
export LLM_MODEL=llama3:8b
export DEBUG_RAG=1
```
2.5 Start the backend
```
python app.py
```
Expected output:
```
[RAG] eemh103: pages=16, chunks=22
Chapters indexed: ['eemh103', 'eemh104']
* Running on  http://127.0.0.1:5001
```


Backend API:

POST /rag → Ask a question (with {chapter, question} JSON body)

GET /debug/chunks/<chapter> → Inspect chunks

POST /debug/search → Inspect retrieval step only
3. Frontend Setup (React)
3.1 Install dependencies
3. Frontend Setup (React)
3.1 Install dependencies
cd frontend
npm install

3.2 Configure backend URL

By default, frontend calls http://localhost:5001/rag.

To override, create a .env file inside frontend/:

VITE_RAG_URL=http://localhost:5001/rag

3.3 Start frontend
npm run dev


Open http://localhost:5173
 in your browser.

Usage Workflow

Upload PDFs into admin_engine/uploads/

Start backend:

python app.py


Start frontend:

npm run dev


Open browser → Select a chapter → Take baseline assessment → Quizzes

Use AI Tutor box to ask questions (e.g. “What is the area of a rectangle with sides 8 and 5 cm?”).
The system will answer with context + Related Material.

Project Structure
Educational-AI-Web-Application/
│
├── app.py                  # Flask backend (RAG engine)
├── requirements.txt        # Python dependencies
├── admin_engine/
│   └── uploads/            # PDF chapters
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── AppAuto.jsx     # Main app driver
│   │   ├── AITutor.jsx     # RAG-integrated AI tutor
│   │   └── ui.css          # Styling
│   └── package.json
│
└── README.md               # This file

Example API Call
curl -X POST http://localhost:5001/rag \
  -H "Content-Type: application/json" \
  -d '{"chapter":"eemh103","question":"How do you find the area of a rectangle?"}'


Response:

{
  "answer": "To find the area of a rectangle, multiply length × width.",
  "sources": [
    {
      "page": 11,
      "preview": "Here is a rectangle of area 20 square cm...",
      "source": "eemh103.pdf"
    }
  ]
}

