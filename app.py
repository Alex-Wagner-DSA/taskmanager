#!/usr/bin/env python3
"""
QuestMaster - AI-Powered Gamified Task Manager
Flask Backend with AI Integration
"""

import os
import json
import sqlite3
from datetime import datetime, timedelta
from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
import openai
from typing import List, Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'questmaster-secret-key-2024')
CORS(app)

# OpenAI Configuration
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY
else:
    logger.warning("OpenAI API key not found. AI features will use fallback generation.")

# Database Configuration
DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'data', 'quests.db')

class QuestDatabase:
    """SQLite database manager for quests"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the database with required tables"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Quests table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS quests (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    category TEXT NOT NULL,
                    difficulty TEXT NOT NULL,
                    status TEXT DEFAULT 'active',
                    due_date TEXT,
                    created_at TEXT NOT NULL,
                    completed_at TEXT,
                    subtasks TEXT,
                    user_id TEXT DEFAULT 'default'
                )
            ''')
            
            # Subtasks table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS subtasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    quest_id TEXT NOT NULL,
                    text TEXT NOT NULL,
                    completed BOOLEAN DEFAULT FALSE,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (quest_id) REFERENCES quests (id)
                )
            ''')
            
            # User stats table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user_stats (
                    user_id TEXT PRIMARY KEY,
                    level INTEGER DEFAULT 1,
                    xp INTEGER DEFAULT 0,
                    completed_quests INTEGER DEFAULT 0,
                    active_quests INTEGER DEFAULT 0,
                    last_updated TEXT NOT NULL
                )
            ''')
            
            conn.commit()
    
    def create_quest(self, quest_data: Dict[str, Any]) -> str:
        """Create a new quest in the database"""
        quest_id = quest_data.get('id', f"quest_{datetime.now().timestamp()}")
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Insert quest
            cursor.execute('''
                INSERT INTO quests (id, title, description, category, difficulty, 
                                  status, due_date, created_at, subtasks)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                quest_id,
                quest_data['title'],
                quest_data['description'],
                quest_data['category'],
                quest_data['difficulty'],
                quest_data.get('status', 'active'),
                quest_data.get('due_date'),
                quest_data.get('created_at', datetime.now().isoformat()),
                json.dumps(quest_data.get('subtasks', []))
            ))
            
            # Insert subtasks
            for subtask in quest_data.get('subtasks', []):
                cursor.execute('''
                    INSERT INTO subtasks (quest_id, text, completed, created_at)
                    VALUES (?, ?, ?, ?)
                ''', (
                    quest_id,
                    subtask.get('text', ''),
                    subtask.get('completed', False),
                    datetime.now().isoformat()
                ))
            
            conn.commit()
        
        return quest_id
    
    def get_quests(self, user_id: str = 'default', status: str = None) -> List[Dict[str, Any]]:
        """Retrieve quests from the database"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            query = 'SELECT * FROM quests WHERE user_id = ?'
            params = [user_id]
            
            if status:
                query += ' AND status = ?'
                params.append(status)
            
            query += ' ORDER BY created_at DESC'
            
            cursor.execute(query, params)
            quests = []
            
            for row in cursor.fetchall():
                quest = dict(row)
                quest['subtasks'] = json.loads(quest['subtasks'] or '[]')
                quests.append(quest)
            
            return quests
    
    def update_quest(self, quest_id: str, updates: Dict[str, Any]) -> bool:
        """Update a quest in the database"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            set_clause = ', '.join([f"{key} = ?" for key in updates.keys()])
            values = list(updates.values()) + [quest_id]
            
            cursor.execute(f'UPDATE quests SET {set_clause} WHERE id = ?', values)
            conn.commit()
            
            return cursor.rowcount > 0
    
    def delete_quest(self, quest_id: str) -> bool:
        """Delete a quest from the database"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('DELETE FROM subtasks WHERE quest_id = ?', (quest_id,))
            cursor.execute('DELETE FROM quests WHERE id = ?', (quest_id,))
            conn.commit()
            
            return cursor.rowcount > 0
    
    def get_user_stats(self, user_id: str = 'default') -> Dict[str, Any]:
        """Get user statistics"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM user_stats WHERE user_id = ?', (user_id,))
            row = cursor.fetchone()
            
            if row:
                return dict(row)
            else:
                # Create default stats
                default_stats = {
                    'user_id': user_id,
                    'level': 1,
                    'xp': 0,
                    'completed_quests': 0,
                    'active_quests': 0,
                    'last_updated': datetime.now().isoformat()
                }
                
                cursor.execute('''
                    INSERT INTO user_stats (user_id, level, xp, completed_quests, 
                                          active_quests, last_updated)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', tuple(default_stats.values()))
                
                conn.commit()
                return default_stats
    
    def update_user_stats(self, user_id: str, stats: Dict[str, Any]) -> bool:
        """Update user statistics"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            stats['last_updated'] = datetime.now().isoformat()
            set_clause = ', '.join([f"{key} = ?" for key in stats.keys()])
            values = list(stats.values()) + [user_id]
            
            cursor.execute(f'UPDATE user_stats SET {set_clause} WHERE user_id = ?', values)
            conn.commit()
            
            return cursor.rowcount > 0

# Initialize database
db = QuestDatabase(DATABASE_PATH)

class AIQuestGenerator:
    """AI-powered quest generation using OpenAI API"""
    
    def __init__(self):
        self.api_key = OPENAI_API_KEY
        self.available = bool(self.api_key)
    
    def generate_quest(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a quest using AI"""
        if not self.available:
            return self._generate_fallback_quest(task_data)
        
        try:
            prompt = self._create_prompt(task_data)
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that breaks down tasks into manageable subtasks for a gamified productivity app. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            content = response.choices[0].message.content.strip()
            
            # Try to parse JSON response
            try:
                quest_data = json.loads(content)
                return self._validate_and_format_quest(quest_data, task_data)
            except json.JSONDecodeError:
                logger.warning("AI returned invalid JSON, using fallback")
                return self._generate_fallback_quest(task_data)
                
        except Exception as e:
            logger.error(f"AI generation failed: {e}")
            return self._generate_fallback_quest(task_data)
    
    def _create_prompt(self, task_data: Dict[str, Any]) -> str:
        """Create a prompt for AI quest generation"""
        return f"""
        Create a gamified quest for the following task:
        
        Task: {task_data['task']}
        Category: {task_data['category']}
        Difficulty: {task_data['difficulty']}
        Due Date: {task_data.get('due_date', 'Not specified')}
        
        Please return a JSON object with the following structure:
        {{
            "title": "A catchy quest title (max 60 characters)",
            "description": "A brief description of the quest",
            "subtasks": [
                "Step 1: First actionable step to complete the task",
                "Step 2: Second actionable step to complete the task", 
                "Step 3: Third actionable step to complete the task",
                "Step 4: Fourth actionable step to complete the task",
                "Step 5: Fifth actionable step to complete the task"
            ]
        }}
        
        Requirements:
        - Make the title engaging and game-like
        - Create 4-6 specific, actionable subtasks that break down the main task into clear steps
        - Each subtask should be a single, clear action that moves you closer to completing the main task
        - Subtasks should be ordered logically from first to last
        - CRITICAL: Each subtask MUST start with "Step 1:", "Step 2:", "Step 3:", etc. - this is mandatory
        - Make it fun and motivating while being practical
        - Focus on concrete actions, not vague concepts
        - Example format: "Step 1: Research the topic thoroughly"
        """
    
    def _validate_and_format_quest(self, ai_response: Dict[str, Any], original_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and format AI response"""
        quest = {
            'title': ai_response.get('title', f"Quest: {original_data['task'][:50]}"),
            'description': ai_response.get('description', original_data['task']),
            'category': original_data['category'],
            'difficulty': original_data['difficulty'],
            'due_date': original_data.get('due_date'),
            'subtasks': []
        }
        
        # Process subtasks
        for i, subtask_text in enumerate(ai_response.get('subtasks', [])):
            # Ensure subtask has step number if missing
            step_prefix = f"Step {i+1}:"
            number_prefix = f"{i+1}."
            
            # Check if it already has step formatting
            if subtask_text.startswith(step_prefix) or subtask_text.startswith(number_prefix):
                formatted_text = subtask_text
            else:
                formatted_text = f"{step_prefix} {subtask_text}"
                
            quest['subtasks'].append({
                'id': i,
                'text': formatted_text,
                'completed': False
            })
        
        return quest
    
    def _generate_fallback_quest(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a fallback quest when AI is unavailable"""
        task = task_data['task']
        difficulty = task_data['difficulty']
        
        # Generate title
        words = task.lower().split()
        key_words = [w for w in words if len(w) > 3 and w not in ['the', 'and', 'for', 'with']]
        title = f"Quest: {key_words[0].capitalize() if key_words else task[:30]}"
        
        # Generate subtasks based on task type
        subtasks = self._generate_subtasks_by_type(task, difficulty)
        
        return {
            'title': title,
            'description': f"Complete the task: {task}",
            'category': task_data['category'],
            'difficulty': difficulty,
            'due_date': task_data.get('due_date'),
            'subtasks': subtasks
        }
    
    def _generate_subtasks_by_type(self, task: str, difficulty: str) -> List[Dict[str, Any]]:
        """Generate subtasks based on task type and difficulty"""
        task_lower = task.lower()
        base_subtasks = []
        
        # Determine base subtasks based on keywords
        if any(word in task_lower for word in ['build', 'create', 'make', 'develop']):
            base_subtasks = [
                "Step 1: Research and plan the requirements",
                "Step 2: Set up the necessary tools and environment",
                "Step 3: Create the initial structure or foundation",
                "Step 4: Implement the core functionality",
                "Step 5: Test and debug the implementation",
                "Step 6: Finalize and polish the result"
            ]
        elif any(word in task_lower for word in ['learn', 'study', 'understand']):
            base_subtasks = [
                "Step 1: Find reliable learning resources",
                "Step 2: Create a structured study plan",
                "Step 3: Set aside dedicated learning time",
                "Step 4: Take notes and practice regularly",
                "Step 5: Test your understanding with exercises",
                "Step 6: Apply what you've learned"
            ]
        elif any(word in task_lower for word in ['plan', 'organize', 'prepare']):
            base_subtasks = [
                "Step 1: Define the scope and objectives",
                "Step 2: Break down into manageable components",
                "Step 3: Set realistic timelines and milestones",
                "Step 4: Identify required resources",
                "Step 5: Create a detailed action plan",
                "Step 6: Review and adjust the plan as needed"
            ]
        elif any(word in task_lower for word in ['write', 'document', 'report']):
            base_subtasks = [
                "Step 1: Research and gather information",
                "Step 2: Create an outline and structure",
                "Step 3: Write the first draft",
                "Step 4: Review and revise the content",
                "Step 5: Proofread and edit for clarity",
                "Step 6: Finalize and format the document"
            ]
        elif any(word in task_lower for word in ['present', 'presentation', 'speak']):
            base_subtasks = [
                "Step 1: Research and gather information",
                "Step 2: Create an outline and structure",
                "Step 3: Design visual aids and slides",
                "Step 4: Practice the presentation multiple times",
                "Step 5: Prepare for questions and feedback",
                "Step 6: Deliver the final presentation"
            ]
        else:
            base_subtasks = [
                "Step 1: Research and gather information",
                "Step 2: Plan your approach and strategy",
                "Step 3: Take the first concrete steps",
                "Step 4: Continue making steady progress",
                "Step 5: Review and refine your work",
                "Step 6: Complete and finalize the task"
            ]
        
        # Adjust based on difficulty
        difficulty_multipliers = {
            'easy': 1,
            'medium': 1.2,
            'hard': 1.5,
            'epic': 2
        }
        
        multiplier = difficulty_multipliers.get(difficulty, 1)
        num_subtasks = min(8, max(4, int(len(base_subtasks) * multiplier)))
        
        return [
            {
                'id': i,
                'text': base_subtasks[i % len(base_subtasks)],
                'completed': False
            }
            for i in range(num_subtasks)
        ]

# Initialize AI generator
ai_generator = AIQuestGenerator()

@app.route('/')
def index():
    """Main application page"""
    return render_template('index.html')

@app.route('/api/generate-quest', methods=['POST'])
def generate_quest():
    """Generate a new quest using AI"""
    try:
        data = request.get_json()
        
        # Validate input
        required_fields = ['task', 'category', 'difficulty']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Generate quest using AI
        quest_data = ai_generator.generate_quest(data)
        
        return jsonify(quest_data)
        
    except Exception as e:
        logger.error(f"Error generating quest: {e}")
        return jsonify({'error': 'Failed to generate quest'}), 500

@app.route('/api/quests', methods=['GET'])
def get_quests():
    """Get all quests for a user"""
    try:
        user_id = request.args.get('user_id', 'default')
        status = request.args.get('status')
        
        quests = db.get_quests(user_id, status)
        return jsonify(quests)
        
    except Exception as e:
        logger.error(f"Error getting quests: {e}")
        return jsonify({'error': 'Failed to retrieve quests'}), 500

@app.route('/api/quests', methods=['POST'])
def create_quest():
    """Create a new quest"""
    try:
        quest_data = request.get_json()
        
        # Add metadata
        quest_data['id'] = f"quest_{datetime.now().timestamp()}"
        quest_data['created_at'] = datetime.now().isoformat()
        quest_data['status'] = 'active'
        
        # Create quest in database
        quest_id = db.create_quest(quest_data)
        
        return jsonify({'id': quest_id, 'message': 'Quest created successfully'})
        
    except Exception as e:
        logger.error(f"Error creating quest: {e}")
        return jsonify({'error': 'Failed to create quest'}), 500

@app.route('/api/quests/<quest_id>', methods=['PUT'])
def update_quest(quest_id):
    """Update an existing quest"""
    try:
        updates = request.get_json()
        
        # Handle subtasks separately if needed
        if 'subtasks' in updates:
            updates['subtasks'] = json.dumps(updates['subtasks'])
        
        success = db.update_quest(quest_id, updates)
        
        if success:
            return jsonify({'message': 'Quest updated successfully'})
        else:
            return jsonify({'error': 'Quest not found'}), 404
            
    except Exception as e:
        logger.error(f"Error updating quest: {e}")
        return jsonify({'error': 'Failed to update quest'}), 500

@app.route('/api/quests/<quest_id>', methods=['DELETE'])
def delete_quest(quest_id):
    """Delete a quest"""
    try:
        success = db.delete_quest(quest_id)
        
        if success:
            return jsonify({'message': 'Quest deleted successfully'})
        else:
            return jsonify({'error': 'Quest not found'}), 404
            
    except Exception as e:
        logger.error(f"Error deleting quest: {e}")
        return jsonify({'error': 'Failed to delete quest'}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get user statistics"""
    try:
        user_id = request.args.get('user_id', 'default')
        stats = db.get_user_stats(user_id)
        return jsonify(stats)
        
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        return jsonify({'error': 'Failed to retrieve stats'}), 500

@app.route('/api/stats', methods=['PUT'])
def update_stats():
    """Update user statistics"""
    try:
        user_id = request.args.get('user_id', 'default')
        stats = request.get_json()
        
        success = db.update_user_stats(user_id, stats)
        
        if success:
            return jsonify({'message': 'Stats updated successfully'})
        else:
            return jsonify({'error': 'Failed to update stats'}), 500
            
    except Exception as e:
        logger.error(f"Error updating stats: {e}")
        return jsonify({'error': 'Failed to update stats'}), 500

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'ai_available': ai_generator.available,
        'database_connected': os.path.exists(DATABASE_PATH)
    })

if __name__ == '__main__':
    # Check if running in production
    debug_mode = os.environ.get('FLASK_ENV') != 'production'
    
    app.run(
        host='0.0.0.0',
        port=5001,  # Using port 5001 to avoid conflict with existing Flask app
        debug=debug_mode
    )
