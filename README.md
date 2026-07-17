# 🎓 Academic Compass

Academic Compass is a futuristic, all-in-one student hub designed for President University. It connects students across faculties and majors, empowering them with study groups, real-time communication, AI-powered learning tools, and community forums.

---

## ✨ Features

- **📚 Smart Study Groups**: Join or create study groups based on your specific Faculty and Major.
- **💬 Real-Time Chat**: Engage in live discussions within study groups. Supports image uploads, voice recordings, replying to specific messages, and message un-sending.
- **🤖 AI Summaries (Groq Vision)**: Upload course materials or lecture slides (images/PDFs) and instantly get comprehensive topic breakdowns, flashcards, and Q&A powered by Groq's blazing-fast Llama 3 Vision AI model.
- **🗣️ Q&A Forum**: Ask questions (publicly or anonymously), attach images, and upvote the best answers. Includes AI translation capabilities.
- **🌐 Community Posts**: Share announcements, tips, or general thoughts with the entire campus.
- **📅 Interactive Calendar & Events**: Keep track of assignments, study group meetings, and campus-wide events in a unified calendar.

---

## 🛠️ Tech Stack

**Frontend:**
- React (Vite)
- TypeScript
- Tailwind CSS (Glassmorphism UI)
- Framer Motion (Animations)
- Zustand (State Management)

**Backend:**
- Python (FastAPI)
- Groq AI API (LLM & Vision)
- Supabase (PostgreSQL, Authentication, Storage, Real-time WebSockets)

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Python](https://www.python.org/) (3.9 or higher)
- A [Supabase](https://supabase.com/) account
- A [Groq](https://console.groq.com/) API Key

### 1. Clone the repository
```bash
git clone https://github.com/voluztuaire/PU-Community-Hub.git
cd PU-Community-Hub
```

### 2. Frontend Setup (React/Vite)
1. Install Node dependencies:
   ```bash
   npm install
   ```
2. Rename `.env.example` to `.env` in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
   ```

### 3. Backend Setup (Python/FastAPI)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   - **Windows:**
     ```bash
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **Mac/Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Rename `backend/.env.example` to `backend/.env` and add your Groq API key and Supabase credentials:
   ```env
   GROQ_API_KEY=your-groq-api-key-here
   VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
   ```

---

## 💻 Running the App Locally

You will need two separate terminal windows to run both the frontend and the backend simultaneously.

### Start the Backend (Terminal 1)
```bash
cd backend
# Make sure your virtual environment is activated
uvicorn main:app --reload --port 8000
```

### Start the Frontend (Terminal 2)
```bash
# From the root directory of the project
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

---

## 🗄️ Database Setup

If you are setting up your own Supabase project from scratch, use the SQL scripts provided in the `supabase/` directory to build the required tables and insert dummy data.
- Run `01_study_groups_schema_update.sql` first.
- Run `02_dummy_data_insertion.sql` to populate the app for testing.
