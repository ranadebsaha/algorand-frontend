# 🚀 Deployment Guide

## Current Deployment
- **Live Site**: https://algorand-poap-attend-9ph3.bolt.host
- **Platform**: Bolt Hosting
- **Status**: ✅ Active

## GitHub Setup

### Quick Setup (Recommended)
1. Make the setup script executable:
```bash
chmod +x setup-github.sh
```

2. Run the setup script:
```bash
./setup-github.sh
```

3. Create a new repository on GitHub:
   - Go to https://github.com/new
   - Repository name: `algorand-poap-system`
   - Description: `Futuristic blockchain-verified attendance proof system built on Algorand`
   - Keep it public
   - Don't initialize with README
   - Click "Create repository"

4. Connect and push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/algorand-poap-system.git
git branch -M main
git push -u origin main
```

### Manual Setup
If you prefer to do it manually:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Algorand POAP System"

# Add remote origin (replace with your GitHub URL)
git remote add origin https://github.com/YOUR_USERNAME/algorand-poap-system.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Environment Variables
For full functionality, set up these environment variables:

```env
# Algorand Configuration
VITE_ALGORAND_NODE_URL=https://testnet-api.algonode.cloud
VITE_ALGORAND_INDEXER_URL=https://testnet-idx.algonode.cloud

# Supabase (Optional)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# IPFS (Optional)
VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/
```

## Continuous Deployment
Once on GitHub, you can set up automatic deployments:

### Netlify
1. Connect your GitHub repository
2. Build command: `npm run build`
3. Publish directory: `dist`

### Vercel
1. Import your GitHub repository
2. Framework preset: Vite
3. Build command: `npm run build`
4. Output directory: `dist`

## Development Workflow
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/algorand-poap-system.git
cd algorand-poap-system

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Contributing
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Support
- 📧 Issues: Use GitHub Issues for bug reports
- 💬 Discussions: Use GitHub Discussions for questions
- 🌟 Star the repo if you find it useful!