import { db } from '../lib/database.js';
import { icons, createIcons } from 'lucide';

export async function renderManutencoes() {
  return `
    <div class="header-actions">
      <h2>Manutenções e Reformas</h2>
      <div style="display: flex; gap: 8px;">
         <button class="btn btn-outline" id="btn-relatorio-prestadores"><i data-lucide="hard-hat"></i> Histórico de Prestadores</button>
         <button class="btn btn-primary" id="btn-add-manutencao"><i data-lucide="plus"></i> Nova Despesa</button>
      </div>
    </div>
    
    <div class="table-container">
      <table id="table-manutencoes" style="font-size: 14px;">
        <thead>
          <tr>
            <th>Imóvel</th>
            <th>Categoria / Detalhes</th>
            <th>Prestador (Serviço)</th>
            <th>Custo (R$)</th>
            <th>Status / Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colspan="5" style="text-align: center;">Carregando...</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Nova Manutenção -->
    <div class="modal" id="modal-manutencao">
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="modal-manutencao-title">Registrar Manutenção</h2>
          <button class="btn-icon" id="close-modal-manutencao"><i data-lucide="x"></i></button>
        </div>
        <form id="form-manutencao" class="form-grid">
          <div class="form-group full-width">
            <label>Imóvel Afetado</label>
            <select id="manutencao-imovel" class="form-control" required></select>
          </div>
          <div class="form-group">
            <label>Prestador de Serviço / Empresa</label>
            <input type="text" id="manutencao-prestador" class="form-control" placeholder="Ex: João Encanador, Construtora XYZ..." required>
          </div>
          <div class="form-group">
            <label>Categoria</label>
            <select id="manutencao-categoria" class="form-control" required>
              <option value="Infiltração">Infiltração</option>
              <option value="Pintura (Paredes/Portões)">Pintura</option>
              <option value="Troca de Piso">Troca de Piso</option>
              <option value="Hidráulica (Canos Vazando)">Hidráulica</option>
              <option value="Elétrica">Elétrica</option>
              <option value="Marcenaria (Envernizar)">Marcenaria</option>
              <option value="Telhado/Calhas">Telhado/Calhas</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          <div class="form-group full-width">
            <label>Descrição do Problema / Orçamento Detalhado</label>
            <input type="text" id="manutencao-descricao" class="form-control" placeholder="Ex: Conserto de cano vazando na cozinha, troca do sifão...">
          </div>
          <div class="form-group">
            <label>Data Serviço / Solicitação</label>
            <input type="date" id="manutencao-data" class="form-control" required>
          </div>
          <div class="form-group">
            <label>Custo (R$)</label>
            <input type="number" step="0.01" id="manutencao-custo" class="form-control" required>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select id="manutencao-status" class="form-control">
              <option value="pendente">Orçamento Pendente</option>
              <option value="em_andamento">Serviço Em Andamento</option>
              <option value="concluido">Concluído (Pago)</option>
            </select>
          </div>
          <div class="form-group full-width" style="margin-top: 16px; text-align: right;">
            <button type="button" class="btn btn-outline" id="cancel-manutencao" style="margin-right: 8px;">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar Despesa</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Histórico de Prestadores -->
    <div class="modal" id="modal-prestadores">
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h2>Relatório de Prestadores</h2>
          <button class="btn-icon" id="close-modal-prestadores"><i data-lucide="x"></i></button>
        </div>
        <div style="background: var(--bg-color); padding: 16px; border-radius: var(--radius-md); margin-bottom: 24px;">
           <p style="font-size: 14px; color: var(--text-secondary); margin:0;">Acompanhe o histórico de pagamentos e a quantidade de serviços feitos por cada prestador/empresa em todos os imóveis da holding.</p>
        </div>
        <div class="table-container" style="max-height: 400px; overflow-y: auto;">
          <table id="table-prestadores" style="font-size: 13px;">
            <thead style="position: sticky; top: 0; z-index: 1;">
              <tr>
                 <th>Nome do Prestador</th>
                 <th style="text-align:center;">Serviços Realizados</th>
                 <th style="text-align:right;">Total Contratado (R$)</th>
              </tr>
            </thead>
            <tbody>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

export async function initManutencoes() {
  const modal = document.getElementById('modal-manutencao');
  const btnAdd = document.getElementById('btn-add-manutencao');
  const btnClose = document.getElementById('close-modal-manutencao');
  const btnCancel = document.getElementById('cancel-manutencao');
  const form = document.getElementById('form-manutencao');
  const tbody = document.querySelector('#table-manutencoes tbody');
  const selectImovel = document.getElementById('manutencao-imovel');
  const modalTitle = document.getElementById('modal-manutencao-title');

  // Prestadores Elements
  const modalPrest = document.getElementById('modal-prestadores');
  const btnPrest = document.getElementById('btn-relatorio-prestadores');
  const btnClosePrest = document.getElementById('close-modal-prestadores');
  const tbodyPrest = document.querySelector('#table-prestadores tbody');

  let currentData = [];
  let editingId = null;

  const openModal = async () => {
    try {
      if(modalTitle) modalTitle.innerText = editingId ? 'Editar Manutenção' : 'Registrar Serviço';
      const { data } = await db.select('properties');
      if (data && data.length > 0) {
        selectImovel.innerHTML = data.map(p => `<option value="${p.id}">${p.title}</option>`).join('');
      } else {
        selectImovel.innerHTML = '<option value="">(Nenhum imóvel)</option>';
      }
      modal.classList.add('open');
    } catch(e){}
  };

  const closeModal = () => {
    modal.classList.remove('open');
    editingId = null;
    if(form) form.reset();
  };

  if(btnAdd) btnAdd.addEventListener('click', () => { editingId = null; if(form) form.reset(); openModal(); });
  if(btnClose) btnClose.addEventListener('click', closeModal);
  if(btnCancel) btnCancel.addEventListener('click', closeModal);

  if(form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        property_id: selectImovel.value,
        provider_name: document.getElementById('manutencao-prestador').value,
        category: document.getElementById('manutencao-categoria').value,
        service_date: document.getElementById('manutencao-data').value,
        description: document.getElementById('manutencao-descricao').value,
        repair_cost: document.getElementById('manutencao-custo').value,
        status: document.getElementById('manutencao-status').value
      };

      if(!payload.property_id) return alert("Selecione um imóvel.");

      const { error } = editingId 
        ? await db.update('maintenances', editingId, payload)
        : await db.insert('maintenances', payload);
      
      if (error) alert('Erro ao salvar: ' + error.message);
      else {
        closeModal();
        loadManutencoes();
      }
    });
  }

  // Lógica Modal Histórico
  if(btnPrest) {
     btnPrest.addEventListener('click', () => {
        const prestadores = {};
        
        currentData.forEach(m => {
           let nome = (m.provider_name || 'Desconhecido').trim().toUpperCase();
           if(nome === '') nome = 'DESCONHECIDO';
           
           if(!prestadores[nome]) {
              prestadores[nome] = { nome: nome, count: 0, total: 0 };
           }
           prestadores[nome].count++;
           prestadores[nome].total += Number(m.repair_cost || 0);
        });
        
        const arr = Object.values(prestadores).sort((a,b) => b.total - a.total);
        
        if(arr.length === 0){
           tbodyPrest.innerHTML = '<tr><td colspan="3" style="text-align:center;">Nenhum prestador cadastrado.</td></tr>';
        } else {
           tbodyPrest.innerHTML = arr.map(p => `
             <tr style="border-bottom: 1px solid var(--border-color);">
                <td><strong>${p.nome}</strong></td>
                <td style="text-align:center;"><span class="badge" style="background:var(--primary); color:white;">${p.count} serviços</span></td>
                <td style="text-align:right;" class="text-danger">R$ ${p.total.toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
             </tr>
           `).join('');
        }
        
        modalPrest.classList.add('open');
     });
  }
  
  if(btnClosePrest) btnClosePrest.addEventListener('click', () => modalPrest.classList.remove('open'));

  window.editManutencao = (id) => {
    const item = currentData.find(i => i.id === id);
    if (!item) return;
    editingId = id;
    openModal().then(() => {
      document.getElementById('manutencao-imovel').value = item.property_id;
      document.getElementById('manutencao-prestador').value = item.provider_name || '';
      document.getElementById('manutencao-categoria').value = item.category;
      document.getElementById('manutencao-data').value = item.service_date;
      document.getElementById('manutencao-descricao').value = item.description || '';
      document.getElementById('manutencao-custo').value = Number(item.repair_cost).toFixed(2);
      document.getElementById('manutencao-status').value = item.status || 'pendente';
    });
  };

  window.deleteManutencao = async (id) => {
    if(confirm("Deseja mesmo excluir esta manutenção?")) {
      await db.delete('maintenances', id);
      loadManutencoes();
    }
  };

  async function loadManutencoes() {
    try {
      const { data: rawData, error } = await db.select('maintenances');
      if (error) throw error;
      
      currentData = rawData;
      const { data: allProps } = await db.select('properties');
      const mappedData = rawData.map(m => ({...m, properties: allProps.find(p => p.id === m.property_id)}));

      if (!mappedData || mappedData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhuma despesa registrada.</td></tr>';
        return;
      }

      tbody.innerHTML = mappedData.map(m => `
        <tr>
          <td><strong>${m.properties?.title || 'Desconhecido'}</strong></td>
          <td>${m.category}<br><small class="text-secondary">${m.description || ''}</small></td>
          <td>${m.provider_name || '<small class="text-secondary">Não informado</small>'}</td>
          <td class="text-danger">R$ ${Number(m.repair_cost).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
          <td>
            <span class="badge ${m.status === 'concluido' ? 'badge-disponivel' : 'badge-manutencao'}" style="margin-bottom:8px; display:inline-block">${m.status.replace('_', ' ')}</span><br>
            <div style="display:flex;">
               <button class="btn-icon" onclick="editManutencao('${m.id}')" title="Editar"><i data-lucide="edit"></i></button>
               <button class="btn-icon" onclick="deleteManutencao('${m.id}')" title="Excluir"><i data-lucide="trash-2"></i></button>
            </div>
          </td>
        </tr>
      `).join('');
      createIcons({ icons });
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger)">Erro interno no banco local.</td></tr>';
    }
  }

  function formatDate(d) {
    if(!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  }

  loadManutencoes();
}
