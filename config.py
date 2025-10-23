"""
Configuration file for QuestMaster
"""

import os

class Config:
    """Base configuration class"""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'questmaster-secret-key-2024')
    DATABASE_PATH = os.environ.get('DATABASE_PATH', './data/quests.db')
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    
class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    FLASK_ENV = 'development'

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    FLASK_ENV = 'production'

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
