#!/bin/bash

echo "🚀 Setting up GitHub repository for Algorand POAP System..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
fi

# Add all files
echo "📦 Adding all files to git..."
git add .

# Create commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: Algorand POAP Attendance Verification System

- Complete React + TypeScript frontend with glassmorphism UI
- Neon-themed design with Framer Motion animations
- Organizer dashboard with step-by-step event creation
- Attendee dashboard with NFT collection carousel
- Verifier page with certificate validation
- Mobile-responsive design with bottom navigation
- Ready for Algorand blockchain integration
- Deployed at: https://algorand-poap-attend-9ph3.bolt.host"

echo "✅ Git repository prepared!"
echo ""
echo "🔗 Next steps:"
echo "1. Create a new repository on GitHub"
echo "2. Run: git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git"
echo "3. Run: git branch -M main"
echo "4. Run: git push -u origin main"
echo ""
echo "🌟 Your project is ready for GitHub!"