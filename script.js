
// Global variables for in-memory storage
let cells = [];
const formats = {
    litio: ["18650", "21700", "26650"],
    niquel: ["AA", "AAA", "C", "D"]
};

// Variável para armazenar o resultado da última simulação
let lastSimulation = null;

// Atualiza o botão de download
function enableDownloadButton(groups, usedCellIds) {
   const downloadButton = document.getElementById("downloadButton");
   downloadButton.classList.remove("hidden");

    downloadButton.addEventListener("click", () => {
        const confirmation = confirm(
            `Você está prestes a criar um pack de baterias com as células selecionadas. As células utilizadas (${usedCellIds.join(
                ", "
            )}) serão excluídas. Deseja continuar?`
        );

        if (confirmation) {
            generateDownload(groups); // Gera o arquivo de texto com o esquema
            deleteCellsFromFile(usedCellIds); // Remove as células usadas
            location.reload(); // Recarrega a tela de simulação
        }
    });
}

function generateDownload(groups) {
    // Calcular detalhes para o nome do arquivo
    const series = groups.length; // Número de células em série
    const parallel = groups[0]?.length || 0; // Número de células em paralelo (considera o tamanho do primeiro grupo)
    const totalCapacity = groups.reduce(
        (sum, group) => sum + group.reduce((groupSum, cell) => groupSum + cell.capacity, 0),
        0
    ); // Capacidade total do pack

    // Nome do arquivo no formato "<series>S<parallel>P<totalCapacity>mAh"
    const fileName = `${series}S${parallel}P${totalCapacity}mAh.txt`;

    // Construir o conteúdo do arquivo de texto
    let content = "Esquema de Montagem do Pack de Baterias\n\n";
    groups.forEach((group, index) => {
        const groupCapacity = group.reduce((sum, cell) => sum + cell.capacity, 0);
        const cellDetails = group.map(cell => `ID: ${cell.id}, Capacidade: ${cell.capacity} mAh`).join("\n");
        content += `Grupo ${index + 1}:\n${cellDetails}\nCapacidade Total do Grupo: ${groupCapacity} mAh\n\n`;
    });

    // Criar um blob a partir do conteúdo do texto
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    // Criar um link para download e acioná-lo
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = fileName; // Nome do arquivo dinâmico
    downloadLink.click();

    // Revogar o objeto URL para liberar memória
    URL.revokeObjectURL(url);
}

// Retorna o índice da linha na planilha cells.csv a partir do ID
function getRowIndexById(cellId) {
    const fileName = "cells.csv";
    const csvContent = localStorage.getItem(fileName);

    if (!csvContent) {
        console.error("Nenhum arquivo de células encontrado.");
        return -1; // Indica erro
    }

    // Converte o CSV para array de linhas
    const lines = csvContent.trim().split("\n");
    const headers = lines[0].split(",");

    // Identifica o índice da coluna 'id'
    const idIndex = headers.indexOf("id");
    if (idIndex === -1) {
        console.error("Coluna 'id' não encontrada no arquivo.");
        return -1; // Indica erro
    }

    // Procura o índice da linha com o id fornecido
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",");
        if (values[idIndex] === cellId.toString()) {
            return i; // Retorna o índice da linha correspondente
        }
    }

    console.warn(`Célula com ID ${cellId} não encontrada.`);
    return -1; // Indica que o ID não foi encontrado
}


function deleteCellsFromFile(usedCellIds) {
    const fileName = "cells.csv";

    // Recuperar o conteúdo do arquivo do localStorage
    let csvContent = localStorage.getItem(fileName);

    if (!csvContent) {
        console.error("Arquivo não encontrado no localStorage.");
        return;
    }

    // Quebrar o conteúdo em linhas
    let lines = csvContent.split("\n");
	// Filtrar as linhas que NÃO possuem os IDs a serem removidos
	let filteredLines = [];
	for (let i = 0; i < lines.length; i++) {
		// Obter o ID da célula na linha (supondo que esteja na primeira coluna)
		const cellId = lines[i].split(",")[0].trim();

		// Adicionar a linha ao resultado apenas se o ID não estiver na lista de exclusão
		if (!usedCellIds.includes(parseInt(cellId))) {
			filteredLines.push(lines[i]);
		}
	}

    // Reconstruir o conteúdo do CSV filtrado
    const updatedCsvContent = filteredLines.join("\n");

    // Atualizar o arquivo no localStorage
    localStorage.setItem(fileName, updatedCsvContent);

    console.log(`Linhas removidas. O novo conteúdo do arquivo foi atualizado no localStorage.`);
}

// Recarrega completamente a tela de simulação
function resetSimulation() {
    // Limpa o resultado da simulação
    lastSimulation = null;
    document.getElementById("packResult").innerHTML = "";
    document.getElementById("downloadButton").classList.add("hidden");

    // Recarrega as células do arquivo
    loadCellsFromFile();
    updateTable();
}

// Show section
function showSection(sectionId) {
    document.querySelectorAll(".section").forEach(section => section.classList.add("hidden"));
    document.getElementById(sectionId).classList.remove("hidden");
}

// Update format options based on type
function updateFormats() {
    const type = document.getElementById("type").value;
    const formatSelect = document.getElementById("format");
    formatSelect.innerHTML = formats[type].map(f => `<option value="${f}">${f}</option>`).join("");
}

// Add a cell
document.getElementById("cellForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const capacity = parseInt(document.getElementById("capacity").value);
    const type = document.getElementById("type").value;
    const format = document.getElementById("format").value;
    const existing = cells.filter(cell => cell.capacity === capacity);
    if (existing.length > 0) {
        if (!confirm(`Já existem ${existing.length} células com ${capacity} mAh. Deseja continuar?`)) return;
    }
    cells.push({ capacity, type, format });
	addCellToFile({capacity, type, format});
    updateTable();
    alert("Célula cadastrada com sucesso!");
    this.reset();
	document.getElementById("capacity").focus();
});

// Adiciona uma nova célula ao arquivo cells.csv com ID gerado automaticamente
function addCellToFile({capacity, type, format}) {
  const fileName = "cells.csv";

  // Verificar se o arquivo já existe no localStorage
  let csvContent = localStorage.getItem(fileName);

  // Inicializa o arquivo com cabeçalhos, caso não exista
  if (!csvContent) {
    csvContent = "id,capacity,type,format\n";
  }

  // Divide o conteúdo em linhas e calcula o próximo ID
  const lines = csvContent.trim().split("\n");
  let nextId = 1;

  if (lines.length > 1) {
    const lastLine = lines[lines.length - 1];
    const lastId = parseInt(lastLine.split(",")[0], 10);
    nextId = isNaN(lastId) ? 1 : lastId + 1;
  }

  // Adiciona a nova linha
  const newLine = `${nextId},${capacity},${type},${format}`;
  csvContent += newLine + "\n";

  // Salva o conteúdo atualizado no localStorage
  localStorage.setItem(fileName, csvContent);

  console.log(`Célula adicionada: ID ${nextId}, ${capacity} mAh, Tipo: ${type}, Formato: ${format}`);
}


function simulatePack() {
    const series = parseInt(document.getElementById("series").value);
    const parallel = parseInt(document.getElementById("parallel").value);
    const type = document.getElementById("typeFilter").value;
    const format = document.getElementById("formatFilter").value;
    const strategy = document.getElementById("strategy").value;
	
	// Novos campos para capacidade mínima e máxima
    const minCapacity = parseFloat(document.getElementById("minCapacity").value) || 0; // Padrão: 0 mAh
    const maxCapacity = parseFloat(document.getElementById("maxCapacity").value) || Infinity; // Padrão: sem limite superior

    // Filtrar células por tipo, formato e capacidades
    const filteredCells = cells.filter(cell => 
        cell.type === type &&
        cell.format === format &&
        cell.capacity >= minCapacity &&
        cell.capacity <= maxCapacity
    );

    // Verificar se há células suficientes
    if (filteredCells.length < series * parallel) {
        alert(`Faltam ${series * parallel - filteredCells.length} células que atendem aos filtros para montar este pack.`);
        return;
    }

    // Ordenar células conforme a estratégia
    let sortedCells;
    if (strategy === "power") {
        // Estratégia de maior potência
        sortedCells = [...filteredCells].sort((a, b) => b.capacity - a.capacity);
    } else if (strategy === "balance") {
        // Estratégia de melhor uso das células disponíveis
        const avg = filteredCells.reduce((sum, cell) => sum + cell.capacity, 0) / filteredCells.length;
        sortedCells = [...filteredCells].sort((a, b) => Math.abs(b.capacity - avg) - Math.abs(a.capacity - avg));
    } else if (strategy === "low_power") {
        // Estratégia de menor potência
        sortedCells = [...filteredCells].sort((a, b) => a.capacity - b.capacity);
    }

    // Inicializar os grupos
    const groups = Array.from({ length: series }, () => []);
    const groupCapacities = Array(series).fill(0);
    const usedCellIds = []; // Para armazenar os IDs das células usadas

    // Distribuir células balanceando as capacidades dentro de cada grupo
    let currentSeriesIndex = 0; // Índice do grupo atual
    for (const cell of sortedCells) {
        // Adicionar célula ao grupo atual
        groups[currentSeriesIndex].push(cell);
        groupCapacities[currentSeriesIndex] += cell.capacity;
        usedCellIds.push(cell.id);

        // Avançar para o próximo grupo se o atual já tiver células suficientes em paralelo
        if (groups[currentSeriesIndex].length === parallel) {
            currentSeriesIndex++;
            if (currentSeriesIndex === series) break; // Todos os grupos preenchidos
        }
    }

    // Verificar se cada grupo tem o número necessário de células em paralelo
    const isValidPack = groups.every(group => group.length === parallel);
    if (!isValidPack) {
        alert("Não foi possível distribuir as células de forma balanceada para todos os grupos.");
        return;
    }

    // Formatar saída
    const output = groups.map((group, index) => {
        const totalCapacity = group.reduce((sum, cell) => sum + cell.capacity, 0);
        const capacities = group.map(cell => cell.capacity).join(", ");
        return `Grupo ${index + 1}: [${capacities}]\nCapacidade Total: ${totalCapacity} mAh\n`;
    }).join("\n");

    document.getElementById("packResult").innerHTML = `<pre>${output}</pre>`;
    enableDownloadButton(groups, usedCellIds);
}




// Load cells from file
function loadCellsFromFile() {
    const fileName = "cells.csv";
    let csvContent = localStorage.getItem(fileName);

    if (csvContent) {
        const lines = csvContent.trim().split("\n").slice(1); // Ignora cabeçalhos
        cells = lines.map(line => {
            const [id, capacity, type, format] = line.split(",");
            return { id: parseInt(id), capacity: parseInt(capacity), type, format };
        });
    }
    updateTable();
}

// Delete a cell
function deleteCell(index) {
	if(confirm('Deseja realmente excluir a celula?')){
		const cellToDelete = cells[index];
		cells.splice(index, 1);

		const fileName = "cells.csv";
		let csvContent = localStorage.getItem(fileName);

		if (csvContent) {
			const lines = csvContent.trim().split("\n");
			const updatedContent = lines.filter(line => {
				const [id] = line.split(",");
				return parseInt(id) !== cellToDelete.id;
			}).join("\n");

			localStorage.setItem(fileName, updatedContent);
		}

		updateTable();
	}
}

// Update cell table
function updateTable() {
    const tbody = document.querySelector("#cellTable tbody");
    tbody.innerHTML = cells
        .sort((a, b) => b.capacity - a.capacity)
        .map(
            (cell, index) =>
                `<tr>
                    <td>${cell.capacity}</td>
                    <td>${cell.type}</td>
                    <td>${cell.format}</td>
                    <td><button onclick="deleteCell(${index})">Excluir</button></td>
                </tr>`
        )
        .join("");
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    loadCellsFromFile(); // Carrega dados do arquivo na inicialização
});
