const API_URL = 'http://localhost:3000/api';

class App {
    constructor() {
        this.appRef = document.getElementById('app');
        this.token = localStorage.getItem('trainer_app_token') || null;
        this.currentUser = JSON.parse(localStorage.getItem('trainer_app_user')) || null;
        this.workoutSheet = null;
        
        this.currentRoute = this.token ? 'dashboard' : 'login';
        this.currentParam = null;

        this.init();
    }

    async init() {
        // Event Delegation Global para Toggles
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('.video-btn');
            if (btn) {
                const id = btn.getAttribute('data-id');
                const wrapper = document.getElementById(`video-wrapper-${id}`);
                const iframe = document.getElementById(`iframe-${id}`);
                
                if (wrapper.classList.contains('active')) {
                    wrapper.classList.remove('active');
                    iframe.src = ''; // Para o vídeo
                    btn.innerHTML = '▶ Assistir Vídeo Execução';
                } else {
                    wrapper.classList.add('active');
                    let url = btn.getAttribute('data-url');
                    iframe.src = url || 'https://www.youtube.com/embed/dQw4w9WgXcQ'; // Fallback
                    btn.innerHTML = '▼ Fechar Vídeo';
                }
            }
        });

        if (this.token) {
            await this.loadMySheet();
        } else {
            this.render();
        }
    }

    async loadMySheet() {
        try {
            const res = await fetch(`${API_URL}/workouts/my-sheet`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (res.ok) {
                this.workoutSheet = await res.json();
                this.currentRoute = 'dashboard';
            } else {
                // Se for 404, significa que o usuário não tem ficha
                this.workoutSheet = null;
                this.currentRoute = 'dashboard'; 
            }
        } catch (e) {
            console.error(e);
            this.logout();
            return;
        }
        this.render();
    }

    async login(email, password) {
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha: password })
            });
            const data = await res.json();
            if (res.ok) {
                this.token = data.token;
                this.currentUser = data.user;
                localStorage.setItem('trainer_app_token', this.token);
                localStorage.setItem('trainer_app_user', JSON.stringify(this.currentUser));
                await this.loadMySheet();
            } else {
                alert(data.message || 'Erro ao logar');
            }
        } catch (e) {
            alert('Erro de conexão ao servidor.');
        }
    }

    async register(nome, email, password) {
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, senha: password })
            });
            const data = await res.json();
            if (res.ok) {
                this.token = data.token;
                this.currentUser = data.user;
                localStorage.setItem('trainer_app_token', this.token);
                localStorage.setItem('trainer_app_user', JSON.stringify(this.currentUser));
                await this.loadMySheet();
            } else {
                alert(data.message || 'Erro ao cadastrar');
            }
        } catch (e) {
            alert('Erro de conexão ao servidor.');
        }
    }

    logout() {
        this.token = null;
        this.currentUser = null;
        this.workoutSheet = null;
        localStorage.removeItem('trainer_app_token');
        localStorage.removeItem('trainer_app_user');
        this.currentRoute = 'login';
        this.render();
    }

    // --- Componentes ---

    renderHeader() {
        return `
            <nav class="top-nav">
                <h1>Painel de Treinos</h1>
                <div class="nav-buttons">
                    <button onclick="window.appStore.logout()">Sair</button>
                </div>
            </nav>
        `;
    }

    renderLogin() {
        return `
            <div class="login-screen">
                <div class="card login-card">
                    <h2>Corpo Conectado</h2>
                    <p>Acesse ou crie sua conta.</p>
                    <form onsubmit="event.preventDefault(); window.appStore.login(document.getElementById('email').value, document.getElementById('senha').value)">
                        <div class="form-group text-left">
                            <label>E-mail</label>
                            <input type="email" id="email" class="form-control" required placeholder="contato@exemplo.com">
                        </div>
                        <div class="form-group text-left">
                            <label>Senha</label>
                            <input type="password" id="senha" class="form-control" required placeholder="••••••••">
                        </div>
                        <button type="submit" class="btn btn-primary">Acessar Conta</button>
                    </form>
                    <div style="margin-top: 20px; text-align: center;">
                        <a href="#" onclick="event.preventDefault(); window.appStore.navigate('register')" style="color: var(--primary-light);">Ainda não tem conta? Crie aqui</a>
                    </div>
                </div>
            </div>
        `;
    }

    renderRegister() {
        return `
            <div class="login-screen">
                <div class="card login-card">
                    <h2>Criar Conta</h2>
                    <form onsubmit="event.preventDefault(); window.appStore.register(document.getElementById('nome').value, document.getElementById('email_reg').value, document.getElementById('senha_reg').value)">
                        <div class="form-group text-left">
                            <label>Nome Completo</label>
                            <input type="text" id="nome" class="form-control" required>
                        </div>
                        <div class="form-group text-left">
                            <label>E-mail</label>
                            <input type="email" id="email_reg" class="form-control" required>
                        </div>
                        <div class="form-group text-left">
                            <label>Senha</label>
                            <input type="password" id="senha_reg" class="form-control" required>
                        </div>
                        <button type="submit" class="btn btn-primary">Cadastrar</button>
                    </form>
                    <div style="margin-top: 20px; text-align: center;">
                        <a href="#" onclick="event.preventDefault(); window.appStore.navigate('login')" style="color: var(--primary-light);">Já possui conta? Acesse aqui</a>
                    </div>
                </div>
            </div>
        `;
    }

    renderDashboard() {
        const user = this.currentUser;
        
        let daysHtml = '';
        if (this.workoutSheet && this.workoutSheet.items) {
            // Agrupar itens por dia_treino
            const diasSet = {};
            this.workoutSheet.items.forEach(item => {
                if (!diasSet[item.dia_treino]) diasSet[item.dia_treino] = [];
                diasSet[item.dia_treino].push(item);
            });

            Object.keys(diasSet).sort().forEach(dia => {
                const countUtils = diasSet[dia].length;
                daysHtml += `
                    <div class="day-card" onclick="window.appStore.navigate('workout', '${dia}')">
                        <h3 style="font-size: 2rem; color: var(--primary-light);">${dia}</h3>
                        <p style="font-weight: 600; color: var(--text-main); font-size: 1.1rem; margin-top: 4px;">Treino de Hoje</p>
                        <p style="margin-top: 8px; font-weight: 500; font-size: 0.85rem; color: var(--accent)">${countUtils} exercícios</p>
                    </div>
                `;
            });
        }

        return `
            ${this.renderHeader()}
            <div class="container">
                <div class="card">
                    <h2 style="color: var(--primary-color); font-size: 1.5rem;">Olá, ${user.nome}!</h2>
                    <p style="color: var(--text-muted); margin-top: 8px;">Bem-vindo ao seu painel principal.</p>
                </div>
                
                ${this.workoutSheet ? `
                    <h2 style="margin: 32px 0 16px 0; color: var(--text-main); border-left: 4px solid var(--primary-color); padding-left: 12px;">Seus Treinos</h2>
                    <div class="dashboard-grid">
                        ${daysHtml.length > 0 ? daysHtml : '<p>Ficha vazia. Aguarde configuração.</p>'}
                    </div>
                ` : `
                    <div class="card" style="margin-top: 24px;">
                        <h3>Nenhuma ficha ativa</h3>
                        <p>No momento você não possui nenhum plano de treino ativo.</p>
                    </div>
                `}
            </div>
        `;
    }

    renderWorkout(dia) {
        if (!this.workoutSheet) return this.renderDashboard();
        
        const exercicios = this.workoutSheet.items.filter(i => i.dia_treino === dia);
        
        let exercisesHtml = '';
        exercicios.forEach(item => {
            const ex = item.exercicio;
            exercisesHtml += `
                <div class="exercise-item">
                    <div class="ex-header">
                        <div class="ex-title">${ex.nome}</div>
                        <div class="ex-muscle">${ex.grupo_muscular}</div>
                    </div>
                    <div class="ex-details">
                        <div>Séries: <strong>${item.series}</strong></div>
                        <div>Repetições: <strong>${item.repeticoes}</strong></div>
                    </div>
                    ${item.observacoes ? `<div class="ex-notes">⚠️ <strong>Observação:</strong> ${item.observacoes}</div>` : ''}
                    
                    <button class="video-btn" data-id="${item.id}" data-url="${item.link_video}">
                        ▶ Assistir Vídeo Execução
                    </button>
                    
                    <div class="video-wrapper" id="video-wrapper-${item.id}">
                        <iframe id="iframe-${item.id}" allowfullscreen></iframe>
                    </div>
                </div>
            `;
        });

        return `
            ${this.renderHeader()}
            <div class="container">
                <div class="workout-header">
                    <button class="back-btn" onclick="window.appStore.navigate('dashboard')">
                        <span style="font-size: 1.4rem;">←</span> Voltar
                    </button>
                    <div style="margin-top: 12px;">
                        <h2 style="color: var(--primary-color); font-size: 1.8rem; margin-bottom: 4px;">Treino ${dia}</h2>
                        <p style="color: var(--text-muted); font-size: 1rem;">Complete todas as séries com dedicação.</p>
                    </div>
                </div>
                
                <div style="margin-top: 24px;">
                    ${exercisesHtml}
                </div>
                
                <button class="btn btn-primary" style="margin-top: 20px;" onclick="window.appStore.navigate('dashboard')">Finalizar Treino 🎉</button>
                <div style="height: 40px;"></div>
            </div>
        `;
    }

    // --- Navegação ---
    navigate(route, param = null) {
        this.currentRoute = route;
        this.currentParam = param;
        this.render();
        window.scrollTo(0, 0);
    }

    render() {
        if (this.currentRoute === 'login') {
            this.appRef.innerHTML = this.renderLogin();
            return;
        }
        if (this.currentRoute === 'register') {
            this.appRef.innerHTML = this.renderRegister();
            return;
        }

        if (this.currentRoute === 'workout' && this.currentParam) {
            this.appRef.innerHTML = this.renderWorkout(this.currentParam);
        } else {
            this.appRef.innerHTML = this.renderDashboard();
        }
    }
}

window.appStore = new App();
