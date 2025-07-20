#!/bin/bash

# Reggie - AI-Powered ESG Compliance Platform - One-Click Setup Script
# This script sets up and runs both frontend and backend

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    printf "${1}${2}${NC}\n"
}

print_color $BLUE "🚀 Reggie - AI-Powered ESG Compliance Platform Setup"
print_color $BLUE "========================================"

# Check if user wants Docker or local setup
echo ""
print_color $YELLOW "Choose your setup method:"
echo "1. Local Development (Recommended - uses bun/npm + PostgreSQL)"
echo "2. Docker (Experimental - may have dependency issues)"
echo ""
read -p "Enter choice (1 or 2): " setup_choice

if [[ "$setup_choice" == "2" ]]; then
    # Docker Setup
    print_color $BLUE "\n🐳 Setting up with Docker..."
    print_color $YELLOW "⚠️  Note: Docker setup is experimental and may have dependency issues."
    print_color $YELLOW "    If this fails, try option 1 (Local Development) instead."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_color $RED "❌ Docker is not installed. Please install Docker first."
        print_color $YELLOW "Visit https://docs.docker.com/get-docker/ for installation instructions."
        exit 1
    fi

    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_color $RED "❌ Docker Compose is not installed. Please install Docker Compose first."
        print_color $YELLOW "Visit https://docs.docker.com/compose/install/ for installation instructions."
        exit 1
    fi

    # Check Docker daemon is running
    if ! docker info >/dev/null 2>&1; then
        print_color $RED "❌ Docker daemon is not running. Please start Docker first."
        exit 1
    fi

    # Handle potential Docker credential issues on macOS BEFORE any Docker operations
    if [[ "$OSTYPE" == "darwin"* ]]; then
        print_color $YELLOW "🍎 Detected macOS - checking Docker credentials..."
        
        # Test Docker credentials with a simple command
        if ! docker version >/dev/null 2>&1; then
            print_color $YELLOW "⚠️  Docker credential issue detected. Applying fix..."
            
            # Backup existing config
            if [ -f "$HOME/.docker/config.json" ]; then
                cp "$HOME/.docker/config.json" "$HOME/.docker/config.json.backup.$(date +%Y%m%d_%H%M%S)"
                print_color $BLUE "📝 Backed up existing Docker config"
            fi
            
            # Create minimal config without credential helpers
            mkdir -p "$HOME/.docker"
            cat > "$HOME/.docker/config.json" << EOF
{
  "auths": {},
  "HttpHeaders": {
    "User-Agent": "Docker-Client/$(docker --version | cut -d' ' -f3 | cut -d',' -f1) (darwin)"
  },
  "credsStore": ""
}
EOF
            
            print_color $GREEN "✅ Docker credentials fixed. Continuing with setup..."
            
            # Verify the fix worked
            if ! docker version >/dev/null 2>&1; then
                print_color $RED "❌ Docker credential fix failed. Please run: ./fix-docker-credentials.sh"
                exit 1
            fi
            
            # Test with a simple pull to ensure everything works
            print_color $BLUE "🧪 Testing Docker functionality..."
            if ! docker pull hello-world >/dev/null 2>&1; then
                print_color $RED "❌ Docker still not working properly. Manual intervention needed."
                print_color $YELLOW "Try running: ./fix-docker-credentials.sh"
                exit 1
            fi
            print_color $GREEN "✅ Docker test successful"
        else
            print_color $GREEN "✅ Docker credentials working correctly"
        fi
    fi

    # Start the application
    print_color $GREEN "📦 Building and starting containers..."
    
    if ! docker-compose up -d --build; then
        print_color $RED "❌ Failed to start containers. Please check Docker logs:"
        print_color $YELLOW "   docker-compose logs"
        exit 1
    fi

    # Wait for services to be ready
    print_color $YELLOW "⏳ Waiting for services to start..."
    sleep 15

    # Check if backend container is running
    if ! docker-compose ps backend | grep -q "Up"; then
        print_color $RED "❌ Backend container failed to start. Checking logs..."
        docker-compose logs backend
        exit 1
    fi

    # Initialize the database
    print_color $GREEN "🗄️  Initializing database..."
    if ! docker-compose exec -T backend bun run db:push; then
        print_color $RED "❌ Database schema setup failed. Retrying..."
        sleep 5
        docker-compose exec -T backend bun run db:push || {
            print_color $RED "❌ Database setup failed. Please check the logs."
            docker-compose logs backend
            exit 1
        }
    fi
    
    if ! docker-compose exec -T backend bun run db:seed; then
        print_color $YELLOW "⚠️  Database seeding failed, but continuing. You can seed manually later."
        print_color $BLUE "   Run: docker-compose exec backend bun run db:seed"
    fi

    print_color $GREEN "\n✅ Setup complete!"
    print_color $BLUE "🌐 Access the application at:"
    print_color $GREEN "   Frontend: http://localhost:3000"
    print_color $GREEN "   Backend API: http://localhost:3001"
    print_color $BLUE "\n📝 To stop: docker-compose down"

elif [[ "$setup_choice" == "1" ]]; then
    # Local Development Setup
    print_color $BLUE "\n💻 Setting up for local development..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_color $RED "❌ Node.js is not installed. Please install Node.js 18+ first."
        print_color $YELLOW "Visit https://nodejs.org/ for installation instructions."
        exit 1
    fi

    # Check for package managers
    if command -v bun &> /dev/null; then
        BACKEND_PM="bun"
        BACKEND_INSTALL="bun install"
        BACKEND_RUN="bun run"
    elif command -v npm &> /dev/null; then
        BACKEND_PM="npm"
        BACKEND_INSTALL="npm install"
        BACKEND_RUN="npm run"
    else
        print_color $RED "❌ No package manager found. Please install bun or npm."
        exit 1
    fi

    if command -v npm &> /dev/null; then
        FRONTEND_PM="npm"
        FRONTEND_INSTALL="npm install"
        FRONTEND_RUN="npm run"
    else
        print_color $RED "❌ npm is required for frontend. Please install Node.js/npm."
        exit 1
    fi

    # Check PostgreSQL
    if ! command -v psql &> /dev/null; then
        print_color $RED "❌ PostgreSQL is not installed or not in PATH."
        print_color $YELLOW "Please install PostgreSQL and ensure it's running."
        print_color $YELLOW "Or use Docker setup (option 1) which includes PostgreSQL."
        exit 1
    fi

    # Create .env file if it doesn't exist
    if [ ! -f "backend/.env" ]; then
        print_color $YELLOW "📝 Creating backend/.env file..."
        if [ -f "backend/.env.example" ]; then
            cp backend/.env.example backend/.env
            print_color $GREEN "✅ Created backend/.env from .env.example"
            print_color $YELLOW "⚠️  Please update DATABASE_URL in backend/.env with your PostgreSQL credentials"
        else
            cat > backend/.env << EOF
DATABASE_URL="postgresql://postgres:password@localhost:5432/reggie_db"
OPENAI_API_KEY=""
EOF
            print_color $GREEN "✅ Created basic backend/.env file"
            print_color $YELLOW "⚠️  Please update DATABASE_URL and add OPENAI_API_KEY in backend/.env"
        fi
    fi

    # Install backend dependencies
    print_color $GREEN "📦 Installing backend dependencies with $BACKEND_PM..."
    cd backend
    $BACKEND_INSTALL

    # Generate Prisma client and push schema
    print_color $GREEN "🗄️  Setting up database..."
    $BACKEND_RUN db:generate
    $BACKEND_RUN db:push
    $BACKEND_RUN db:seed

    cd ..

    # Install frontend dependencies
    print_color $GREEN "📦 Installing frontend dependencies with $FRONTEND_PM..."
    cd frontend
    $FRONTEND_INSTALL
    cd ..

    # Start backend in background
    print_color $GREEN "🚀 Starting backend server..."
    cd backend
    $BACKEND_RUN dev &
    BACKEND_PID=$!
    cd ..

    # Wait a moment for backend to start
    sleep 3

    # Start frontend in background
    print_color $GREEN "🚀 Starting frontend server..."
    cd frontend
    $FRONTEND_RUN dev &
    FRONTEND_PID=$!
    cd ..

    # Function to cleanup processes on exit
    cleanup() {
        print_color $YELLOW "\n🛑 Shutting down servers..."
        kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
        print_color $GREEN "✅ Servers stopped"
        exit 0
    }

    # Set trap to cleanup on script exit
    trap cleanup SIGINT SIGTERM

    print_color $GREEN "\n✅ Setup complete!"
    print_color $BLUE "🌐 Access the application at:"
    print_color $GREEN "   Frontend: http://localhost:3000"
    print_color $GREEN "   Backend API: http://localhost:3001"
    print_color $BLUE "\n📝 Press Ctrl+C to stop both servers"

    # Keep script running
    wait

else
    print_color $RED "❌ Invalid choice. Please run the script again and choose 1 or 2."
    exit 1
fi 