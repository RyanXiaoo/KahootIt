# 📡 WiFi Setup Guide - Play with Friends!

Your KahootIt app is now configured for **local network multiplayer**! Friends on the same WiFi can join your games.

## 🎮 How to Play with Friends

### Step 1: Find Your Computer's IP Address

**Windows PowerShell:**
```bash
ipconfig
```
Look for "IPv4 Address" under your WiFi adapter:
```
Example: 192.168.1.156
```

**macOS/Linux:**
```bash
ifconfig | grep "inet "
# or
ip addr show
```

### Step 2: Start Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
venv\Scripts\activate
python main_api.py
```
✅ Backend running on `http://0.0.0.0:8000` (accepts external connections)

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
✅ Frontend running on `http://localhost:3000`

### Step 3: Share Your IP with Friends

Tell your friends to visit:
```
http://YOUR_IP:3000
```

**Example:** If your IP is `192.168.1.156`, they visit:
```
http://192.168.1.156:3000
```

### Step 4: Host a Game!

1. **You** (on your computer):
   - Go to `http://localhost:3000`
   - Login → Create/select quiz → "Host Live Game"
   - Get the PIN (e.g., `123456`)

2. **Friends** (on their devices):
   - Go to `http://192.168.1.156:3000` (your IP)
   - Enter the PIN
   - Enter their name
   - Play!

---

## ✅ What Works

- ✅ Friends can join from phones
- ✅ Friends can join from laptops
- ✅ Friends can join from tablets
- ✅ All on the same WiFi network
- ✅ Real-time multiplayer works perfectly!

## ❌ What Doesn't Work

- ❌ Friends on different WiFi (requires internet deployment)
- ❌ Friends on cellular data (requires internet deployment)

## 🔥 Tips

### Finding WiFi IP Quickly
**Windows - Quick Method:**
1. Press `Windows + R`
2. Type `cmd` and press Enter
3. Type `ipconfig`
4. Look for "IPv4 Address" (usually `192.168.x.x` or `10.x.x.x`)

### Sharing with QR Code
1. Go to a QR code generator (e.g., qr-code-generator.com)
2. Enter: `http://YOUR_IP:3000`
3. Show QR code - friends scan and join instantly!

### Firewall Issues?
If friends can't connect:
1. **Windows**: Allow Node.js and Python through firewall
2. **Temporarily disable firewall** to test
3. Make sure you're on the same WiFi network

### Testing
- Open your phone's browser
- Connect to your WiFi
- Go to `http://YOUR_IP:3000`
- If you can see the page, friends can too!

---

## 🎓 Perfect for:

- **Study groups** - Quiz your classmates
- **House parties** - Compete with friends
- **Family game night** - Fun trivia
- **Office breaks** - Team building

**No internet deployment needed!** 🎉

---

## 🚀 Pro Tip

Keep both terminals running during gameplay. You can host multiple games back-to-back without restarting!

**Have fun!** 🎮

