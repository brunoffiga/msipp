// ===== NAVEGAÇÃO ENTRE SEÇÕES =====
document.addEventListener('DOMContentLoaded', function() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');

    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            
            // Remove active de todos botões e seções
            navButtons.forEach(btn => btn.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            // Adiciona active no botão clicado e seção correspondente
            this.classList.add('active');
            document.getElementById(targetSection).classList.add('active');
            
            // Scroll suave para o topo
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // Inicializar cálculos e gráficos dinâmicos
    calcularCenarios(); // Calcula cenários padrão na inicialização
});

// ===== GRÁFICO DE EVOLUÇÃO (ROADMAP) =====
// A função initEvolutionChart() foi removida pois o gráfico estático não existe mais no HTML.

// ===== CALCULADORA DE CENÁRIOS =====
function calcularCenarios() {
    // Pegar inputs
    const numAtendimentos = parseInt(document.getElementById('numAtendimentos').value) || 10;
    const ticketMedio = parseFloat(document.getElementById('ticketMedio').value) || 1000;
    const margemBruta = parseFloat(document.getElementById('margemBruta').value) / 100 || 0.65;
    const comissaoFabio = parseFloat(document.getElementById('comissaoFabio').value) / 100 || 0.12;
    
    // CORREÇÃO: Ler o valor do input 'custosFixos' que agora existe no HTML
    const custosFixosEl = document.getElementById('custosFixos');
    const custosFixos = custosFixosEl ? parseFloat(custosFixosEl.value) : 1500;

    // Cálculos
    const receitaBruta = numAtendimentos * ticketMedio;
    const custoVariavel = receitaBruta * (1 - margemBruta);
    const margemBrutaTotal = receitaBruta - custoVariavel;
    const comissaoTotal = receitaBruta * comissaoFabio;
    const margemAposComissao = margemBrutaTotal - comissaoTotal;
    const lucroLiquido = margemAposComissao - custosFixos;
    const margemLiquida = (receitaBruta === 0) ? 0 : (lucroLiquido / receitaBruta) * 100; // Evitar divisão por zero
    const roiVitor = lucroLiquido; // Por mês

    // Mostrar resultados
    const resultadosDiv = document.getElementById('resultados');
    if (resultadosDiv) {
        resultadosDiv.innerHTML = `
            <div class="resultado-item">
                <span class="resultado-label">Receita Bruta</span>
                <span class="resultado-value">R$ ${receitaBruta.toFixed(2)}</span>
            </div>
            <div class="resultado-item">
                <span class="resultado-label">Margem Bruta</span>
                <span class="resultado-value">R$ ${margemBrutaTotal.toFixed(2)} (${(margemBruta * 100).toFixed(0)}%)</span>
            </div>
            <div class="resultado-item">
                <span class="resultado-label">Comissão Fábio</span>
                <span class="resultado-value" style="color: #f59e0b;">R$ ${comissaoTotal.toFixed(2)}</span>
            </div>
            <div class="resultado-item">
                <span class="resultado-label">Custos Fixos</span>
                <span class="resultado-value">R$ ${custosFixos.toFixed(2)}</span>
            </div>
            <div class="resultado-item" style="border-top: 2px solid #2563eb; padding-top: 15px;">
                <span class="resultado-label"><strong>Lucro Líquido MSI</strong></span>
                <span class="resultado-value" style="font-size: 1.3rem; color: ${lucroLiquido > 0 ? '#10b981' : '#ef4444'};">
                    R$ ${lucroLiquido.toFixed(2)}
                </span>
            </div>
            <div class="resultado-item">
                <span class="resultado-label">Margem Líquida</span>
                <span class="resultado-value">${margemLiquida.toFixed(1)}%</span>
            </div>
        `;
    }

    // Atualizar gráfico de distribuição
    updateReceitaChart(receitaBruta, custoVariavel, comissaoTotal, custosFixos, lucroLiquido);

    // Atualizar gráfico de projeção
    updateProjecaoChart(numAtendimentos, ticketMedio, margemBruta, comissaoFabio, custosFixos);

    // Atualizar tabela de comparação de cenários
    updateScenariosTable(ticketMedio, margemBruta, comissaoFabio, custosFixos);
}

// ===== GRÁFICO DE DISTRIBUIÇÃO DE RECEITA =====
let receitaChart = null;

function updateReceitaChart(receitaBruta, custoVariavel, comissaoTotal, custosFixos, lucroLiquido) {
    const ctx = document.getElementById('receitaChart');
    if (!ctx) return;

    if (receitaChart) {
        receitaChart.destroy();
    }

    receitaChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Custos Variáveis', 'Comissão Fábio', 'Custos Fixos', 'Lucro MSI'],
            datasets: [{
                data: [
                    Math.max(0, custoVariavel),
                    Math.max(0, comissaoTotal),
                    Math.max(0, custosFixos),
                    Math.max(0, lucroLiquido) // Não exibir lucro negativo no gráfico de pizza
                ],
                backgroundColor: [
                    '#ef4444',
                    '#f59e0b',
                    '#6b7280',
                    '#10b981'
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                title: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = (total === 0) ? 0 : ((value / total) * 100); // Evitar divisão por zero
                            return `${label}: R$ ${value.toFixed(2)} (${percentage.toFixed(1)}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ===== GRÁFICO DE PROJEÇÃO 12 MESES (DINÂMICO) =====
let projecaoChart = null;

function updateProjecaoChart(atendimentosBase, ticketMedio, margemBruta, comissaoFabio, custosFixos) {
    const ctx = document.getElementById('projecaoChart');
    if (!ctx) {
        console.error("Elemento #projecaoChart não encontrado!");
        return; // Sai da função se o canvas não existir
    }


    if (projecaoChart) {
        projecaoChart.destroy();
    }

    // Projetar crescimento
    const meses = [];
    const receitaMensal = [];
    const lucroMensal = [];
    const comissaoMensal = [];

    for (let i = 1; i <= 12; i++) {
        meses.push(`Mês ${i}`);
        
        // Crescimento gradual: +15% nos primeiros 3 meses, +10% do mês 4-6, +8% do mês 7-12
        let crescimento = 1;
        if (i <= 3) {
            crescimento = Math.pow(1.15, i - 1);
        } else if (i <= 6) {
            crescimento = Math.pow(1.15, 2) * Math.pow(1.10, i - 3);
        } else {
            crescimento = Math.pow(1.15, 2) * Math.pow(1.10, 3) * Math.pow(1.08, i - 6);
        }

        const atendimentos = Math.round(atendimentosBase * crescimento);
        const receita = atendimentos * ticketMedio;
        const custoVar = receita * (1 - margemBruta);
        const comissao = receita * comissaoFabio;
        const lucro = receita - custoVar - comissao - custosFixos;

        receitaMensal.push((receita / 1000));
        lucroMensal.push((lucro / 1000));
        comissaoMensal.push((comissao / 1000));
    }

    projecaoChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: meses,
            datasets: [
                {
                    label: 'Receita Bruta',
                    data: receitaMensal,
                    backgroundColor: 'rgba(37, 99, 235, 0.7)',
                    borderColor: '#2563eb',
                    borderWidth: 1
                },
                {
                    label: 'Lucro MSI',
                    data: lucroMensal,
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: '#10b981',
                    borderWidth: 1
                },
                {
                    label: 'Comissão Fábio',
                    data: comissaoMensal,
                    backgroundColor: 'rgba(245, 158, 11, 0.7)',
                    borderColor: '#f59e0b',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: R$ ${context.parsed.y.toFixed(1)}k`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valores (R$ mil)'
                    }
                }
            }
        }
    });
}

// ===== TABELA DE COMPARAÇÃO DE CENÁRIOS =====
function updateScenariosTable(ticketMedio, margemBruta, comissaoFabio, custosFixos) {
    const tbody = document.getElementById('scenariosTable');
    if (!tbody) return;

    const cenarios = [
        { nome: 'Conservador', atendimentos: 5, ticket: ticketMedio * 0.8 },
        { nome: 'Realista', atendimentos: 10, ticket: ticketMedio },
        { nome: 'Otimista', atendimentos: 15, ticket: ticketMedio },
        { nome: 'Agressivo', atendimentos: 20, ticket: ticketMedio * 1.2 }
    ];

    let html = '';
    cenarios.forEach(cenario => {
        const receitaBruta = cenario.atendimentos * cenario.ticket;
        const custoVar = receitaBruta * (1 - margemBruta);
        const comissao = receitaBruta * comissaoFabio;
        const lucro = receitaBruta - custoVar - comissao - custosFixos;
        const roi = (receitaBruta === 0) ? 0 : (lucro / receitaBruta) * 100; // Evitar divisão por zero

        const corLucro = lucro > 0 ? '#10b981' : '#ef4444';

        html += `
            <tr>
                <td><strong>${cenario.nome}</strong></td>
                <td>${cenario.atendimentos}</td>
                <td>R$ ${receitaBruta.toFixed(0)}</td>
                <td>R$ ${comissao.toFixed(0)}</td>
                <td style="color: ${corLucro}; font-weight: 700;">R$ ${lucro.toFixed(0)}</td>
                <td style="color: ${corLucro};">${roi.toFixed(1)}%</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// ===== SALVAR PROGRESSO DOS CHECKLISTS =====
document.addEventListener('DOMContentLoaded', function() {
    const checkboxes = document.querySelectorAll('.checklist input[type="checkbox"]');
    
    // Carregar estado salvo
    checkboxes.forEach((checkbox, index) => {
        const saved = localStorage.getItem(`checkbox_${index}`);
        if (saved === 'true') {
            checkbox.checked = true;
        }
    });

    // Salvar quando mudar
    checkboxes.forEach((checkbox, index) => {
        checkbox.addEventListener('change', function() {
            localStorage.setItem(`checkbox_${index}`, this.checked);
        });
    });
});

// ===== ATALHOS DE TECLADO =====
document.addEventListener('keydown', function(e) {
    // Navegação com números (1-7)
    if (e.key >= '1' && e.key <= '7' && !e.ctrlKey && !e.altKey) {
        // Garantir que não estamos digitando em um input
        if (document.activeElement.tagName === 'INPUT') return;

        const sections = ['situacao', 'roadmap', 'comissao', 'simulador', 'fornecedor', 'proximos', 'bruno'];
        const index = parseInt(e.key) - 1;
        if (index < sections.length) {
            const button = document.querySelector(`[data-section="${sections[index]}"]`);
            if (button) button.click();
        }
    }
});

// ===== EXPORTAR DADOS =====
function exportarDados() {
    const numAtendimentos = parseInt(document.getElementById('numAtendimentos').value) || 10;
    const ticketMedio = parseFloat(document.getElementById('ticketMedio').value) || 1000;
    const margemBruta = parseFloat(document.getElementById('margemBruta').value) || 65;
    const comissaoFabio = parseFloat(document.getElementById('comissaoFabio').value) || 12;
    const custosFixos = parseFloat(document.getElementById('custosFixos').value) || 1500;

    const dados = {
        timestamp: new Date().toISOString(),
        inputs: {
            numAtendimentos,
            ticketMedio,
            margemBruta,
            comissaoFabio,
            custosFixos
        }
    };

    const dataStr = JSON.stringify(dados, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `msi-simulacao-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// ===== IMPRIMIR RELATÓRIO =====
function imprimirRelatorio() {
    window.print();
}

// ===== SMOOTH SCROLL PARA LINKS INTERNOS =====
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});

// ===== ANIMAÇÕES AO SCROLL =====
function handleScrollAnimations() {
    const cards = document.querySelectorAll('.card, .timeline-item, .value-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '0';
                entry.target.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    entry.target.style.transition = 'all 0.5s ease';
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, 100);
                
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });
    
    cards.forEach(card => observer.observe(card));
}

// Inicializar animações após DOM carregar
document.addEventListener('DOMContentLoaded', handleScrollAnimations);

// ===== TOOLTIP PARA INFORMAÇÕES ADICIONAIS =====
function initTooltips() {
    const tooltipTriggers = document.querySelectorAll('[data-tooltip]');
    
    tooltipTriggers.forEach(trigger => {
        let tooltip = null; // Manter referência ao tooltip

        trigger.addEventListener('mouseenter', function(e) {
            const tooltipText = this.getAttribute('data-tooltip');
            tooltip = document.createElement('div');
            tooltip.className = 'tooltip'; // Adicione estilos CSS para .tooltip
            tooltip.textContent = tooltipText;
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            let left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2);
            let top = rect.top - tooltip.offsetHeight - 10; // 10px acima

            // Ajustar se sair da tela
            if (left < 0) left = 5;
            if (top < 0) top = rect.bottom + 10;

            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
        });
        
        trigger.addEventListener('mouseleave', function() {
            if (tooltip) {
                tooltip.remove();
                tooltip = null;
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', initTooltips);