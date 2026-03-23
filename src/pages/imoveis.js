import { db } from '../lib/database.js';
import { icons, createIcons } from 'lucide';

export async function renderImoveis() {
  return `
    <div class="header-actions">
      <h2>Imóveis da Holding</h2>
      <button class="btn btn-primary" id="btn-add-imovel"><i data-lucide="plus"></i> Novo Imóvel</button>
    </div>
    
    <div class="table-container">
      <table id="table-imoveis">
        <thead>
          <tr>
            <th>Título</th>
            <th>Tipo</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colspan="4" style="text-align: center;">Carregando...</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Novo Imóvel -->
    <div class="modal" id="modal-imovel">
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="modal-imovel-title">Cadastrar Imóvel</h2>
          <button class="btn-icon" id="close-modal-imovel"><i data-lucide="x"></i></button>
        </div>
        <form id="form-imovel" class="form-grid">
          <div class="form-group full-width">
            <label>Título do Imóvel</label>
            <input type="text" id="imovel-title" class="form-control" required placeholder="Ex: Casa no Tatuapé">
          </div>
          <div class="form-group full-width">
            <label>Endereço</label>
            <input type="text" id="imovel-address" class="form-control" placeholder="Rua, Número, Bairro...">
          </div>
          <div class="form-group">
            <label>Tipo</label>
            <select id="imovel-type" class="form-control">
              <option value="Casa">Casa</option>
              <option value="Apartamento">Apartamento</option>
              <option value="Lote">Lote</option>
              <option value="Galpão">Galpão</option>
              <option value="Comercial">Comercial</option>
            </select>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select id="imovel-status" class="form-control">
              <option value="disponivel">Disponível</option>
              <option value="alugado">Alugado</option>
              <option value="vendido">Vendido</option>
              <option value="em_manutencao">Em Manutenção</option>
            </select>
          </div>
          <div class="form-group full-width" style="margin-top: 16px; text-align: right;">
            <button type="button" class="btn btn-outline" id="cancel-imovel" style="margin-right: 8px;">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export async function initImoveis() {
  const modal = document.getElementById('modal-imovel');
  const btnAdd = document.getElementById('btn-add-imovel');
  const btnClose = document.getElementById('close-modal-imovel');
  const btnCancel = document.getElementById('cancel-imovel');
  const form = document.getElementById('form-imovel');
  const tbody = document.querySelector('#table-imoveis tbody');
  const modalTitle = document.getElementById('modal-imovel-title');

  let currentData = [];
  let editingId = null;

  const openModal = () => {
    if(modalTitle) modalTitle.innerText = editingId ? 'Editar Imóvel' : 'Cadastrar Imóvel';
    modal.classList.add('open');
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
        title: document.getElementById('imovel-title').value,
        address: document.getElementById('imovel-address').value,
        property_type: document.getElementById('imovel-type').value,
        status: document.getElementById('imovel-status').value
      };

      const { error } = editingId 
        ? await db.update('properties', editingId, payload)
        : await db.insert('properties', payload);

      if (error) alert('Erro ao salvar: ' + error.message);
      else {
        closeModal();
        loadImoveis();
      }
    });
  }

  window.editImovel = (id) => {
    const item = currentData.find(i => i.id === id);
    if (!item) return;
    editingId = id;
    document.getElementById('imovel-title').value = item.title;
    document.getElementById('imovel-address').value = item.address;
    document.getElementById('imovel-type').value = item.property_type;
    document.getElementById('imovel-status').value = item.status;
    openModal();
  };

  window.deleteImovel = async (id) => {
    if(confirm('Tem certeza que deseja excluir?')) {
      await db.delete('properties', id);
      loadImoveis();
    }
  };

  async function loadImoveis() {
    try {
      const { data, error } = await db.select('properties');
      if (error) throw error;
      
      currentData = data || [];
      if (currentData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nenhum imóvel cadastrado.</td></tr>';
        return;
      }

      tbody.innerHTML = currentData.map(imovel => `
        <tr>
          <td><strong>${imovel.title}</strong><br><small style="color:var(--text-secondary)">${imovel.address || 'Sem endereço'}</small></td>
          <td>${imovel.property_type}</td>
          <td><span class="badge badge-${imovel.status.replace('_', '-')}">${imovel.status.replace('_', ' ')}</span></td>
          <td>
            <button class="btn-icon" onclick="editImovel('${imovel.id}')" title="Editar"><i data-lucide="edit"></i></button>
            <button class="btn-icon" onclick="deleteImovel('${imovel.id}')" title="Excluir"><i data-lucide="trash-2"></i></button>
          </td>
        </tr>
      `).join('');
      createIcons({ icons });
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--danger)">Erro interno no banco local.</td></tr>';
    }
  }

  loadImoveis();
}
