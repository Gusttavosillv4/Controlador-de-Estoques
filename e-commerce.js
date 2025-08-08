// Array de produtos (carrega do LocalStorage ou começa vazio)
let produtos = JSON.parse(localStorage.getItem('estoque')) || [];

// Captura dos elementos
const nomeInput = document.getElementById('nome');
const quantidadeInput = document.getElementById('quantidade');
const btnAdicionar = document.getElementById('btnAdicionar');
const tabelaProdutos = document.getElementById('tabela-produtos');
const totalProdutos = document.getElementById('total-produtos');
const pesquisaInput = document.getElementById('pesquisa');

// Salvar no LocalStorage
function salvarNoLocalStorage() {
    localStorage.setItem('estoque', JSON.stringify(produtos));
}

// Atualizar tabela na tela
function atualizarTabela(filtro = '') {
    tabelaProdutos.innerHTML = '';

    let produtosFiltrados = produtos.filter(p =>
        p.nome.toLowerCase().includes(filtro.toLowerCase())
    );

    let total = 0;

    produtosFiltrados.forEach((produto, index) => {
        total += produto.quantidade;

        let row = `<tr>
            <td>${produto.nome}</td>
            <td>${produto.quantidade}</td>
            <td>
                <button class="btn-editar" onclick="editarProduto(${index})">Editar</button>
                <button class="btn-remover" onclick="removerProduto(${index})">Remover</button>
            </td>
        </tr>`;
        tabelaProdutos.innerHTML += row;
    });

    totalProdutos.textContent = `Total de itens: ${total}`;
}

// Adicionar ou atualizar produto
function adicionarProduto() {
    const nome = nomeInput.value.trim();
    const quantidade = parseInt(quantidadeInput.value);

    if (nome === '' || isNaN(quantidade) || quantidade <= 0) {
        alert('Preencha os campos corretamente!');
        return;
    }

    let produtoExistente = produtos.find(p => p.nome.toLowerCase() === nome.toLowerCase());

    if (produtoExistente) {
        produtoExistente.quantidade += quantidade;
    } else {
        produtos.push({ nome, quantidade });
    }

    salvarNoLocalStorage();
    atualizarTabela();
    nomeInput.value = '';
    quantidadeInput.value = '';
}

// Editar produto
function editarProduto(index) {
    let produto = produtos[index];
    nomeInput.value = produto.nome;
    quantidadeInput.value = produto.quantidade;

    // Remove o produto para que o novo valor substitua
    produtos.splice(index, 1);
    salvarNoLocalStorage();
    atualizarTabela();
}

// Remover produto
function removerProduto(index) {
    if (confirm('Tem certeza que deseja remover este produto?')) {
        produtos.splice(index, 1);
        salvarNoLocalStorage();
        atualizarTabela();
    }
}

// Eventos
btnAdicionar.addEventListener('click', adicionarProduto);
pesquisaInput.addEventListener('input', () => {
    atualizarTabela(pesquisaInput.value);
});

// Inicializa tabela
atualizarTabela();