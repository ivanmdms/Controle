import { db } from '../lib/database.js';
import { icons, createIcons } from 'https://unpkg.com/lucide@latest/dist/esm/lucide.js';

export async function renderImoveis() {
  return `
    <div class="header-actions">
      <h2>Imóveis da Holding</h2>
      <div style="display: flex; gap: 8px;">
        <select id="filter-prop" class="form-control" style="width: auto; min-width: 150px;">
          <option value="">Filtro: Todos Prop.</option>
        </select>
        <select id="filter-cidade" class="form-control" style="width: auto; min-width: 150px;">
          <option value="">Filtro: Toda Cidade</option>
          <option value="Boituva">Boituva</option>
          <option value="Cerquilho">Cerquilho</option>
          <option value="Rio das Pedras">Rio das Pedras</option>
          <option value="Araras">Araras</option>
        </select>
        <button class="btn btn-primary" id="btn-add-imovel"><i data-lucide="plus"></i> Novo Imóvel</button>
      </div>
    </div>
    
    <div class="table-container">
      <table id="table-imoveis">
        <thead>
          <tr>
            <th>Título & Endereço</th>
            <th>Proprietário</th>
            <th>Tipo & Cidade</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colspan="5" style="text-align: center;">Carregando...</td></tr>
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
            <label>Cidade</label>
            <select id="imovel-cidade" class="form-control">
              <option value="">Selecione a Cidade...</option>
              <option value="Boituva">Boituva</option>
              <option value="Cerquilho">Cerquilho</option>
              <option value="Rio das Pedras">Rio das Pedras</option>
              <option value="Araras">Araras</option>
            </select>
          </div>
          <div class="form-group">
            <label>Proprietário</label>
            <select id="imovel-proprietario" class="form-control">
              <option value="">Atribuir Proprietário...</option>
            </select>
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

  // Load Prop options for filter and form
  const loadOwnersOptions = async () => {
     try {
       const { data } = await db.select('owners');
       if(data) {
         const options = data.map(o => `<option value="${o.id}">${o.name}</option>`).join('');
         const selectForm = document.getElementById('imovel-proprietario');
         const selectFilter = document.getElementById('filter-prop');
         if(selectForm) selectForm.innerHTML = '<option value="">Atribuir Proprietário...</option>' + options;
         if(selectFilter) selectFilter.innerHTML = '<option value="">Filtro: Todos Prop.</option>' + options;
       }
     } catch(e) {}
  };

  const openModal = async () => {
    if(modalTitle) modalTitle.innerText = editingId ? 'Editar Imóvel' : 'Cadastrar Imóvel';
    await loadOwnersOptions();
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

  // Filters
  const filterProp = document.getElementById('filter-prop');
  const filterCidade = document.getElementById('filter-cidade');
  if(filterProp) filterProp.addEventListener('change', () => loadImoveis());
  if(filterCidade) filterCidade.addEventListener('change', () => loadImoveis());

  if(form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        title: document.getElementById('imovel-title').value,
        address: document.getElementById('imovel-address').value,
        city: document.getElementById('imovel-cidade').value,
        owner_id: document.getElementById('imovel-proprietario').value,
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

  window.editImovel = async (id) => {
    const item = currentData.find(i => i.id === id);
    if (!item) return;
    editingId = id;
    await openModal();
    document.getElementById('imovel-title').value = item.title;
    document.getElementById('imovel-address').value = item.address || '';
    document.getElementById('imovel-cidade').value = item.city || '';
    document.getElementById('imovel-proprietario').value = item.owner_id || '';
    document.getElementById('imovel-type').value = item.property_type;
    document.getElementById('imovel-status').value = item.status;
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
      
      const { data: owners } = await db.select('owners');

      currentData = data || [];
      
      // Aplicar filtros
      const valCity = filterCidade ? filterCidade.value : '';
      const valOwner = filterProp ? filterProp.value : '';
      
      let filteredData = currentData;
      if(valCity) filteredData = filteredData.filter(i => i.city === valCity);
      if(valOwner) filteredData = filteredData.filter(i => i.owner_id === valOwner);

      if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum imóvel encontrado.</td></tr>';
        return;
      }

      tbody.innerHTML = filteredData.map(imovel => {
        const ownerNome = owners && imovel.owner_id ? owners.find(o => o.id === imovel.owner_id)?.name : '<span class="text-secondary" style="font-size:11px;">Sem proprietário</span>';
        return `
        <tr>
          <td><strong>${imovel.title}</strong><br><small style="color:var(--text-secondary)">${imovel.address || 'Sem endereço'}</small></td>
          <td>${ownerNome || ''}</td>
          <td>${imovel.property_type}<br><small style="color:var(--text-secondary)">${imovel.city || 'Sem cidade'}</small></td>
          <td><span class="badge badge-${imovel.status.replace('_', '-')}">${imovel.status.replace('_', ' ')}</span></td>
          <td>
            <button class="btn-icon" onclick="editImovel('${imovel.id}')" title="Editar"><i data-lucide="edit"></i></button>
            <button class="btn-icon" onclick="deleteImovel('${imovel.id}')" title="Excluir"><i data-lucide="trash-2"></i></button>
          </td>
        </tr>
      `}).join('');
      createIcons({ icons });
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger)">Erro interno no banco local.</td></tr>';
    }
  }

  loadOwnersOptions();
  loadImoveis();
}
