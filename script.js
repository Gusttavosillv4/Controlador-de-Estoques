// =========================
// Dashboard de Estoque - script.js
// Dependência: Chart.js (já incluída no HTML)
// =========================

// -------------------------
// Dados (LocalStorage)
// -------------------------
let produtos = JSON.parse(localStorage.getItem('estoque')) || [];
let historico = JSON.parse(localStorage.getItem('historico')) || [];

// -------------------------
// Elementos do DOM
// -------------------------
const loginSection = document.getElementById('login-section');
const appSection = document.getElementById('app');

const usuarioInput = document.getElementById('usuario');
const senhaInput = document.getElementById('senha');
const btnLogin = document.getElementById('btnLogin');
const btnLogout = document.getElementById('btnLogout');

const nomeInput = document.getElementById('nome');
const quantidadeInput = document.getElementById('quantidade');
const btnEntrada = document.getElementById('btnEntrada');
const btnSaida = document.getElementById('btnSaida');

const pesquisaInput = document.getElementById('pesquisa');
const tabelaProdutos = document.getElementById('tabela-produtos');

const listaHistorico = document.getElementById('lista-historico');

const totalProdutosResumo = document.getElementById('total-produtos-resumo');
const totalItensResumo = document.getElementById('total-itens-resumo');
const estoqueBaixoResumo = document.getElementById('estoque-baixo-resumo');

const canvasEstoque = document.getElementById('graficoEstoque');
const canvasMov = document.getElementById('graficoMovimentacoes');

// -------------------------
// Usuário padrão (simples)
// -------------------------
const usuarioPadrao = { usuario: "admin", senha: "1234" };

// -------------------------
// Helpers - salvar / carregar
// -------------------------
function salvarDados() {
    localStorage.setItem('estoque', JSON.stringify(produtos));
    localStorage.setItem('historico', JSON.stringify(historico));
}

function formatarDataHoraISO(d = new Date()) {
    // retorna string ISO básica (YYYY-MM-DD HH:MM:SS)
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// -------------------------
// Login / Logout
// -------------------------
btnLogin.addEventListener('click', () => {
    if (usuarioInput.value === usuarioPadrao.usuario && senhaInput.value === usuarioPadrao.senha) {
        usuarioInput.value = '';
        senhaInput.value = '';
        loginSection.style.display = 'none';
        appSection.style.display = 'flex' || 'block';
        inicializarDashboard();
    } else {
        alert('Usuário ou senha inválidos!');
    }
});

btnLogout.addEventListener('click', () => {
    if (confirm('Deseja realmente sair?')) {
        loginSection.style.display = 'block';
        appSection.style.display = 'none';
    }
});

// -------------------------
// Histórico
// -------------------------
function registrarHistorico(acao, nome, quantidade) {
    const registro = {
        timestamp: new Date().toISOString(),
        label: formatarDataHoraISO(new Date()),
        acao, // "Entrada", "Saida", "Criação", "Edição", "Remoção"
        nome,
        quantidade: Number(quantidade)
    };
    historico.unshift(registro);
    // limitar histórico para evitar usar muito espaço (ex.: 200 registros)
    if (historico.length > 200) historico.pop();
    salvarDados();
}

// -------------------------
// Funções principais (CRUD + entrada/saída)
// -------------------------
function adicionarOuAtualizarProduto(nome, qtd) {
    nome = nome.trim();
    qtd = Number(qtd);
    if (!nome || isNaN(qtd) || qtd <= 0) {
        alert('Preencha o nome e a quantidade corretamente.');
        return;
    }

    const idx = produtos.findIndex(p => p.nome.toLowerCase() === nome.toLowerCase());
    if (idx >= 0) {
        produtos[idx].quantidade += qtd;
        registrarHistorico('Entrada', produtos[idx].nome, qtd);
    } else {
        produtos.push({ nome, quantidade: qtd });
        registrarHistorico('Criação/Entrada', nome, qtd);
    }
    salvarDados();
    atualizarTudo();
}

function darSaidaProduto(nome, qtd) {
    nome = nome.trim();
    qtd = Number(qtd);
    if (!nome || isNaN(qtd) || qtd <= 0) {
        alert('Preencha o nome e a quantidade corretamente.');
        return;
    }
    const idx = produtos.findIndex(p => p.nome.toLowerCase() === nome.toLowerCase());
    if (idx === -1) {
        alert('Produto não encontrado.');
        return;
    }
    if (produtos[idx].quantidade < qtd) {
        alert('Quantidade insuficiente em estoque.');
        return;
    }
    produtos[idx].quantidade -= qtd;
    registrarHistorico('Saída', produtos[idx].nome, qtd);
    // se quantidade zero, mantemos o item (pode preferir remover - aqui mantemos)
    salvarDados();
    atualizarTudo();
}

function editarProduto(index) {
    // carrega os dados nos inputs e remove o item original para submissão futura
    const p = produtos[index];
    nomeInput.value = p.nome;
    quantidadeInput.value = p.quantidade;
    // Remove temporariamente (ao salvar com "Entrada" ou "Atualizar" será recriado)
    produtos.splice(index, 1);
    registrarHistorico('Edição (pré)', p.nome, p.quantidade);
    salvarDados();
    atualizarTudo();
}

function removerProduto(index) {
    if (!confirm('Confirmar remoção do produto?')) return;
    const p = produtos[index];
    registrarHistorico('Remoção', p.nome, p.quantidade);
    produtos.splice(index, 1);
    salvarDados();
    atualizarTudo();
}

// -------------------------
// Render da tabela e histórico
// -------------------------
function atualizarTabela(filtro = '') {
    tabelaProdutos.innerHTML = '';
    const filtroTxt = filtro.trim().toLowerCase();

    produtos
        .map((p, i) => ({ ...p, index: i }))
        .filter(p => p.nome.toLowerCase().includes(filtroTxt))
        .forEach(p => {
            const alerta = p.quantidade <= 5 ? '⚠ ' : '';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${alerta}${p.nome}</td>
                <td>${p.quantidade}</td>
                <td>
                    <button class="btn-editar" data-index="${p.index}">Editar</button>
                    <button class="btn-remover" data-index="${p.index}">Remover</button>
                </td>
            `;
            tabelaProdutos.appendChild(tr);
        });
    // Delegação de eventos para os botões da tabela
    Array.from(tabelaProdutos.querySelectorAll('.btn-editar')).forEach(btn => {
        btn.onclick = () => editarProduto(Number(btn.dataset.index));
    });
    Array.from(tabelaProdutos.querySelectorAll('.btn-remover')).forEach(btn => {
        btn.onclick = () => removerProduto(Number(btn.dataset.index));
    });
}

function atualizarHistoricoVisual() {
    listaHistorico.innerHTML = '';
    historico.slice(0, 50).forEach(h => {
        const li = document.createElement('li');
        li.textContent = `[${h.label}] ${h.acao} — ${h.nome} (${h.quantidade})`;
        listaHistorico.appendChild(li);
    });
}

// -------------------------
// Resumos (topo)
// -------------------------
function atualizarResumo() {
    totalProdutosResumo.textContent = produtos.length;
    const totalItens = produtos.reduce((s, p) => s + Number(p.quantidade), 0);
    totalItensResumo.textContent = totalItens;
    const baixo = produtos.filter(p => p.quantidade <= 5).length;
    estoqueBaixoResumo.textContent = baixo;
}

// -------------------------
// Gráficos (Chart.js)
// -------------------------
let chartEstoque = null;
let chartMovimentacoes = null;

function gerarGraficoEstoque() {
    const nomes = produtos.map(p => p.nome);
    const quantidades = produtos.map(p => p.quantidade);

    // destroi se já existe
    if (chartEstoque) chartEstoque.destroy();

    chartEstoque = new Chart(canvasEstoque.getContext('2d'), {
        type: 'bar',
        data: {
            labels: nomes,
            datasets: [{
                label: 'Quantidade',
                data: quantidades,
                // cores geradas automaticamente pelo Chart.js (não forçamos)
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: { mode: 'index' }
            },
            scales: {
                x: { ticks: { autoSkip: false } },
                y: { beginAtZero: true }
            }
        }
    });
}

function pegarUltimosNDias(n = 7) {
    const dias = [];
    const hoje = new Date();
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(hoje);
        d.setDate(hoje.getDate() - i);
        dias.push(d);
    }
    return dias;
}

function gerarGraficoMovimentacoes() {
    // Agrupar entradas e saídas por dia (últimos 7 dias)
    const dias = pegarUltimosNDias(7);
    const labels = dias.map(d => `${d.getDate()}/${d.getMonth()+1}`); // e.g. 8/8
    const entradasPorDia = labels.map(() => 0);
    const saidasPorDia = labels.map(() => 0);

    // historico: timestamp ISO -> considerar data local
    historico.forEach(item => {
        const dt = new Date(item.timestamp);
        // encontrar índice correspondente (se estiver dentro dos últimos 7 dias)
        for (let i = 0; i < dias.length; i++) {
            const d = dias[i];
            if (d.getFullYear() === dt.getFullYear() && d.getMonth() === dt.getMonth() && d.getDate() === dt.getDate()) {
                if (String(item.acao).toLowerCase().includes('entrada')) entradasPorDia[i] += Number(item.quantidade);
                else if (String(item.acao).toLowerCase().includes('saída') || String(item.acao).toLowerCase().includes('saida')) saidasPorDia[i] += Number(item.quantidade);
                else if (String(item.acao).toLowerCase().includes('criação')) entradasPorDia[i] += Number(item.quantidade); // criação conta como entrada
                break;
            }
        }
    });

    // destrói se já existe
    if (chartMovimentacoes) chartMovimentacoes.destroy();

    chartMovimentacoes = new Chart(canvasMov.getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Entradas',
                    data: entradasPorDia,
                    fill: false,
                    tension: 0.2
                },
                {
                    label: 'Saídas',
                    data: saidasPorDia,
                    fill: false,
                    tension: 0.2
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: { mode: 'index' },
                legend: { position: 'top' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// -------------------------
// Atualizar tudo
// -------------------------
function atualizarTudo(filtro = '') {
    atualizarTabela(filtro);
    atualizarHistoricoVisual();
    atualizarResumo();
    gerarGraficoEstoque();
    gerarGraficoMovimentacoes();
}

// -------------------------
// Eventos dos botões (Entrada / Saída)
// -------------------------
btnEntrada.addEventListener('click', () => {
    adicionarOuAtualizarProduto(nomeInput.value, quantidadeInput.value);
    nomeInput.value = '';
    quantidadeInput.value = '';
});

btnSaida.addEventListener('click', () => {
    darSaidaProduto(nomeInput.value, quantidadeInput.value);
    nomeInput.value = '';
    quantidadeInput.value = '';
});

// Pesquisa em tempo real
pesquisaInput.addEventListener('input', () => {
    atualizarTabela(pesquisaInput.value);
});

// -------------------------
// Inicialização quando loga
// -------------------------
function inicializarDashboard() {
    // garante que elementos visuais estejam atualizados
    atualizarTudo();
}

// Se o usuário já estiver "logado" (opcional): não auto-login aqui, mantemos fluxo manual.
// Caso queira auto-login se já tiver sido autenticado, podemos armazenar flag no localStorage.
// Por enquanto começa na tela de login.

// -------------------------
// Inicializa gráficos vazios (se desejar exibir algo mesmo antes do login)
// -------------------------
function inicializarGraficosVazios() {
    // cria charts vazios para evitar erro se forem chamados antes do DOM estar pronto
    if (canvasEstoque && canvasMov) {
        // datasets vazios
        chartEstoque = new Chart(canvasEstoque.getContext('2d'), {
            type: 'bar',
            data: { labels: [], datasets: [{ label: 'Quantidade', data: [] }] },
            options: { responsive: true }
        });
        chartMovimentacoes = new Chart(canvasMov.getContext('2d'), {
            type: 'line',
            data: { labels: [], datasets: [{ label:'Entradas', data:[] }, { label:'Saídas', data:[] }] },
            options: { responsive: true }
        });
        // destrói imediatamente; criará os gráficos corretos na inicialização
        chartEstoque.destroy();
        chartMovimentacoes.destroy();
    }
}

// executar
inicializarGraficosVazios();
// se quiser iniciar já com app visível (p.ex. para desenvolvimento), descomente as linhas abaixo:
// loginSection.style.display = 'none';
// appSection.style.display = 'flex';
// inicializarDashboard();