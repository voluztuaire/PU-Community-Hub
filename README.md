# PU Community Hub

PU Community Hub is a comprehensive web application designed for students at President University. It serves as a centralized platform for academic collaboration, social engagement, and personal organization.

## Key Features

- Smart Study Groups: Create or join study groups tailored to specific faculties and majors.
- Real-Time Communication: Participate in live discussions within study groups. Features include image uploads, voice recordings, message replies, and un-sending capabilities.
- AI-Powered Learning Assistant: Upload academic materials, documents, or lecture slides (Images/PDFs) to instantly generate comprehensive summaries, flashcards, and Q&A sessions powered by Groq's Llama 3 Vision AI model.
- Interactive Q&A Forum: Ask questions publicly or anonymously, attach media, and upvote the most helpful answers.
- Community Bulletin: Share announcements, tips, and general posts with the entire campus community.
- Personal Calendar: Keep track of academic assignments, group meetings, and personal tasks in a fully functional calendar system.

## Technology Stack

**Frontend:**
- React (Vite)
- TypeScript
- Tailwind CSS
- Framer Motion
- Zustand

**Backend:**
- Python (FastAPI)
- Groq AI API
- Supabase (PostgreSQL, Authentication, Storage, Real-time WebSockets)

## Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
- Node.js (v18 or higher)
- Python (3.9 or higher)
- A Supabase account
- A Groq API Key

### 1. Clone the Repository
```bash
git clone https://github.com/voluztuaire/PU-Community-Hub.git
cd PU-Community-Hub
```

### 2. Database Setup
To configure the Supabase database, execute the SQL scripts provided in the `supabase/` directory via the Supabase SQL Editor:
- Run `01_study_groups_schema_update.sql` to apply the base schema.
- Run `02_dummy_data_insertion.sql` to populate the application with initial testing data.
- Run `03_events_schema_update.sql` to apply the latest event updates.

### 3. Frontend Configuration
1. Install Node dependencies:
   ```bash
   npm install
   ```
2. Rename `.env.example` to `.env` in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
   ```

### 4. Backend Configuration
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   - For Windows:
     ```bash
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - For Mac/Linux:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Rename `backend/.env.example` to `backend/.env` and insert your API keys:
   ```env
   GROQ_API_KEY=your-groq-api-key-here
   VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
   ```

## Running the Application

You must run the backend server and the frontend development server simultaneously in two separate terminal windows.

### Terminal 1: Start the Backend
```bash
cd backend
# Ensure the virtual environment is activated
uvicorn main:app --reload --port 8000
```

### Terminal 2: Start the Frontend
```bash
# Ensure you are in the root directory
npm run dev
```

Finally, open `http://localhost:5173` in your web browser to view the application.
