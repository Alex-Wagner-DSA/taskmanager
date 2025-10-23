// Quest Management JavaScript
class QuestManager {
    constructor() {
        this.quests = [];
        this.categories = ['work', 'personal', 'learning', 'health', 'creative', 'other'];
        this.difficulties = ['easy', 'medium', 'hard', 'epic'];
    }
    
    // Generate quest using AI (this would typically call a backend API)
    async generateQuest(taskData) {
        try {
            const response = await fetch('/api/generate-quest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(taskData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to generate quest');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error generating quest:', error);
            // Fallback to local generation if API fails
            return this.generateFallbackQuest(taskData);
        }
    }
    
    // Fallback quest generation (when AI API is unavailable)
    generateFallbackQuest(taskData) {
        const quest = {
            title: this.generateTitle(taskData.task),
            description: `Complete the task: ${taskData.task}`,
            category: taskData.category,
            difficulty: taskData.difficulty,
            dueDate: taskData.dueDate,
            subtasks: this.generateSubtasks(taskData.task, taskData.difficulty)
        };
        
        return quest;
    }
    
    generateTitle(task) {
        // Simple title generation based on task content
        const words = task.toLowerCase().split(' ');
        const keyWords = words.filter(word => 
            !['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word)
        );
        
        if (keyWords.length > 0) {
            const mainWord = keyWords[0];
            return `Quest: ${mainWord.charAt(0).toUpperCase() + mainWord.slice(1)} ${keyWords.slice(1, 3).join(' ')}`;
        }
        
        return `Quest: ${task.substring(0, 50)}${task.length > 50 ? '...' : ''}`;
    }
    
    generateSubtasks(task, difficulty) {
        const baseSubtasks = this.getBaseSubtasks(task);
        const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);
        
        // Generate additional subtasks based on difficulty
        const additionalSubtasks = [];
        for (let i = 0; i < difficultyMultiplier; i++) {
            additionalSubtasks.push(this.generateAdditionalSubtask(task, i));
        }
        
        return [...baseSubtasks, ...additionalSubtasks];
    }
    
    getBaseSubtasks(task) {
        const lowerTask = task.toLowerCase();
        
        // Common subtask patterns
        if (lowerTask.includes('build') || lowerTask.includes('create')) {
            return [
                'Plan and research the requirements',
                'Set up the development environment',
                'Create the initial structure',
                'Implement core functionality',
                'Test and debug the implementation',
                'Finalize and deploy'
            ];
        }
        
        if (lowerTask.includes('learn') || lowerTask.includes('study')) {
            return [
                'Research available resources and materials',
                'Create a study schedule',
                'Set up a dedicated learning environment',
                'Take notes and practice regularly',
                'Test your knowledge with exercises',
                'Review and reinforce learning'
            ];
        }
        
        if (lowerTask.includes('plan') || lowerTask.includes('organize')) {
            return [
                'Define the scope and objectives',
                'Break down into smaller components',
                'Set realistic timelines and milestones',
                'Assign responsibilities if needed',
                'Create a detailed action plan',
                'Review and adjust as needed'
            ];
        }
        
        if (lowerTask.includes('present') || lowerTask.includes('presentation')) {
            return [
                'Research and gather information',
                'Create an outline and structure',
                'Design visual aids and slides',
                'Practice the presentation multiple times',
                'Prepare for questions and feedback',
                'Deliver the final presentation'
            ];
        }
        
        // Generic subtasks for any task
        return [
            'Research and gather information',
            'Plan your approach',
            'Take the first steps',
            'Continue making progress',
            'Review and refine your work',
            'Complete and finalize'
        ];
    }
    
    generateAdditionalSubtask(task, index) {
        const additionalTasks = [
            'Document your progress',
            'Seek feedback from others',
            'Review and optimize your approach',
            'Prepare for potential obstacles',
            'Celebrate small victories along the way',
            'Reflect on lessons learned',
            'Update your plan based on new information',
            'Stay motivated and focused'
        ];
        
        return additionalTasks[index % additionalTasks.length];
    }
    
    getDifficultyMultiplier(difficulty) {
        const multipliers = {
            'easy': 0,
            'medium': 1,
            'hard': 2,
            'epic': 3
        };
        return multipliers[difficulty] || 0;
    }
    
    // Quest validation
    validateQuest(quest) {
        const errors = [];
        
        if (!quest.title || quest.title.trim().length === 0) {
            errors.push('Quest title is required');
        }
        
        if (!quest.description || quest.description.trim().length === 0) {
            errors.push('Quest description is required');
        }
        
        if (!this.categories.includes(quest.category)) {
            errors.push('Invalid quest category');
        }
        
        if (!this.difficulties.includes(quest.difficulty)) {
            errors.push('Invalid quest difficulty');
        }
        
        if (!quest.subtasks || quest.subtasks.length === 0) {
            errors.push('Quest must have at least one subtask');
        }
        
        return errors;
    }
    
    // Quest filtering and searching
    filterQuests(quests, filters) {
        return quests.filter(quest => {
            // Category filter
            if (filters.category && filters.category !== 'all' && quest.category !== filters.category) {
                return false;
            }
            
            // Difficulty filter
            if (filters.difficulty && filters.difficulty !== 'all' && quest.difficulty !== filters.difficulty) {
                return false;
            }
            
            // Status filter
            if (filters.status && filters.status !== 'all' && quest.status !== filters.status) {
                return false;
            }
            
            // Search term
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                const searchableText = `${quest.title} ${quest.description} ${quest.category} ${quest.difficulty}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }
            
            // Date range filter
            if (filters.startDate && quest.createdAt) {
                const questDate = new Date(quest.createdAt);
                const startDate = new Date(filters.startDate);
                if (questDate < startDate) {
                    return false;
                }
            }
            
            if (filters.endDate && quest.createdAt) {
                const questDate = new Date(quest.createdAt);
                const endDate = new Date(filters.endDate);
                if (questDate > endDate) {
                    return false;
                }
            }
            
            return true;
        });
    }
    
    // Quest statistics
    getQuestStats(quests) {
        const stats = {
            total: quests.length,
            active: 0,
            completed: 0,
            overdue: 0,
            byCategory: {},
            byDifficulty: {},
            averageProgress: 0,
            totalXP: 0
        };
        
        quests.forEach(quest => {
            // Status counts
            if (quest.status === 'active') stats.active++;
            if (quest.status === 'completed') {
                stats.completed++;
                stats.totalXP += this.getXPReward(quest.difficulty);
            }
            
            // Overdue check
            if (quest.status === 'active' && quest.dueDate) {
                const dueDate = new Date(quest.dueDate);
                const now = new Date();
                if (dueDate < now) {
                    stats.overdue++;
                }
            }
            
            // Category counts
            if (!stats.byCategory[quest.category]) {
                stats.byCategory[quest.category] = 0;
            }
            stats.byCategory[quest.category]++;
            
            // Difficulty counts
            if (!stats.byDifficulty[quest.difficulty]) {
                stats.byDifficulty[quest.difficulty] = 0;
            }
            stats.byDifficulty[quest.difficulty]++;
        });
        
        // Calculate average progress
        if (stats.active > 0) {
            const activeQuests = quests.filter(q => q.status === 'active');
            const totalProgress = activeQuests.reduce((sum, quest) => {
                return sum + this.calculateProgress(quest);
            }, 0);
            stats.averageProgress = Math.round(totalProgress / stats.active);
        }
        
        return stats;
    }
    
    calculateProgress(quest) {
        if (!quest.subtasks || quest.subtasks.length === 0) return 0;
        const completed = quest.subtasks.filter(st => st.completed).length;
        return Math.round((completed / quest.subtasks.length) * 100);
    }
    
    getXPReward(difficulty) {
        const rewards = {
            'easy': 10,
            'medium': 25,
            'hard': 50,
            'epic': 100
        };
        return rewards[difficulty] || 10;
    }
    
    // Quest export/import
    exportQuests(quests, format = 'json') {
        if (format === 'json') {
            return JSON.stringify(quests, null, 2);
        } else if (format === 'csv') {
            return this.exportToCSV(quests);
        }
        return '';
    }
    
    exportToCSV(quests) {
        const headers = ['Title', 'Description', 'Category', 'Difficulty', 'Status', 'Progress', 'Created', 'Due Date'];
        const rows = quests.map(quest => [
            quest.title,
            quest.description,
            quest.category,
            quest.difficulty,
            quest.status,
            `${this.calculateProgress(quest)}%`,
            new Date(quest.createdAt).toLocaleDateString(),
            quest.dueDate ? new Date(quest.dueDate).toLocaleDateString() : 'N/A'
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    importQuests(data, format = 'json') {
        try {
            let quests;
            if (format === 'json') {
                quests = JSON.parse(data);
            } else if (format === 'csv') {
                quests = this.importFromCSV(data);
            } else {
                throw new Error('Unsupported format');
            }
            
            // Validate imported quests
            const validQuests = quests.filter(quest => {
                const errors = this.validateQuest(quest);
                return errors.length === 0;
            });
            
            return validQuests;
        } catch (error) {
            console.error('Error importing quests:', error);
            return [];
        }
    }
    
    importFromCSV(data) {
        const lines = data.split('\n');
        const headers = lines[0].split(',');
        const quests = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length === headers.length) {
                const quest = {
                    title: values[0],
                    description: values[1],
                    category: values[2],
                    difficulty: values[3],
                    status: values[4],
                    subtasks: [], // CSV doesn't include subtasks
                    createdAt: new Date().toISOString()
                };
                quests.push(quest);
            }
        }
        
        return quests;
    }
}

// Initialize quest manager
window.questManager = new QuestManager();
