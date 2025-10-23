// HUD Interface JavaScript
class HUDManager {
    constructor() {
        this.playerStats = {
            level: 1,
            xp: 0,
            completedTasks: 0,
            activeTasks: 0
        };
        
        this.currentQuests = [];
        this.selectedQuest = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updatePlayerStats();
        this.loadQuestsFromStorage();
    }
    
    setupEventListeners() {
        // Form submission
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTaskSubmission();
        });
        
        // Modal controls
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });
        
        document.getElementById('cancelQuest').addEventListener('click', () => {
            this.closeModal();
        });
        
        document.getElementById('acceptQuest').addEventListener('click', () => {
            this.acceptQuest();
        });
        
        // Settings and help buttons
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showSettings();
        });
        
        document.getElementById('helpBtn').addEventListener('click', () => {
            this.showHelp();
        });
        
        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.refreshQuests();
        });
        
        // Close modal on outside click
        document.getElementById('questModal').addEventListener('click', (e) => {
            if (e.target.id === 'questModal') {
                this.closeModal();
            }
        });
    }
    
    async handleTaskSubmission() {
        const formData = {
            task: document.getElementById('taskInput').value,
            category: document.getElementById('category').value,
            difficulty: document.getElementById('difficulty').value,
            dueDate: document.getElementById('dueDate').value
        };
        
        if (!formData.task.trim()) {
            this.showNotification('Please enter a quest description!', 'error');
            return;
        }
        
        // Show loading overlay
        this.showLoadingOverlay();
        
        try {
            // Send to backend for AI processing
            const response = await fetch('/api/generate-quest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to generate quest');
            }
            
            const questData = await response.json();
            this.showGeneratedQuest(questData);
            
        } catch (error) {
            console.error('Error generating quest:', error);
            this.showNotification('Failed to generate quest. Please try again.', 'error');
        } finally {
            this.hideLoadingOverlay();
        }
    }
    
    showGeneratedQuest(questData) {
        const modal = document.getElementById('questModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        modalTitle.textContent = 'Quest Generated!';
        
        modalBody.innerHTML = `
            <div class="generated-quest">
                <div class="quest-header">
                    <h3>${questData.title}</h3>
                    <div class="quest-meta">
                        <span class="quest-category">${questData.category}</span>
                        <span class="quest-difficulty ${questData.difficulty}">${questData.difficulty}</span>
                    </div>
                </div>
                <div class="quest-description">
                    ${questData.description}
                </div>
                <div class="quest-subtasks">
                    <h4><i class="fas fa-tasks"></i> Quest Steps</h4>
                    <ul>
                        ${questData.subtasks.map(subtask => 
                            `<li><i class="fas fa-play"></i> ${typeof subtask === 'string' ? subtask : subtask.text}</li>`
                        ).join('')}
                    </ul>
                </div>
                ${questData.dueDate ? `<div class="quest-due"><i class="fas fa-calendar-alt"></i> Due: ${new Date(questData.dueDate).toLocaleDateString()}</div>` : ''}
            </div>
        `;
        
        // Store quest data for acceptance
        this.pendingQuest = questData;
        
        modal.classList.add('active');
    }
    
    acceptQuest() {
        if (!this.pendingQuest) return;
        
        // Create quest object
        const quest = {
            id: Date.now().toString(),
            title: this.pendingQuest.title,
            description: this.pendingQuest.description,
            category: this.pendingQuest.category,
            difficulty: this.pendingQuest.difficulty,
            dueDate: this.pendingQuest.dueDate,
            subtasks: this.pendingQuest.subtasks.map((subtask, index) => ({
                id: typeof subtask === 'string' ? index : subtask.id,
                text: typeof subtask === 'string' ? subtask : subtask.text,
                completed: typeof subtask === 'string' ? false : subtask.completed
            })),
            createdAt: new Date().toISOString(),
            status: 'active'
        };
        
        // Add to current quests
        this.currentQuests.push(quest);
        this.playerStats.activeTasks++;
        
        // Update UI
        this.updateActiveQuests();
        this.updatePlayerStats();
        this.saveQuestsToStorage();
        
        // Close modal and clear form
        this.closeModal();
        this.clearForm();
        
        this.showNotification('Quest accepted! Good luck, adventurer!', 'success');
    }
    
    updateActiveQuests() {
        const container = document.getElementById('activeQuests');
        
        if (this.currentQuests.length === 0) {
            container.innerHTML = `
                <div class="no-quests">
                    <i class="fas fa-search"></i>
                    <p>No active quests. Create your first quest to begin!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.currentQuests.map(quest => `
            <div class="quest-card" data-quest-id="${quest.id}" onclick="hudManager.selectQuest('${quest.id}')">
                <div class="quest-header">
                    <div class="quest-title">${quest.title}</div>
                    <div class="quest-meta">
                        <span class="quest-category">${quest.category}</span>
                        <span class="quest-difficulty ${quest.difficulty}">${quest.difficulty}</span>
                    </div>
                </div>
                <div class="quest-description">${quest.description}</div>
                <div class="quest-progress">
                    <div class="progress-bar-mini">
                        <div class="progress-fill-mini" style="width: ${this.calculateQuestProgress(quest)}%"></div>
                    </div>
                    <div class="progress-text-mini">${this.calculateQuestProgress(quest)}% Complete</div>
                </div>
                <div class="quest-subtasks">
                    ${quest.subtasks.slice(0, 3).map(subtask => `
                        <div class="subtask-item">
                            <input type="checkbox" class="subtask-checkbox" 
                                   ${subtask.completed ? 'checked' : ''} 
                                   onchange="hudManager.toggleSubtask('${quest.id}', ${subtask.id})">
                            <span class="subtask-text ${subtask.completed ? 'completed' : ''}">${subtask.text}</span>
                        </div>
                    `).join('')}
                    ${quest.subtasks.length > 3 ? `<div class="more-subtasks">+${quest.subtasks.length - 3} more tasks</div>` : ''}
                </div>
            </div>
        `).join('');
    }
    
    selectQuest(questId) {
        // Remove previous selection
        document.querySelectorAll('.quest-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Add selection to clicked quest
        const questCard = document.querySelector(`[data-quest-id="${questId}"]`);
        if (questCard) {
            questCard.classList.add('selected');
        }
        
        // Update quest details
        const quest = this.currentQuests.find(q => q.id === questId);
        if (quest) {
            this.selectedQuest = quest;
            this.updateQuestDetails(quest);
        }
    }
    
    updateQuestDetails(quest) {
        const container = document.getElementById('questDetails');
        
        if (!quest) {
            container.innerHTML = `
                <div class="no-selection">
                    <i class="fas fa-hand-pointer"></i>
                    <p>Select a quest to view details</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="quest-details">
                <div class="detail-header">
                    <h3>${quest.title}</h3>
                    <div class="quest-meta">
                        <span class="quest-category">${quest.category}</span>
                        <span class="quest-difficulty ${quest.difficulty}">${quest.difficulty}</span>
                    </div>
                </div>
                <div class="detail-description">
                    ${quest.description}
                </div>
                <div class="detail-progress">
                    <h4><i class="fas fa-chart-line"></i> Progress</h4>
                    <div class="progress-bar-mini">
                        <div class="progress-fill-mini" style="width: ${this.calculateQuestProgress(quest)}%"></div>
                    </div>
                    <div class="progress-text-mini">${this.calculateQuestProgress(quest)}% Complete</div>
                </div>
                <div class="detail-subtasks">
                    <h4><i class="fas fa-list"></i> All Subtasks</h4>
                    ${quest.subtasks.map(subtask => `
                        <div class="subtask-item">
                            <input type="checkbox" class="subtask-checkbox" 
                                   ${subtask.completed ? 'checked' : ''} 
                                   onchange="hudManager.toggleSubtask('${quest.id}', ${subtask.id})">
                            <span class="subtask-text ${subtask.completed ? 'completed' : ''}">${subtask.text}</span>
                        </div>
                    `).join('')}
                </div>
                ${quest.dueDate ? `
                    <div class="detail-due">
                        <h4><i class="fas fa-calendar"></i> Due Date</h4>
                        <p>${new Date(quest.dueDate).toLocaleDateString()}</p>
                    </div>
                ` : ''}
                <div class="detail-actions">
                    <button class="quest-btn secondary" onclick="hudManager.completeQuest('${quest.id}')">
                        <i class="fas fa-check"></i> Complete Quest
                    </button>
                    <button class="quest-btn secondary" onclick="hudManager.deleteQuest('${quest.id}')">
                        <i class="fas fa-trash"></i> Delete Quest
                    </button>
                </div>
            </div>
        `;
    }
    
    toggleSubtask(questId, subtaskId) {
        const quest = this.currentQuests.find(q => q.id === questId);
        if (!quest) return;
        
        const subtask = quest.subtasks.find(st => st.id === subtaskId);
        if (!subtask) return;
        
        subtask.completed = !subtask.completed;
        
        // Update quest progress
        this.updateActiveQuests();
        if (this.selectedQuest && this.selectedQuest.id === questId) {
            this.updateQuestDetails(quest);
        }
        
        // Check if quest is complete
        const allCompleted = quest.subtasks.every(st => st.completed);
        if (allCompleted && quest.status === 'active') {
            this.showNotification('Quest completed! Well done!', 'success');
            // Auto-complete quest
            setTimeout(() => {
                this.completeQuest(questId);
            }, 1000);
        }
        
        this.saveQuestsToStorage();
        this.updateOverallProgress();
    }
    
    completeQuest(questId) {
        const questIndex = this.currentQuests.findIndex(q => q.id === questId);
        if (questIndex === -1) return;
        
        const quest = this.currentQuests[questIndex];
        quest.status = 'completed';
        quest.completedAt = new Date().toISOString();
        
        // Award XP based on difficulty
        const xpReward = this.getXPReward(quest.difficulty);
        this.playerStats.xp += xpReward;
        this.playerStats.completedTasks++;
        this.playerStats.activeTasks--;
        
        // Check for level up
        this.checkLevelUp();
        
        // Remove from active quests
        this.currentQuests.splice(questIndex, 1);
        
        // Clear selection if this was the selected quest
        if (this.selectedQuest && this.selectedQuest.id === questId) {
            this.selectedQuest = null;
            // Remove selection styling from any quest cards
            document.querySelectorAll('.quest-card').forEach(card => {
                card.classList.remove('selected');
            });
        }
        
        // Update UI
        this.updateActiveQuests();
        this.updatePlayerStats();
        this.updateQuestDetails(null);
        this.saveQuestsToStorage();
        this.updateOverallProgress();
        
        this.showNotification(`Quest completed! +${xpReward} XP earned!`, 'success');
    }
    
    deleteQuest(questId) {
        if (!confirm('Are you sure you want to delete this quest?')) return;
        
        const questIndex = this.currentQuests.findIndex(q => q.id === questId);
        if (questIndex === -1) return;
        
        this.currentQuests.splice(questIndex, 1);
        this.playerStats.activeTasks--;
        
        // Clear selection if this was the selected quest
        if (this.selectedQuest && this.selectedQuest.id === questId) {
            this.selectedQuest = null;
            // Remove selection styling from any quest cards
            document.querySelectorAll('.quest-card').forEach(card => {
                card.classList.remove('selected');
            });
        }
        
        this.updateActiveQuests();
        this.updatePlayerStats();
        this.updateQuestDetails(null);
        this.saveQuestsToStorage();
        this.updateOverallProgress();
        
        this.showNotification('Quest deleted.', 'info');
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
    
    checkLevelUp() {
        const xpNeeded = this.playerStats.level * 100;
        if (this.playerStats.xp >= xpNeeded) {
            this.playerStats.level++;
            this.playerStats.xp -= xpNeeded;
            this.showNotification(`Level Up! You are now level ${this.playerStats.level}!`, 'success');
        }
    }
    
    calculateQuestProgress(quest) {
        if (!quest.subtasks || quest.subtasks.length === 0) return 0;
        const completed = quest.subtasks.filter(st => st.completed).length;
        return Math.round((completed / quest.subtasks.length) * 100);
    }
    
    updateOverallProgress() {
        if (this.currentQuests.length === 0) {
            document.getElementById('overallProgress').style.width = '100%';
            document.getElementById('progressText').textContent = '100%';
            return;
        }
        
        const totalProgress = this.currentQuests.reduce((sum, quest) => {
            return sum + this.calculateQuestProgress(quest);
        }, 0);
        
        const averageProgress = Math.round(totalProgress / this.currentQuests.length);
        document.getElementById('overallProgress').style.width = `${averageProgress}%`;
        document.getElementById('progressText').textContent = `${averageProgress}%`;
    }
    
    updatePlayerStats() {
        document.getElementById('playerLevel').textContent = this.playerStats.level;
        document.getElementById('playerXP').textContent = this.playerStats.xp;
        document.getElementById('completedTasks').textContent = this.playerStats.completedTasks;
        document.getElementById('activeTasks').textContent = this.playerStats.activeTasks;
    }
    
    clearForm() {
        document.getElementById('taskForm').reset();
    }
    
    closeModal() {
        document.getElementById('questModal').classList.remove('active');
        this.pendingQuest = null;
    }
    
    showLoadingOverlay() {
        document.getElementById('loadingOverlay').classList.add('active');
    }
    
    hideLoadingOverlay() {
        document.getElementById('loadingOverlay').classList.remove('active');
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    showSettings() {
        this.showNotification('Settings panel coming soon!', 'info');
    }
    
    showHelp() {
        this.showNotification('Help documentation coming soon!', 'info');
    }
    
    refreshQuests() {
        this.updateActiveQuests();
        this.updateOverallProgress();
        this.showNotification('Quests refreshed!', 'info');
    }
    
    saveQuestsToStorage() {
        localStorage.setItem('questMaster_quests', JSON.stringify(this.currentQuests));
        localStorage.setItem('questMaster_stats', JSON.stringify(this.playerStats));
    }
    
    loadQuestsFromStorage() {
        const savedQuests = localStorage.getItem('questMaster_quests');
        const savedStats = localStorage.getItem('questMaster_stats');
        
        if (savedQuests) {
            this.currentQuests = JSON.parse(savedQuests);
        }
        
        if (savedStats) {
            this.playerStats = { ...this.playerStats, ...JSON.parse(savedStats) };
        }
        
        this.updateActiveQuests();
        this.updatePlayerStats();
        this.updateOverallProgress();
    }
}

// Initialize HUD when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.hudManager = new HUDManager();
});

// Add notification styles
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, rgba(0, 255, 136, 0.9) 0%, rgba(0, 204, 106, 0.9) 100%);
        color: #000;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0, 255, 136, 0.4);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        z-index: 1001;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 600;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification.error {
        background: linear-gradient(135deg, rgba(244, 67, 54, 0.9) 0%, rgba(183, 28, 28, 0.9) 100%);
        color: #fff;
        box-shadow: 0 5px 15px rgba(244, 67, 54, 0.4);
    }
    
    .notification.info {
        background: linear-gradient(135deg, rgba(33, 150, 243, 0.9) 0%, rgba(25, 118, 210, 0.9) 100%);
        color: #fff;
        box-shadow: 0 5px 15px rgba(33, 150, 243, 0.4);
    }
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);
