#!/bin/bash

# Run script for Carbon Emissions Compliance AI Docker setup

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    echo "Visit https://docs.docker.com/get-docker/ for installation instructions."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit https://docs.docker.com/compose/install/ for installation instructions."
    exit 1
fi

# Start the application
echo "Starting Carbon Emissions Compliance AI..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

# Initialize the database if needed
echo "Do you want to initialize the database with seed data? (y/n)"
read -r init_db
if [[ "$init_db" =~ ^[Yy]$ ]]; then
    echo "Initializing database..."
    docker-compose exec backend bun run db:push
    docker-compose exec backend bun run db:seed
fi

# Print access information
echo ""
echo "Carbon Emissions Compliance AI is now running!"
echo "Access the application at:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:3001"
echo ""
echo "To stop the application, run: docker-compose down"
echo "For more information, see README.docker.md" 