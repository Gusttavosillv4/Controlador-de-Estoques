function inserir(valor) {
    document.getElementById('display').value += valor;
}

function limpar() {
    document.getElementById('display').value = '';
}

function apagar() {
    let display = document.getElementById('display');
    display.value = display.value.slice(0, -1);
}

function calcular() {
    try {
        let resultado = eval(document.getElementById('display').value);
        document.getElementById('display').value = resultado;
    } catch (e) {
        document.getElementById('display').value = 'Erro';
    }
}