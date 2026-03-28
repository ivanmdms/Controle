import { db } from '../lib/database.js';
import { icons, createIcons } from 'https://unpkg.com/lucide@latest/dist/esm/lucide.js';

export async function renderTransacoes() {
  return `
    <div class="header-actions">
      <h2>Transações (Compra e Venda)</h2>
      <button class="btn btn-primary" id="btn-add-transacao"><i data-lucide="plus"></i> Nova Transação</button>
    </div>
    
    <div class="table-container">
      <table id="table-transacoes">
        <thead>
          <tr>
            <th>Imóvel</th>
            <th>Tipo / Data</th>
            <th>Valor Base</th>
            <th>Deduções/Taxas (ITBI, Corret.)</th>
            <th>Lucro Líquido / Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colspan="5" style="text-align: center;">Carregando...</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div class="modal" id="modal-transacao">
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="modal-transacao-title">Registrar Transação</h2>
          <button class="btn-icon" id="close-modal-transacao"><i data-lucide="x"></i></button>
        </div>
        <form id="form-transacao" class="form-grid">
          <div class="form-group full-width">
            <label>Imóvel</label>
            <select id="trans-imovel" class="form-control" required></select>
          </div>
          <div class="form-group">
            <label>Tipo de Transação</label>
            <select id="trans-tipo" class="form-control" required>
              <option value="compra">Compra (Aquisição)</option>
              <option value="venda">Venda (Alienação)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Data</label>
            <input type="date" id="trans-data" class="form-control" required>
          </div>
          <div class="form-group full-width">
            <label>Valor Base do Imóvel (R$)</label>
            <input type="number" step="0.01" id="trans-valor" class="form-control" required>
          </div>
          
          <div class="form-group full-width"><hr style="border-color: var(--border-color); margin: 8px 0;"></div>
          <div class="form-group full-width" style="margin-bottom: 0;">
            <label style="color:var(--text-secondary); font-size: 12px; margin-bottom: 8px;">TAXAS E DEDUÇÕES</label>
          </div>
          
          <div class="form-group">
            <label>ITBI Pago (R$)</label>
            <input type="number" step="0.01" id="trans-itbi" class="form-control" value="0">
          </div>
          <div class="form-group">
            <label>Corretagem (R$)</label>
            <input type="number" step="0.01" id="trans-corretagem" class="form-control" value="0">
          </div>
          <div class="form-group">
            <label>Custos de Cartório (R$)</label>
            <input type="number" step="0.01" id="trans-cartorio" class="form-control" value="0">
          </div>
          <div class="form-group">
            <label>Outros Custos/IR (R$)</label>
            <input type="number" step="0.01" id="trans-outros" class="form-control" value="0">
          </div>
          <div class="form-group full-width" style="margin-top: 16px; text-align: right;">
            <button type="button" class="btn btn-outline" id="cancel-transacao" style="margin-right: 8px;">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar Documento</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export async function initTransacoes() {
  const modal = document.getElementById('modal-transacao');
  const btnAdd = document.getElementById('btn-add-transacao');
  const btnClose = document.getElementById('close-modal-transacao');
  const btnCancel = document.getElementById('cancel-transacao');
  const form = document.getElementById('form-transacao');
  const tbody = document.querySelector('#table-transacoes tbody');
  const selectImovel = document.getElementById('trans-imovel');
  const modalTitle = document.getElementById('modal-transacao-title');

  let currentData = [];
  let editingId = null;

  const openModal = async () => {
    try {
      if(modalTitle) modalTitle.innerText = editingId ? 'Editar Transação' : 'Registrar Compra/Venda';
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
      const baseVal = Number(document.getElementById('trans-valor').value);
      const itbi = Number(document.getElementById('trans-itbi').value || 0);
      const brokerage = Number(document.getElementById('trans-corretagem').value || 0);
      const notary = Number(document.getElementById('trans-cartorio').value || 0);
      const other = Number(document.getElementById('trans-outros').value || 0);

      const tType = document.getElementById('trans-tipo').value;
      const net_total = tType === 'venda' 
        ? baseVal - (itbi + brokerage + notary + other) 
        : baseVal + (itbi + brokerage + notary + other);

      const payload = {
        property_id: selectImovel.value,
        transaction_type: tType,
        transaction_date: document.getElementById('trans-data').value,
        base_value: baseVal,
        itbi_cost: itbi,
        brokerage_cost: brokerage,
        notary_cost: notary,
        other_costs: other,
        net_total: net_total
      };

      if(!payload.property_id) return alert('Selecione um imóvel');

      const { error } = editingId 
        ? await db.update('transactions', editingId, payload)
        : await db.insert('transactions', payload);
        
      if (error) alert('Erro ao salvar: ' + error.message);
      else {
        if(payload.transaction_type === 'venda') {
          await db.update('properties', payload.property_id, { status: 'vendido' });
        }
        closeModal();
        loadTransacoes();
      }
    });
  }

  window.editTransacao = (id) => {
    const item = currentData.find(i => i.id === id);
    if (!item) return;
    editingId = id;
    openModal().then(() => {
      document.getElementById('trans-imovel').value = item.property_id;
      document.getElementById('trans-tipo').value = item.transaction_type;
      document.getElementById('trans-data').value = item.transaction_date;
      document.getElementById('trans-valor').value = Number(item.base_value).toFixed(2);
      document.getElementById('trans-itbi').value = Number(item.itbi_cost).toFixed(2);
      document.getElementById('trans-corretagem').value = Number(item.brokerage_cost).toFixed(2);
      document.getElementById('trans-cartorio').value = Number(item.notary_cost).toFixed(2);
      document.getElementById('trans-outros').value = Number(item.other_costs).toFixed(2);
    });
  };

  window.deleteTransacao = async (id) => {
    if(confirm("Deseja mesmo excluir esta transação?")) {
      await db.delete('transactions', id);
      loadTransacoes();
    }
  };

  async function loadTransacoes() {
    try {
      const { data: rawData, error } = await db.select('transactions');
      if (error) throw error;
      
      currentData = rawData;
      const { data: allProps } = await db.select('properties');
      const mappedData = rawData.map(t => ({...t, properties: allProps.find(p => p.id === t.property_id)}));

      if (!mappedData || mappedData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhuma transação registrada.</td></tr>';
        return;
      }

      tbody.innerHTML = mappedData.map(t => {
        const typeBadge = t.transaction_type === 'compra' ? 'badge-alugado' : 'badge-vendido';
        const taxas = Number(t.itbi_cost) + Number(t.brokerage_cost) + Number(t.notary_cost) + Number(t.other_costs);
        return `
          <tr>
            <td><strong>${t.properties?.title || 'Desconhecido'}</strong></td>
            <td><span class="badge ${typeBadge}">${t.transaction_type}</span><br><small class="text-secondary">${formatDate(t.transaction_date)}</small></td>
            <td>R$ ${Number(t.base_value).toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
            <td class="text-danger">R$ ${taxas.toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
            <td>
              <strong class="text-primary" style="margin-right: 12px; display:inline-block; margin-bottom:8px;">R$ ${Number(t.net_total).toLocaleString('pt-BR', {minimumFractionDigits:2})}</strong><br>
              <button class="btn-icon" onclick="editTransacao('${t.id}')" title="Editar"><i data-lucide="edit"></i></button>
              <button class="btn-icon" onclick="deleteTransacao('${t.id}')" title="Excluir"><i data-lucide="trash-2"></i></button>
            </td>
          </tr>
        `;
      }).join('');
      createIcons({ icons });
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger)">Erro no banco local.</td></tr>';
    }
  }

  function formatDate(d) {
    if(!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  }

  loadTransacoes();
}
