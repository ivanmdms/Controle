import { db } from '../lib/database.js';
import { icons, createIcons } from 'https://unpkg.com/lucide@latest/dist/esm/lucide.js';

export async function renderPrestadores() {
  return `
    <div class="header-actions">
      <h2>Prestadores de Serviço</h2>
      <button class="btn btn-primary" id="btn-add-prestador"><i data-lucide="plus"></i> Novo Prestador</button>
    </div>
    
    <div class="table-container">
      <table id="table-prestadores">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Profissão / Serviço</th>
            <th>Contato</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colspan="5" style="text-align: center;">Carregando...</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Novo Prestador -->
    <div class="modal" id="modal-prestador">
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="modal-prestador-title">Cadastrar Prestador</h2>
          <button class="btn-icon" id="close-modal-prestador"><i data-lucide="x"></i></button>
        </div>
        <form id="form-prestador" class="form-grid">
          <div class="form-group full-width">
            <label>Nome do Profissional ou Empresa</label>
            <input type="text" id="prestador-nome" class="form-control" required placeholder="Ex: João Silva">
          </div>
          <div class="form-group">
            <label>Profissão / Especialidade</label>
            <input type="text" id="prestador-profissao" class="form-control" required placeholder="Ex: Encanador, Pedreiro, Eletricista">
          </div>
          <div class="form-group">
            <label>Telefone / WhatsApp</label>
            <input type="text" id="prestador-telefone" class="form-control" placeholder="(11) 99999-9999">
          </div>
          <div class="form-group full-width">
            <label>Email</label>
            <input type="email" id="prestador-email" class="form-control" placeholder="contato@empresa.com">
          </div>
          <div class="form-group">
            <label>Status</label>
            <select id="prestador-status" class="form-control">
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
          <div class="form-group full-width" style="margin-top: 16px; text-align: right;">
            <button type="button" class="btn btn-outline" id="cancel-prestador" style="margin-right: 8px;">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export async function initPrestadores() {
  const modal = document.getElementById('modal-prestador');
  const btnAdd = document.getElementById('btn-add-prestador');
  const btnClose = document.getElementById('close-modal-prestador');
  const btnCancel = document.getElementById('cancel-prestador');
  const form = document.getElementById('form-prestador');
  const tbody = document.querySelector('#table-prestadores tbody');
  const modalTitle = document.getElementById('modal-prestador-title');

  let currentData = [];
  let editingId = null;

  const openModal = () => {
    if(modalTitle) modalTitle.innerText = editingId ? 'Editar Prestador' : 'Cadastrar Prestador';
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
        name: document.getElementById('prestador-nome').value,
        profession: document.getElementById('prestador-profissao').value,
        phone: document.getElementById('prestador-telefone').value,
        email: document.getElementById('prestador-email').value,
        status: document.getElementById('prestador-status').value
      };

      const { error } = editingId 
        ? await db.update('providers', editingId, payload)
        : await db.insert('providers', payload);

      if (error) alert('Erro ao salvar: ' + error.message);
      else {
        closeModal();
        loadPrestadores();
      }
    });
  }

  window.editPrestador = (id) => {
    const item = currentData.find(i => i.id === id);
    if (!item) return;
    editingId = id;
    document.getElementById('prestador-nome').value = item.name;
    document.getElementById('prestador-profissao').value = item.profession;
    document.getElementById('prestador-telefone').value = item.phone || '';
    document.getElementById('prestador-email').value = item.email || '';
    document.getElementById('prestador-status').value = item.status || 'ativo';
    openModal();
  };

  window.deletePrestador = async (id) => {
    if(confirm('Tem certeza que deseja excluir este prestador?')) {
      await db.delete('providers', id);
      loadPrestadores();
    }
  };

  async function loadPrestadores() {
    try {
      const { data, error } = await db.select('providers');
      if (error) throw error;
      
      currentData = data || [];
      if (currentData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum prestador cadastrado.</td></tr>';
        return;
      }

      tbody.innerHTML = currentData.map(prest => `
        <tr>
          <td><strong>${prest.name}</strong></td>
          <td>${prest.profession}</td>
          <td>
            ${prest.phone ? `<i data-lucide="phone" style="width:14px;height:14px;vertical-align:middle;"></i> ${prest.phone}<br>` : ''}
            ${prest.email ? `<small class="text-secondary">${prest.email}</small>` : ''}
          </td>
          <td><span class="badge badge-${prest.status === 'ativo' ? 'disponivel' : 'manutencao'}">${prest.status}</span></td>
          <td>
            <button class="btn-icon" onclick="editPrestador('${prest.id}')" title="Editar"><i data-lucide="edit"></i></button>
            <button class="btn-icon" onclick="deletePrestador('${prest.id}')" title="Excluir"><i data-lucide="trash-2"></i></button>
          </td>
        </tr>
      `).join('');
      createIcons({ icons });
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger)">Erro interno no banco local.</td></tr>';
    }
  }

  loadPrestadores();
}
