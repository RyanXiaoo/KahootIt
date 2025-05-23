# KahootIt: AI-Powered Quiz Generator

## Overview

KahootIt is a full-stack web application designed to transform PDF documents (like lecture notes or study guides) into interactive quizzes. Users can upload their PDFs, specify parameters, and generate quizzes that can be used for learning and self-assessment. The application leverages OpenAI\'s GPT models for intelligent question generation, providing a seamless experience from content input to quiz engagement.

## Key Features

-   **AI-Powered Question Generation:** Utilizes OpenAI GPT (gpt-3.5-turbo) to automatically create multiple-choice questions from uploaded PDF content.
-   **User Authentication:** Secure user registration and login system using JWT (JSON Web Tokens).
-   **PDF Processing:** Extracts text from specific page ranges within uploaded PDF files.
-   **Quiz Management:**
    -   Users can create and save quizzes associated with their account.
    -   "My Kahoots" dashboard to view and manage created quizzes.
-   **Interactive Study Modes:**
    -   **Flashcards:** Review questions and answers with a confidence-based progression system (cards marked "confident" are removed, "not confident" are reviewed again).
    -   **Learn Mode:** Engage in a multiple-choice quiz format, receive scores, and view explanations.
-   **Dynamic Quiz Detail Pages:** View quiz titles and access different study modes.
-   **Responsive UI:** Frontend built with Next.js and Tailwind CSS for a modern and responsive user experience across devices.

## Technologies Used

### Backend

-   **Language:** Python 3.x
-   **Framework:** FastAPI
-   **Database:** SQLite (with SQLAlchemy ORM)
-   **Authentication:** JWT (python-jose, passlib)
-   **AI Integration:** OpenAI API (openai library)
-   **PDF Processing:** PyMuPDF
-   **Environment Management:** python-dotenv
-   **ASGI Server:** Uvicorn

### Frontend

-   **Framework:** Next.js (v13+ with App Router)
-   **Language:** TypeScript
-   **UI Library:** React
-   **Styling:** Tailwind CSS
-   **State Management:** React Context API
-   **HTTP Client:** Fetch API

### General

-   **Version Control:** Git
-   **Data Format:** JSON

## Project Structure

```
kahootit/
├── backend/
│   ├── .env                # Backend environment variables (API keys, JWT secret)
│   ├── auth.py             # Authentication logic (JWT, password hashing)
│   ├── database.py         # Database setup (SQLAlchemy engine, SessionLocal)
│   ├── main_api.py         # FastAPI application, API endpoints
│   ├── models.py           # SQLAlchemy ORM models (User, Quiz, Question)
│   ├── pdf_processor.py    # PDF text extraction and OpenAI question generation logic
│   └── requirements.txt    # Backend Python dependencies
├── frontend/
│   ├── app/                # Next.js App Router (pages, layouts)
│   │   ├── create-kahoot/
│   │   ├── my-kahoots/
│   │   └── quiz/[id]/
│   ├── components/         # Reusable React components (FlashcardInterface, LearnInterface, etc.)
│   ├── context/            # React Context (e.g., AuthContext)
│   ├── public/             # Static assets
│   ├── .env.local          # Frontend environment variables (e.g., API base URL)
│   ├── next.config.js
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
└── README.md               # This file
```

## Setup and Installation

### Prerequisites

-   Python 3.8+
-   Node.js 18.x+ and npm/yarn
-   An OpenAI API Key

### Backend Setup

1.  **Clone the repository (if you haven\'t already):**

    ```bash
    git clone <your-repository-url>
    cd kahootit/backend
    ```

2.  **Create and activate a virtual environment:**

    ```bash
    python -m venv venv
    # On Windows
    venv\\Scripts\\activate
    # On macOS/Linux
    source venv/bin/activate
    ```

3.  **Install Python dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up environment variables:**
    -   Create a `.env` file in the `backend/` directory by copying `backend/.env.example` (if you create one) or by creating it manually.
    -   Add the following variables:
        ```env
        OPENAI_API_KEY="your_openai_api_key_here"
        SECRET_KEY="your_strong_secret_key_for_jwt"
        ALGORITHM="HS256"
        ACCESS_TOKEN_EXPIRE_MINUTES=30
        # For SQLite, the DATABASE_URL is relative to where the app runs.
        # If running from backend/, kahootit.db will be created in backend/.
        DATABASE_URL="sqlite:///./kahootit.db"
        ```
    -   Replace `"your_openai_api_key_here"` with your actual OpenAI API key.
    -   Replace `"your_strong_secret_key_for_jwt"` with a long, random, and strong secret string. You can generate one using Python: `import secrets; secrets.token_hex(32)`

### Frontend Setup

1.  **Navigate to the frontend directory:**

    ```bash
    cd ../frontend
    # (If you are in the backend directory, otherwise cd kahootit/frontend)
    ```

2.  **Install Node.js dependencies:**

    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up environment variables (optional for frontend if defaults are okay):**
    -   The frontend typically connects to `http://localhost:8000` for the API. If your backend runs on a different port or URL, you might need to configure it.
    -   Create a `.env.local` file in the `frontend/` directory if you need to override defaults.
        ```env
        NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"
        ```

## Running the Application

### 1. Start the Backend Server

-   Navigate to the `backend/` directory.
-   Ensure your virtual environment is activated.
-   Run the FastAPI application using Uvicorn:
    ```bash
    uvicorn main_api:app --reload
    ```
    The backend API will typically be available at `http://localhost:8000`. The database `kahootit.db` will be created in the `backend/` directory upon first run if it doesn\'t exist, and tables will be created by SQLAlchemy.

### 2. Start the Frontend Development Server

-   Open a new terminal.
-   Navigate to the `frontend/` directory.
-   Run the Next.js development server:
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The frontend application will typically be available at `http://localhost:3000`.

You can now open `http://localhost:3000` in your browser to use KahootIt.

## API Endpoints (Overview)

The backend API (running on `http://localhost:8000`) provides the following key endpoints:

-   `POST /register`: User registration.
-   `POST /token`: User login, returns JWT access token.
-   `GET /users/me`: Get current authenticated user details.
-   `POST /upload-notes/`: (Protected) Upload PDF, specify page range and number of questions to generate a quiz.
-   `GET /game/{game_id}`: (Public) Retrieve quiz details and questions for playing/studying.
-   `GET /quizzes/my`: (Protected) Retrieve quizzes created by the authenticated user.

_(Refer to `backend/main_api.py` for detailed request/response schemas and other potential endpoints.)_

## Potential Future Enhancements

-   **Multiple Correct Answers:** Support for questions where multiple options can be correct.
-   **Different Question Types:** Implement short answer, true/false, or fill-in-the-blanks.
-   **Advanced PDF Parsing:** Improved layout detection for more accurate text extraction from complex PDFs.
-   **Quiz Sharing:** Allow users to share their quizzes with others.
-   **Public Quiz Library:** A space for users to explore and use quizzes created by others.
-   **"Learn Mode" Improvements:** More sophisticated learning algorithms, spaced repetition.
-   **Real-time Multiplayer:** Convert "Learn Mode" into a live Kahoot-style game.
-   **Dockerization:** Containerize backend and frontend for easier deployment.
-   **More Robust Error Handling:** Enhanced error feedback throughout the application.
-   **Unit and Integration Tests:** Implement a comprehensive testing suite.

---

_This README provides a general guide. Specific configurations or steps might vary slightly based on your local environment._
