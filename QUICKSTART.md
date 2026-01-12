# 🚀 Quick Start Guide - KahootIt

Get up and running in 5 minutes!

## Step 1: Install Dependencies (2 min)

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
```

## Step 2: Configure API Keys (1 min)

Create `backend/.env`:
```env
OPENAI_API_KEY=sk-your-key-here
SECRET_KEY=my-super-secret-jwt-key-12345
```

Get your OpenAI API key at: https://platform.openai.com/api-keys

## Step 3: Initialize Database (30 sec)

```bash
cd backend
python -c "from database import engine; import models; models.Base.metadata.create_all(bind=engine)"
```

## Step 4: Start Servers (30 sec)

### Terminal 1 - Backend
```bash
cd backend
venv\Scripts\activate
python main_api.py
```
✅ Backend running on http://localhost:8000

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
✅ Frontend running on http://localhost:3000

## Step 5: Try It Out! (1 min)

1. Open http://localhost:3000
2. Click "Sign In" → "Create Account"
3. Sign up with any email/password
4. Click "Create Kahoot"
5. Upload a PDF and click "Create Kahoot"
6. Watch AI generate questions automatically! 🎉

## Create Your First Game

1. Go to "My Kahoots"
2. Click on your quiz
3. Click "Host Live Game"
4. Share the PIN with friends
5. Open another browser tab → Enter PIN to join as a player
6. Click "Start Game" and play!

## Troubleshooting

### "Could not validate credentials"
- Log out and log back in
- Check that `SECRET_KEY` is set in `backend/.env`

### "OpenAI API error"
- Verify `OPENAI_API_KEY` in `backend/.env`
- Restart backend server after adding the key

### Database errors
- Delete `backend/kahootit.db` and reinitialize:
  ```bash
  python -c "from database import engine; import models; models.Base.metadata.create_all(bind=engine)"
  ```

### Port already in use
- Backend: Change port in `main_api.py` (line with `uvicorn.run`)
- Frontend: `npm run dev -- -p 3001`

## Next Steps

- 📖 Read the full [README.md](README.md)
- 🎮 Host a game with multiple players
- 📝 Create quizzes from your study notes
- 🔧 Customize the code to your needs

**Enjoy your AI-powered quiz platform!** 🎉

