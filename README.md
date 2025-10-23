# QuestMaster - AI-Powered Gamified Task Manager

A futuristic, gaming-inspired task management application that uses AI to break down your tasks into engaging, step-by-step quests.

![QuestMaster](https://img.shields.io/badge/QuestMaster-AI%20Task%20Manager-blue?style=for-the-badge&logo=gamepad)
![Python](https://img.shields.io/badge/Python-3.8+-green?style=for-the-badge&logo=python)
![Flask](https://img.shields.io/badge/Flask-2.0+-red?style=for-the-badge&logo=flask)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--3.5--turbo-purple?style=for-the-badge&logo=openai)

## 🎮 Features

- **AI-Powered Quest Generation**: Transform any task into engaging, step-by-step quests using OpenAI's GPT-3.5-turbo
- **Gamified Interface**: Futuristic HUD design with glassmorphism effects and gaming aesthetics
- **Progress Tracking**: Visual progress bars and XP system with leveling mechanics
- **Smart Subtasks**: AI breaks down complex tasks into manageable, actionable steps
- **Difficulty Levels**: Easy, Medium, Hard, and Epic quest difficulties with appropriate rewards
- **Category System**: Organize quests by Work, Personal, Learning, Health, Creative, and Other
- **Real-time Updates**: Live progress tracking and instant quest completion notifications

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- OpenAI API key
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd task-manager
   ```

2. **Create virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   export OPENAI_API_KEY="your-openai-api-key-here"
   export FLASK_ENV="production"
   export SECRET_KEY="your-secret-key-here"
   ```

5. **Run the application**
   ```bash
   ./start.sh
   ```

6. **Access the app**
   - Local: `http://localhost:5001`
   - External: `http://your-server-ip:5001`

## 🎯 How to Use

1. **Create a Quest**: Enter your task description in the "New Quest" panel
2. **AI Generation**: The AI will analyze your task and generate a gamified quest with step-by-step subtasks
3. **Accept Quest**: Review the generated quest and accept it to add to your active quests
4. **Complete Steps**: Check off subtasks as you complete them
5. **Earn XP**: Gain experience points and level up as you complete quests
6. **Track Progress**: Monitor your overall progress and quest completion rates

## 🏗️ Architecture

### Backend (Flask)
- **app.py**: Main Flask application with AI integration
- **config.py**: Configuration management
- **Database**: SQLite for quest and user data storage
- **API Endpoints**: RESTful API for quest management

### Frontend (Vanilla JavaScript)
- **HUD Interface**: Gaming-inspired user interface
- **Real-time Updates**: Dynamic quest management
- **Responsive Design**: Works on desktop and mobile devices

### AI Integration
- **OpenAI GPT-3.5-turbo**: Quest generation and task breakdown
- **Fallback System**: Local quest generation when AI is unavailable
- **Smart Prompting**: Optimized prompts for better quest generation

## 📁 Project Structure

```
task-manager/
├── app.py                 # Main Flask application
├── config.py              # Configuration settings
├── requirements.txt       # Python dependencies
├── start.sh              # Startup script
├── questmaster.service   # Systemd service file
├── templates/
│   └── index.html        # Main HTML template
├── static/
│   ├── css/
│   │   └── hud.css       # Gaming HUD styles
│   └── js/
│       ├── hud.js        # Main HUD functionality
│       └── quest.js      # Quest management logic
├── data/                 # Database storage (auto-created)
└── venv/                 # Virtual environment
```

## 🔧 Configuration

### Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key for AI features
- `FLASK_ENV`: Environment mode (development/production)
- `SECRET_KEY`: Flask secret key for sessions
- `DATABASE_PATH`: Path to SQLite database file

### AI Configuration

The app uses OpenAI's GPT-3.5-turbo model for quest generation. Without an API key, it falls back to local quest generation with predefined templates.

## 🎨 Customization

### Styling
- Modify `static/css/hud.css` for visual customization
- Gaming theme uses purple gradients and glassmorphism effects
- Responsive design adapts to different screen sizes

### Quest Generation
- Update AI prompts in `app.py` for different quest styles
- Modify fallback quest templates for offline functionality
- Adjust difficulty multipliers and XP rewards

## 🚀 Deployment

### Production Setup

1. **Systemd Service**
   ```bash
   sudo cp questmaster.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable questmaster
   sudo systemctl start questmaster
   ```

2. **Reverse Proxy** (Optional)
   - Use Nginx or Apache for production deployment
   - Configure SSL certificates for HTTPS

3. **Environment Security**
   - Use environment variables for sensitive data
   - Configure firewall rules for port 5001

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for providing the GPT-3.5-turbo API
- Flask community for the excellent web framework
- FontAwesome for the gaming icons
- All contributors and users of QuestMaster

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/questmaster/issues) page
2. Create a new issue with detailed information
3. Include error logs and steps to reproduce

---

**Happy Questing! 🎮✨**

Transform your tasks into epic adventures with QuestMaster!