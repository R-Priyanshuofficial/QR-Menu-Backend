# Port 5000 Already in Use - Quick Fix Guide

## ⚡ Quick Fix (3 Methods)

### Method 1: Use the Clean Start Script (RECOMMENDED)
```bash
npm run dev:clean
```
This automatically kills any process on port 5000, then starts the dev server.

### Method 2: Kill Port Manually
```bash
npm run kill-port
```
Then start normally:
```bash
npm run dev
```

### Method 3: Manual Windows Command
```powershell
# Find process on port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with the actual number)
taskkill /PID <PID> /F

# Start server
npm run dev
```

## 🔍 Why This Happens

1. **Previous server didn't stop properly**
   - Nodemon crashed but process stayed alive
   - Terminal closed without stopping server
   - Ctrl+C didn't kill the process

2. **Multiple instances running**
   - Opened multiple terminals
   - Forgot about background process
   - VSCode terminal kept process alive

## 🛠️ Permanent Solutions

### Solution 1: Always Use `npm run dev:clean`
This ensures port is free before starting.

### Solution 2: Use Different Port
Edit `backend/.env`:
```env
PORT=5001
```
Then update frontend `.env`:
```env
VITE_API_URL=http://10.33.10.29:5001/api
```

### Solution 3: Add to VSCode Tasks
Create `.vscode/tasks.json`:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Kill Port 5000 & Start Dev",
      "type": "shell",
      "command": "npm run dev:clean",
      "problemMatcher": [],
      "group": {
        "kind": "build",
        "isDefault": true
      }
    }
  ]
}
```

## 📋 Troubleshooting Checklist

Before starting the server, check:

- [ ] No other terminal running `npm run dev`
- [ ] No background Node.js process on port 5000
- [ ] MongoDB is running
- [ ] `.env` file exists with correct values
- [ ] All dependencies installed (`npm install`)

## 🎯 Best Practices

1. **Always stop server properly:**
   ```bash
   # Press Ctrl+C in terminal
   # Wait for "nodemon clean exit"
   ```

2. **Check if server is running:**
   ```bash
   # Test if port 5000 responds
   curl http://localhost:5000/health
   ```

3. **Use nodemon properly:**
   - Don't close terminal while server is running
   - Let nodemon clean up when you stop it
   - Use `rs` to restart instead of Ctrl+C

4. **Monitor running processes:**
   ```bash
   # List all Node.js processes
   tasklist | findstr node
   ```

## 🚀 Pro Tips

### Create a Batch File for Easy Access
Create `start-backend.bat`:
```batch
@echo off
echo Killing any process on port 5000...
npm run kill-port
echo Starting development server...
npm run dev
```

### Add to package.json for even faster access:
Already added! Just use:
```bash
npm run dev:clean
```

### Use PM2 for Production
```bash
npm install -g pm2
pm2 start server.js --name "qr-menu-api"
pm2 stop qr-menu-api  # Clean stop
pm2 restart qr-menu-api  # Restart
pm2 logs qr-menu-api  # View logs
```

## 🔧 Advanced Debugging

### Find all processes using port 5000:
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess
```

### Kill all Node.js processes (USE WITH CAUTION):
```powershell
taskkill /F /IM node.exe
```

### Check if MongoDB is using port 5000:
```powershell
# MongoDB usually uses 27017, not 5000
# But check anyway:
mongod --version
```

## 📞 Still Having Issues?

1. **Restart your computer** - Sometimes processes get stuck
2. **Change the port** - Use 5001 or 3000
3. **Check antivirus/firewall** - May be blocking port
4. **Run as administrator** - Some Windows versions need it

## ✅ All Fixed Warnings

The following warnings have been fixed in the code:

1. ✅ **MongoDB useNewUrlParser warning** - Removed deprecated option
2. ✅ **MongoDB useUnifiedTopology warning** - Removed deprecated option
3. ✅ **Duplicate schema index warning** - Fixed in QRCode model
4. ✅ **EADDRINUSE error** - Added kill-port script

---

**Last Updated:** October 30, 2025
**Status:** ✅ All issues resolved
