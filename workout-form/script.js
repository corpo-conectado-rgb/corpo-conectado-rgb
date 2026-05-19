document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticação
    const token = localStorage.getItem('trainer_app_token');
    if (!token) {
        alert('Você precisa estar logado para preencher o formulário!');
        window.location.href = '../workout-viewer/index.html'; // Redireciona para o login
        return;
    }
    const form = document.getElementById('workout-form');
    const sections = document.querySelectorAll('.form-section');
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const btnSubmit = document.getElementById('btn-submit');
    const progressBar = document.getElementById('progress');

    let currentSectionIndex = 0;

    // Atualiza a interface (botões e barra de progresso)
    function updateUI() {
        sections.forEach((sec, index) => {
            if (index === currentSectionIndex) {
                sec.classList.add('active');
            } else {
                sec.classList.remove('active');
            }
        });

        // Botão Anterior
        btnPrev.disabled = currentSectionIndex === 0;

        // Trocar entre Próximo e Enviar
        if (currentSectionIndex === sections.length - 1) {
            btnNext.style.display = 'none';
            btnSubmit.style.display = 'block';
        } else {
            btnNext.style.display = 'block';
            btnSubmit.style.display = 'none';
        }

        // Atualizar barra de progresso
        const progressPercent = ((currentSectionIndex + 1) / sections.length) * 100;
        progressBar.style.width = `${progressPercent}%`;
    }
    
    // Busca e preenchimento automático por CEP (ViaCEP)
    const cepInput = document.getElementById('cep');
    if (cepInput) {
        cepInput.addEventListener('blur', async (e) => {
            let cepValue = e.target.value.replace(/\D/g, ''); // Remove não numéricos
            if (cepValue.length === 8) {
                try {
                    const response = await fetch(`https://viacep.com.br/ws/${cepValue}/json/`);
                    const data = await response.json();
                    
                    if (!data.erro) {
                        // Preenche os campos
                        const ruaInput = document.getElementById('rua');
                        const bairroInput = document.getElementById('bairro');
                        const cidadeInput = document.getElementById('cidade');
                        const ufInput = document.getElementById('uf');
                        const numeroInput = document.getElementById('numero-end');

                        if (ruaInput) { ruaInput.value = data.logradouro; ruaInput.style.borderColor = ''; }
                        if (bairroInput) { bairroInput.value = data.bairro; bairroInput.style.borderColor = ''; }
                        if (cidadeInput) { cidadeInput.value = data.localidade; cidadeInput.style.borderColor = ''; }
                        if (ufInput) { ufInput.value = data.uf; ufInput.style.borderColor = ''; }
                        
                        // Foca no número automaticamente
                        if (numeroInput) numeroInput.focus();
                    }
                } catch (err) {
                    console.error('Erro ao buscar CEP:', err);
                }
            }
        });
        
        // Formatar CEP dinamicamente
        cepInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            if (val.length > 5) {
                val = val.replace(/^(\d{5})(\d)/, '$1-$2');
            }
            e.target.value = val;
        });
    }

    // Validação simples da seção atual (apenas required)
    function validateSection() {
        const currentSection = sections[currentSectionIndex];
        const inputs = currentSection.querySelectorAll('input[required], select[required]');
        
        let isValid = true;
        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.style.borderColor = 'var(--error-color)';
            } else {
                input.style.borderColor = '';
            }
        });

        // Seção 3: Validar se pelo menos um checkbox de dia está marcado
        if (currentSection.id === 'section-3') {
            const checkboxes = currentSection.querySelectorAll('input[name="dias"]');
            const isChecked = Array.from(checkboxes).some(cb => cb.checked);
            const checkboxGroupLabel = currentSection.querySelector('.group-label');
            
            if (!isChecked) {
                isValid = false;
                if (checkboxGroupLabel) checkboxGroupLabel.style.color = 'var(--error-color)';
            } else {
                if (checkboxGroupLabel) checkboxGroupLabel.style.color = 'var(--text-secondary)';
            }
        }

        return isValid;
    }

    btnNext.addEventListener('click', () => {
        if (validateSection()) {
            currentSectionIndex++;
            updateUI();
        } else {
            shakeForm();
        }
    });

    btnPrev.addEventListener('click', () => {
        if (currentSectionIndex > 0) {
            currentSectionIndex--;
            updateUI();
        }
    });

    // Remove erro ao digitar/selecionar
    form.addEventListener('input', (e) => {
        if (e.target.required && e.target.value.trim()) {
            e.target.style.borderColor = '';
        }
    });
    
    form.addEventListener('change', (e) => {
        if (e.target.name === 'dias') {
             const currentSection = sections[currentSectionIndex];
             const checkboxGroupLabel = currentSection.querySelector('.group-label');
             const checkboxes = currentSection.querySelectorAll('input[name="dias"]');
             const isChecked = Array.from(checkboxes).some(cb => cb.checked);
             if (isChecked && checkboxGroupLabel) {
                 checkboxGroupLabel.style.color = 'var(--text-secondary)';
             }
        }
    });

    // Submissão do Formulário
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateSection()) {
            shakeForm();
            return;
        }

        // Mostrar estado de loading
        const originalText = btnSubmit.textContent;
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Enviando...';

        // Coletar dados
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Tratar checkboxes múltiplas (dias)
        const selectedDays = [];
        form.querySelectorAll('input[name="dias"]:checked').forEach(cb => {
            selectedDays.push(cb.value);
        });
        data['dias-semana-lista'] = selectedDays.join(', ');
        
        // Remover chave dias original para evitar sobreposição
        delete data['dias'];

        try {
            // Nova API Backend do sistema Real
            const res = await fetch('http://localhost:3000/api/workouts/generate', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                 },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                throw new Error('Falha ao gerar a ficha.');
            }
            
            const result = await res.json();
            console.log("SUCESSO! Ficha Criada e Vinculada ao Usuário:", result);
            
            // Trello/Excel simulação 
            // Preparado: fetch('url_do_webhook', { method: 'POST', body: JSON.stringify(data) })
            
            form.innerHTML = `
                <div class="success-state">
                    <h1>Mapeamento Concluído!</h1>
                    <p>Sua Ficha foi montada instantaneamente pela nossa Inteligência!</p>
                    <button type="button" onclick="window.location.href='../workout-viewer/index.html'" class="btn btn-primary">Acessar Meu Painel de Treinos</button>
                    <br><br>
                </div>
            `;
            
        } catch (error) {
            console.error(error);
            const statusMessage = document.getElementById('status-message');
            if(statusMessage) {
                statusMessage.textContent = 'Erro de conexão com o servidor. Tente novamente.';
                statusMessage.className = 'status-message error';
            }
            btnSubmit.disabled = false;
            btnSubmit.textContent = originalText;
        }
    });

    // Animação de erro
    function shakeForm() {
        const container = document.querySelector('.container');
        container.style.animation = 'shake 0.5s';
        setTimeout(() => {
            container.style.animation = '';
        }, 500);
    }
    
    // Adicionar keyframes para shake dinamicamente
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes shake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            50% { transform: translateX(10px); }
            75% { transform: translateX(-10px); }
            100% { transform: translateX(0); }
        }
    `;
    document.head.appendChild(style);

    // Inicializa a UI
    updateUI();
});
