class Dashboard {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            this.redirect('/login.html');
            return;
        }

        try {
            const response = await fetch('/api/auth/user', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                this.redirect('/login.html');
                return;
            }

            this.currentUser = await response.json();
            this.renderUser();
            this.loadRepositories();
            this.bindEvents();
        } catch (error) {
            console.error('Dashboard error:', error);
            this.redirect('/login.html');
        }
    }

    renderUser() {
        document.getElementById('username-display').textContent = this.currentUser.username;
        document.getElementById('email-display').textContent = this.currentUser.email;
        document.getElementById('joined-display').textContent = new Date(this.currentUser.createdAt).toLocaleDateString();
    }

    async loadRepositories() {
        const token = localStorage.getItem('authToken');
        try {
            const response = await fetch('/api/repos', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Could not load repositories');
            }

            const repos = await response.json();
            document.getElementById('stat-repos').textContent = repos.length;

            const container = document.getElementById('repositories-list');
            if (!repos.length) {
                container.innerHTML = '<div class="loading-state"><p>No repositories yet. Create your first one!</p></div>';
                return;
            }

            container.innerHTML = repos.map(repo => `
                <div class="repository-card">
                    <h3>${this.escapeHtml(repo.name)}</h3>
                    <p>${this.escapeHtml(repo.description || 'No description')}</p>
                    <div class="repo-meta">
                        <span class="repo-meta-item">${repo.private ? '🔒 Private' : '🌐 Public'}</span>
                        <span class="repo-meta-item">${new Date(repo.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div class="repo-actions">
                        <button class="repo-clone-btn" onclick="dashboard.copyCloneCommand('${this.escapeHtml(repo.owner)}', '${this.escapeHtml(repo.name)}')">📋 Clone</button>
                        <button class="repo-delete-btn" onclick="dashboard.deleteRepository(${repo.id})">🗑️ Delete</button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error(error);
            document.getElementById('repositories-list').innerHTML = '<div class="loading-state"><p>Error loading repositories.</p></div>';
        }
    }

    bindEvents() {
        document.getElementById('newRepoBtn').addEventListener('click', (event) => {
            event.preventDefault();
            this.openModal();
        });
        document.getElementById('newRepoBtnFooter').addEventListener('click', (event) => {
            event.preventDefault();
            this.openModal();
        });
        document.getElementById('logoutBtn').addEventListener('click', async (event) => {
            event.preventDefault();
            await this.logout();
        });
        document.getElementById('settingsBtn').addEventListener('click', (event) => {
            event.preventDefault();
            alert('Settings coming soon');
        });

        const modal = document.getElementById('newRepoModal');
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelRepoBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('newRepoForm').addEventListener('submit', (event) => this.createRepository(event));

        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                this.closeModal();
            }
        });
    }

    openModal() {
        document.getElementById('newRepoModal').classList.add('active');
    }

    closeModal() {
        const modal = document.getElementById('newRepoModal');
        modal.classList.remove('active');
        document.getElementById('newRepoForm').reset();
    }

    async createRepository(event) {
        event.preventDefault();

        const name = document.getElementById('repoName').value.trim();
        const description = document.getElementById('repoDesc').value.trim();
        const isPrivate = document.getElementById('repoPrivate').checked;

        if (!name) {
            alert('Repository name is required');
            return;
        }

        const token = localStorage.getItem('authToken');
        try {
            const response = await fetch('/api/repos', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, description, private: isPrivate })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Could not create repository');
            }

            this.closeModal();
            this.loadRepositories();
        } catch (error) {
            console.error(error);
            alert(error.message || 'Failed to create repository');
        }
    }

    async deleteRepository(repoId) {
        if (!confirm('Delete this repository?')) {
            return;
        }

        const token = localStorage.getItem('authToken');
        try {
            const response = await fetch(`/api/repos/${repoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Could not delete repository');
            }

            this.loadRepositories();
        } catch (error) {
            console.error(error);
            alert('Repository could not be deleted');
        }
    }

    copyCloneCommand(owner, repoName) {
        const command = `git clone https://codegencc.web.app/${owner}/${repoName}.git`;
        navigator.clipboard.writeText(command)
            .then(() => alert('Clone command copied'))
            .catch(() => alert(command));
    }

    async logout() {
        const token = localStorage.getItem('authToken');
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error(error);
        } finally {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            this.redirect('/login.html');
        }
    }

    redirect(path) {
        window.location.href = path;
    }

    escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

const dashboard = new Dashboard();
