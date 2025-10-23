#!/bin/bash

# QuestMaster Startup Script
# This script starts the QuestMaster Flask application

echo "Starting QuestMaster - AI Task Manager..."

# Navigate to the project directory
cd /home/ubuntu/task-manager

# Activate virtual environment
source venv/bin/activate

# Set environment variables
export FLASK_ENV=production
export SECRET_KEY="questmaster-production-key-2024"
export OPENAI_API_KEY="${OPENAI_API_KEY:-your-openai-api-key-here}"

# Create data directory if it doesn't exist
mkdir -p data

# Start the Flask application
echo "Starting Flask application on port 5001..."
python app.py
