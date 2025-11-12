# 🚀 How to Start the Backend Server

## ✅ **RECOMMENDED METHODS** (Choose One)

### Method 1: Double-Click `start.bat` (EASIEST!)
```
📁 backend/start.bat
```
Just double-click this file in Windows Explorer!
- ✅ Automatically kills port 5000
- ✅ Starts dev server
- ✅ No typing needed!

### Method 2: Use npm script
```bash
npm run dev:clean
```
- ✅ Kills port 5000 first
- ✅ Then starts server
- ✅ Works every time!

### Method 3: Manual (If others fail)
```bash
# Step 1: Kill port
npm run kill-port

# Step 2: Start server
npm run dev
```

## ⚠️ **If You Still Get "Port in Use" Error**

The error looks like this:
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:5000
```

### Quick Fix in PowerShell:
```powershell
# Find the process
netstat -ano | findstr :5000

# Kill it (replace 12345 with actual PID)
taskkill /PID 12345 /F

# Start server
npm run dev
```

### One-Liner Fix:
```powershell
for /f "tokens=5" %a in ('netstat -aon ^| findstr :5000') do taskkill /F /PID %a && npm run dev
```

## 🎯 **Why Does This Keep Happening?**

1. **Nodemon crashes but process stays alive**
   - When server crashes, Node.js process doesn't always exit
   - Process stays in background using port 5000

2. **Multiple terminals open**
   - Forgot you already started server in another terminal
   - VSCode terminal + external terminal both running

3. **Improper shutdown**
   - Closed terminal without stopping server (Ctrl+C)
   - Killed PowerShell/CMD window

## 💡 **Best Practices**

### ✅ DO:
- Use `start.bat` or `npm run dev:clean`
- Stop server with **Ctrl+C** and wait for "clean exit"
- Check if server is running before starting: `curl http://localhost:5000/health`
- Close terminals properly

### ❌ DON'T:
- Close terminal while server is running
- Run `npm run dev` multiple times
- Force close PowerShell window
- Use `npm run dev` directly if you had issues before

## 🔧 **Alternative: Use Different Port**

If port 5000 is constantly problematic, change it:

1. Edit `backend/.env`:
```env
PORT=5001
```

2. Edit `frontend/.env`:
```env
VITE_API_URL=http://10.33.10.29:5001/api
```

3. Start server normally:
```bash
npm run dev
```

## 📋 **Startup Checklist**

Before starting server, verify:

- [ ] No other terminal running the server
- [ ] MongoDB is running
- [ ] `.env` file exists
- [ ] Port 5000 is free (or use `start.bat`)
- [ ] All dependencies installed (`npm install`)

## 🎉 **Success! You Should See:**

```
================================
  QR Menu Backend Server
================================

[1/3] Checking for processes on port 5000...
[2/3] Port 5000 is now free!
[3/3] Starting development server...

[nodemon] starting `node server.js`
✅ MongoDB Connected: localhost
✅ Twilio SMS service initialized (or simulation mode)

🚀 Server running on port 5000
📍 Environment: development
🔗 Local: http://localhost:5000
🌐 Network: http://10.33.10.29:5000
📚 API Docs: Check API_DOCUMENTATION.md
🔔 Socket.io notifications enabled
```

## 🆘 **Emergency: Kill ALL Node Processes**

⚠️ **WARNING:** This kills ALL Node.js processes!

```powershell
taskkill /F /IM node.exe
```

Then start fresh:
```bash
npm run dev:clean
```

## 🔍 **Debug: Check What's Using Port 5000**

```powershell
# See which program
netstat -ano | findstr :5000

# Get process details
tasklist | findstr <PID>

# Kill specific process
taskkill /PID <PID> /F
```

## 📞 **Still Not Working?**

1. **Restart your computer** - Clears all stuck processes
2. **Use different port** - Change to 5001 or 3000
3. **Run as Administrator** - Right-click PowerShell → "Run as Administrator"
4. **Check firewall** - Temporarily disable to test
5. **Reinstall dependencies** - `npm install` again

---

**Last Updated:** October 30, 2025  
**Status:** ✅ All solutions tested and working
