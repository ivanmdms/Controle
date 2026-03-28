import { db } from '../lib/database.js';
import { icons, createIcons } from 'https://unpkg.com/lucide@latest/dist/esm/lucide.js';

export async function renderProprietarios() {
  return `
    <div class="header-actions">
      <h2>Proprietários</h2>
      <button class="btn btn-primary" id="btn-add-proprietario"><i data-lucide="plus"></i> Novo Proprietário</button>
    </div>
    
    <div class="table-container">
      <table id="table-proprietarios">
        <thead>
          <tr>
            <th>Nome / Razão Social</th>
            <th>Documento (CPF/CNPJ)</th>
            <th>Contato</th>
            <th>Dados Bancários</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colspan="5" style="text-align: center;">Carregando...</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Novo Proprietário -->
    <div class="modal" id="modal-proprietario">
      <div class="modal-content" style="max-width: 700px;">
        <div class="modal-header">
          <h2 id="modal-prop-title">Cadastrar Proprietário</h2>
          <button class="btn-icon" id="close-modal-prop"><i data-lucide="x"></i></button>
        </div>
        <form id="form-proprietario" class="form-grid">
          <div class="form-group full-width">
            <label>Tipo de Pessoa</label>
            <select id="prop-tipo" class="form-control">
              <option value="fisica">Pessoa Física</option>
              <option value="juridica">Pessoa Jurídica</option>
            </select>
          </div>
          <div class="form-group full-width">
            <label>Nome Completo / Razão Social</label>
            <input type="text" id="prop-nome" class="form-control" required>
          </div>
          <div class="form-group">
            <label id="lbl-prop-doc">CPF</label>
            <input type="text" id="prop-doc" class="form-control" required>
          </div>
          <div class="form-group">
            <label>Telefone / WhatsApp</label>
            <input type="text" id="prop-tel" class="form-control">
          </div>
          <div class="form-group full-width">
            <label>Email</label>
            <input type="email" id="prop-email" class="form-control">
          </div>
          
          <div class="form-group full-width"><hr style="border-color: var(--border-color); margin: 8px 0;"></div>
          <div class="form-group full-width" style="margin-bottom: 0;">
             <label style="color:var(--text-secondary); font-size: 12px; margin-bottom: 8px;">DADOS BANCÁRIOS</label>
          </div>
          
          <div class="form-group">
            <label>Banco</label>
            <input type="text" id="prop-banco" class="form-control" placeholder="Ex: Itaú, Nubank, Bradesco...">
          </div>
          <div class="form-group">
            <label>Agência</label>
            <input type="text" id="prop-agencia" class="form-control">
          </div>
          <div class="form-group">
            <label>Conta</label>
            <input type="text" id="prop-conta" class="form-control">
          </div>
          <div class="form-group">
             <label>Tipo de Conta / Chave PIX</label>
             <input type="text" id="prop-pix" class="form-control" placeholder="Ex: Corrente, PIX CPF...">
          </div>

          <div class="form-group full-width" style="margin-top: 16px; text-align: right;">
            <button type="button" class="btn btn-outline" id="cancel-prop" style="margin-right: 8px;">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export async function initProprietarios() {
  const modal = document.getElementById('modal-proprietario');
  const btnAdd = document.getElementById('btn-add-proprietario');
  const btnClose = document.getElementById('close-modal-prop');
  const btnCancel = document.getElementById('cancel-prop');
  const form = document.getElementById('form-proprietario');
  const tbody = document.querySelector('#table-proprietarios tbody');
  const modalTitle = document.getElementById('modal-prop-title');
  const selectTipo = document.getElementById('prop-tipo');
  const lblDoc = document.getElementById('lbl-prop-doc');

  if(selectTipo) {
     selectTipo.addEventListener('change', () => {
        lblDoc.innerText = selectTipo.value === 'fisica' ? 'CPF' : 'CNPJ';
     });
  }

  let currentData = [];
  let editingId = null;

  const openModal = () => {
    if(modalTitle) modalTitle.innerText = editingId ? 'Editar Proprietário' : 'Cadastrar Proprietário';
    modal.classList.add('open');
  };
  
  const closeModal = () => {
    modal.classList.remove('open');
    editingId = null;
    if(form) form.reset();
    if(selectTipo) selectTipo.dispatchEvent(new Event('change'));
  };

  if(btnAdd) btnAdd.addEventListener('click', () => { editingId = null; if(form) form.reset(); openModal(); });
  if(btnClose) btnClose.addEventListener('click', closeModal);
  if(btnCancel) btnCancel.addEventListener('click', closeModal);

  if(form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        type: document.getElementById('prop-tipo').value,
        name: document.getElementById('prop-nome').value,
        document: document.getElementById('prop-doc').value,
        phone: document.getElementById('prop-tel').value,
        email: document.getElementById('prop-email').value,
        bank: document.getElementById('prop-banco').value,
        agency: document.getElementById('prop-agencia').value,
        account: document.getElementById('prop-conta').value,
        pix: document.getElementById('prop-pix').value
      };

      const { error } = editingId 
        ? await db.update('owners', editingId, payload)
        : await db.insert('owners', payload);

      if (error) alert('Erro ao salvar: ' + error.message);
      else {
        closeModal();
        loadProprietarios();
      }
    });
  }

  window.editProprietario = (id) => {
    const item = currentData.find(i => i.id === id);
    if (!item) return;
    editingId = id;
    document.getElementById('prop-tipo').value = item.type || 'fisica';
    document.getElementById('prop-nome').value = item.name;
    document.getElementById('prop-doc').value = item.document;
    document.getElementById('prop-tel').value = item.phone || '';
    document.getElementById('prop-email').value = item.email || '';
    document.getElementById('prop-banco').value = item.bank || '';
    document.getElementById('prop-agencia').value = item.agency || '';
    document.getElementById('prop-conta').value = item.account || '';
    document.getElementById('prop-pix').value = item.pix || '';
    
    if(selectTipo) selectTipo.dispatchEvent(new Event('change'));
    openModal();
  };

  window.deleteProprietario = async (id) => {
    if(confirm('Tem certeza que deseja excluir este proprietário?')) {
      await db.delete('owners', id);
      loadProprietarios();
    }
  };

  async function loadProprietarios() {
    try {
      const { data, error } = await db.select('owners');
      if (error) throw error;
      
      currentData = data || [];
      if (currentData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum proprietário cadastrado.</td></tr>';
        return;
      }

      tbody.innerHTML = currentData.map(prop => `
        <tr>
          <td><strong>${prop.name}</strong><br><small class="text-secondary">${prop.type === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}</small></td>
          <td>${prop.document}</td>
          <td>
            ${prop.phone ? `<i data-lucide="phone" style="width:14px;height:14px;vertical-align:middle;"></i> ${prop.phone}<br>` : ''}
            ${prop.email ? `<small class="text-secondary">${prop.email}</small>` : ''}
          </td>
          <td>
             ${prop.bank ? `${prop.bank}` : '<span class="text-secondary">Não informado</span>'}<br>
             ${prop.agency || prop.account ? `<small class="text-secondary">Ag: ${prop.agency} | CC: ${prop.account}</small>` : ''}
          </td>
          <td>
            <button class="btn-icon" onclick="editProprietario('${prop.id}')" title="Editar"><i data-lucide="edit"></i></button>
            <button class="btn-icon" onclick="deleteProprietario('${prop.id}')" title="Excluir"><i data-lucide="trash-2"></i></button>
          </td>
        </tr>
      `).join('');
      createIcons({ icons });
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger)">Erro interno no banco local.</td></tr>';
    }
  }

  loadProprietarios();
}
