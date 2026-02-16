# Windows Development Setup Guide

Complete guide for setting up AuraSwift Desktop POS on Windows. This guide addresses the two major challenges Windows developers face: Node.js version management and native module compilation.

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Step 1: Install Node.js](#step-1-install-nodejs)
- [Step 2: Install Windows Build Tools](#step-2-install-windows-build-tools)
- [Step 3: Install Python](#step-3-install-python)
- [Step 4: Clone and Setup Project](#step-4-clone-and-setup-project)
- [Step 5: Install Dependencies](#step-5-install-dependencies)
- [Step 6: Verify Installation](#step-6-verify-installation)
- [Troubleshooting](#troubleshooting)
- [Common Issues](#common-issues)

---

## Prerequisites

Before you begin, ensure you have:

- Windows 10 or Windows 11 (64-bit)
- At least 10GB of free disk space
- Administrator access to your computer
- Stable internet connection

---

## Step 1: Install Node.js

### ⚠️ CRITICAL: Use Node.js 22.12.0 or higher

This project **requires Node.js version 22.12.0 or higher**. Using an incorrect version will cause compilation errors.

### Option A: Using NVM for Windows (Recommended)

**Why NVM?** Node Version Manager allows you to easily switch between Node.js versions and ensures you're using the correct version.

1. **Download NVM for Windows:**
   - Go to: https://github.com/coreybutler/nvm-windows/releases
   - Download `nvm-setup.exe` (latest version)
   - Run the installer as Administrator

2. **Install Node.js 22.12.0:**

   ```powershell
   # Open PowerShell or Command Prompt as Administrator
   nvm install 22.12.0
   nvm use 22.12.0
   ```

3. **Verify installation:**

   ```powershell
   node --version
   # Should output: v22.12.0 (or higher)

   npm --version
   # Should output: 10.0.0 or higher
   ```

### Option B: Direct Installation (Alternative)

1. Download Node.js 22.x from: https://nodejs.org/
2. Run the installer (choose "Install for all users" if prompted)
3. Restart your computer after installation
4. Verify with `node --version`

### 🔄 Auto-detecting Node Version

The project includes a `.nvmrc` file. If you're using NVM, simply run:

```powershell
nvm use
```

This will automatically switch to the correct Node version.

---

## Step 2: Install Windows Build Tools

### Why are Build Tools needed?

AuraSwift uses native Node.js modules that need to be compiled from C/C++ source code:

- `better-sqlite3` - Database access
- `serialport` - Receipt printer communication
- `node-hid` - USB HID device access
- `usb` - USB device communication
- `node-addon-api` - Native addon support

These modules require **Visual Studio Build Tools** to compile on Windows.

### Installation Methods

#### Option A: Automated Installation (Fastest)

Open **PowerShell as Administrator** and run:

```powershell
npm install --global windows-build-tools
```

⏱️ This will take 15-30 minutes and will install:

- Visual Studio Build Tools 2017
- Python 2.7 (for node-gyp)

⚠️ **Keep PowerShell open** until you see "Successfully installed Python 2.7" and "Successfully installed Visual Studio Build Tools"

#### Option B: Manual Installation (Recommended for 2024+)

For better compatibility with modern Windows and Electron 38.x:

1. **Install Visual Studio 2022 Build Tools:**
   - Download from: https://visualstudio.microsoft.com/downloads/
   - Scroll to "Tools for Visual Studio"
   - Download "Build Tools for Visual Studio 2022"
   - Run the installer
2. **Select Required Components:**
   In the Visual Studio Installer, select:
   - ✅ **Desktop development with C++**
   - Under "Individual components", ensure these are checked:
     - ✅ MSVC v143 - VS 2022 C++ x64/x86 build tools (Latest)
     - ✅ Windows SDK (Latest version, e.g., Windows 11 SDK)
     - ✅ C++ CMake tools for Windows
     - ✅ C++ ATL for latest v143 build tools (x86 & x64)

3. **Install** (This will take 20-45 minutes)

4. **Set Environment Variables:**
   ```powershell
   # Run in PowerShell as Administrator
   npm config set msvs_version 2022
   npm config set python python3
   ```

#### Option C: Visual Studio 2022 Community (Full IDE)

If you prefer a full IDE:

1. Download Visual Studio 2022 Community: https://visualstudio.microsoft.com/vs/community/
2. During installation, select:
   - ✅ **Desktop development with C++**
3. Complete installation
4. Configure npm:
   ```powershell
   npm config set msvs_version 2022
   ```

---

## Step 3: Install Python

### Why Python?

`node-gyp` (the tool that compiles native modules) requires Python 3.x.

### Installation

1. **Check if Python is already installed:**

   ```powershell
   python --version
   # or
   python3 --version
   ```

2. **If not installed, download Python:**
   - Go to: https://www.python.org/downloads/
   - Download Python 3.11 or 3.12 (recommended)
   - Run installer
   - ✅ **IMPORTANT:** Check "Add Python to PATH" during installation

3. **Verify:**

   ```powershell
   python --version
   # Should output: Python 3.11.x or 3.12.x
   ```

4. **Configure npm to use Python:**
   ```powershell
   npm config set python python3
   ```

---

## Step 4: Clone and Setup Project

1. **Install Git** (if not already installed):
   - Download from: https://git-scm.com/download/win
   - Use default settings during installation

2. **Clone the repository:**
   ```powershell
   cd C:\Users\YourUsername\Documents
   git clone https://github.com/YourOrganization/AuraSwift.git
   cd AuraSwift\desktop
   ```

---

## Step 5: Install Dependencies

### 🎯 Critical Installation Steps

1. **Open PowerShell or Command Prompt** in the `desktop` folder

2. **Clean npm cache (recommended):**

   ```powershell
   npm cache clean --force
   ```

3. **Install dependencies:**

   ```powershell
   npm install
   ```

   This process may take 10-20 minutes depending on your internet speed and CPU.

### ⏳ What's Happening During Installation?

You'll see messages about:

- Downloading packages
- **Compiling native modules** (this is where Build Tools are used):
  - `better-sqlite3` may take 2-5 minutes
  - `serialport` may take 2-3 minutes
  - `node-hid` may take 1-2 minutes
  - `usb` may take 1-2 minutes

### 🔄 Post-Install: Rebuild Electron Native Modules

After installation completes, the project automatically runs:

```powershell
npm run postinstall
# This runs: electron-rebuild
```

This ensures all native modules are compiled for Electron's version of Node.js.

---

## Step 6: Verify Installation

### Run Development Server

```powershell
npm start
```

If successful, you should see:

- Vite dev server starting
- Electron window opening
- No error messages in the console

### Run Tests

```powershell
# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e
```

### Build for Production

```powershell
npm run compile
```

This creates a Windows executable in the `dist` folder.

---

## 🛠️ Troubleshooting

### Issue: `node-gyp` Errors During Installation

**Error message:**

```
gyp ERR! find VS
gyp ERR! find VS msvs_version not set from command line or npm config
```

**Solution:**

```powershell
# Set Visual Studio version
npm config set msvs_version 2022

# Install with verbose logging to see what's failing
npm install --verbose
```

---

### Issue: Python Not Found

**Error message:**

```
gyp ERR! stack Error: Could not find any Python installation to use
```

**Solution:**

```powershell
# Option 1: Install Python 3.x and configure
npm config set python python3

# Option 2: Specify exact Python path
npm config set python "C:\Python311\python.exe"

# Verify
npm config get python
```

---

### Issue: `better-sqlite3` Compilation Fails

**Error message:**

```
Error: Cannot find module 'better-sqlite3'
```

**Solutions:**

**Option 1: Manual Rebuild**

```powershell
# Clear node_modules and reinstall
rmdir /s /q node_modules
npm install
```

**Option 2: Use Pre-built Binaries**

```powershell
npm install better-sqlite3 --build-from-source
```

**Option 3: Install specific version**

```powershell
npm install better-sqlite3@12.5.0 --save
```

---

### Issue: `serialport` Compilation Fails

**Error message:**

```
Error: The module '\\?\C:\...\serialport.node' was compiled against a different Node.js version
```

**Solution:**

```powershell
# Rebuild for Electron
npm run postinstall

# Or manually:
.\node_modules\.bin\electron-rebuild.cmd
```

---

### Issue: USB Permission Errors (node-hid, usb modules)

**Solution:**

1. Run PowerShell/Command Prompt **as Administrator**
2. Reinstall dependencies:
   ```powershell
   npm install
   ```

---

### Issue: EACCES or Permission Denied Errors

**Solution:**

```powershell
# Clear npm cache
npm cache clean --force

# Run Command Prompt as Administrator
# Navigate to project folder
cd C:\path\to\AuraSwift\desktop

# Install with admin privileges
npm install
```

---

### Issue: Long Path Names (Windows Path Length Limit)

**Error message:**

```
ENAMETOOLONG: name too long
```

**Solution:**

**Option 1: Enable Long Paths in Windows 10/11**

```powershell
# Run as Administrator
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
  -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

Then restart your computer.

**Option 2: Move project to shorter path**

```powershell
# Instead of: C:\Users\YourName\Documents\Projects\CompanyName\AuraSwift\desktop
# Use: C:\Dev\AuraSwift\desktop
```

---

### Issue: Firewall/Antivirus Blocking Installation

**Symptoms:**

- Installation hangs at specific packages
- Timeout errors
- Network errors

**Solution:**

1. Temporarily disable antivirus/firewall
2. Run installation
3. Re-enable security software
4. Add project folder to antivirus exceptions:
   - Add `C:\path\to\AuraSwift\desktop\node_modules` to exclusions

---

### Issue: Out of Memory During Build

**Error message:**

```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Solution:**

```powershell
# Increase Node.js memory limit
$env:NODE_OPTIONS="--max-old-space-size=4096"

# Then run installation
npm install
```

---

## 📊 Common Issues Summary

| Issue                | Quick Fix                         | Details                                                             |
| -------------------- | --------------------------------- | ------------------------------------------------------------------- |
| Wrong Node version   | `nvm use 22.12.0`                 | [Step 1](#step-1-install-nodejs)                                    |
| Missing Build Tools  | Install VS 2022 Build Tools       | [Step 2](#step-2-install-windows-build-tools)                       |
| Python not found     | `npm config set python python3`   | [Step 3](#step-3-install-python)                                    |
| Native module errors | `npm run postinstall`             | [Troubleshooting](#issue-serialport-compilation-fails)              |
| Permission errors    | Run as Administrator              | [Troubleshooting](#issue-eacces-or-permission-denied-errors)        |
| Path too long        | Enable long paths or move project | [Troubleshooting](#issue-long-path-names-windows-path-length-limit) |

---

## 🔍 Verification Checklist

Before asking for help, verify:

- [ ] Node.js version is 22.12.0 or higher (`node --version`)
- [ ] npm version is 10.0.0 or higher (`npm --version`)
- [ ] Python is installed and in PATH (`python --version`)
- [ ] Visual Studio Build Tools 2022 are installed
- [ ] Running Command Prompt/PowerShell as Administrator
- [ ] No antivirus blocking npm operations
- [ ] Internet connection is stable
- [ ] Project is in a short path (e.g., `C:\Dev\AuraSwift\desktop`)

---

## 📞 Get Help

If you're still experiencing issues:

1. **Check npm logs:**

   ```powershell
   npm install --verbose > install-log.txt 2>&1
   ```

   Share `install-log.txt` with the team

2. **System information:**

   ```powershell
   node --version
   npm --version
   python --version
   npm config get msvs_version
   npm config get python
   ```

3. **Contact the team** with:
   - Error messages
   - Installation logs
   - System information from step 2

---

## 🚀 Quick Start (For Experienced Developers)

If you're familiar with Node.js development on Windows:

```powershell
# Install Node 22.12.0+ via NVM or direct installation
nvm install 22.12.0
nvm use 22.12.0

# Install Visual Studio 2022 Build Tools with C++ Desktop Development

# Configure npm
npm config set msvs_version 2022
npm config set python python3

# Clone and install
git clone <repository-url>
cd AuraSwift\desktop
npm install
npm start
```

---

## 📚 Additional Resources

- [Node.js Downloads](https://nodejs.org/)
- [NVM for Windows](https://github.com/coreybutler/nvm-windows)
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/)
- [node-gyp Windows Installation](https://github.com/nodejs/node-gyp#on-windows)
- [Electron Native Modules](https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules)

---

## 📝 Notes for Team Collaboration

### Keeping Dependencies in Sync

After pulling latest changes:

```powershell
npm install
npm run postinstall
```

### Updating Native Modules

If Electron version changes, rebuild native modules:

```powershell
npm run postinstall
# or
.\node_modules\.bin\electron-rebuild.cmd
```

### Sharing Build Configuration

The project uses `.nvmrc` for Node version. Make sure to:

1. Use `nvm use` to switch to correct version
2. Commit any changes to `package.json` engines field
3. Update this guide if native dependencies change

---

**Last Updated:** February 16, 2026  
**Maintained By:** AuraSwift Development Team  
**Project:** AuraSwift Desktop POS v1.41.2
