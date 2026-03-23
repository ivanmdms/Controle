import { db } from '../lib/database.js';
import { icons, createIcons } from 'lucide';

export async function renderDocumentos() {
  return `
    <div class="header-actions">
      <h2>Documentos e Anexos</h2>
      <button class="btn btn-primary" id="btn-add-doc"><i data-lucide="upload"></i> Enviar Arquivo</button>
    </div>
    
    <div class="table-container">
      <table id="table-documentos">
        <thead>
          <tr>
            <th>Documento / Título</th>
            <th>Imóvel Vinculado</th>
            <th>Data</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colspan="4" style="text-align: center;">Carregando...</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Upload -->
    <div class="modal" id="modal-doc">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Enviar Documento (Base64 Local)</h2>
          <button class="btn-icon" id="close-modal-doc"><i data-lucide="x"></i></button>
        </div>
        <form id="form-doc" class="form-grid">
          <p class="full-width" style="color:var(--text-secondary); font-size:12px; margin-bottom:12px;">
            Aviso: Arquivos são codificados e salvos diretamente no seu disco (via navegador). Prefira PDFs/Imagens leves (máx ~2MB) para que o backup JSON não fique extremamente lento.
          </p>
          <div class="form-group full-width">
            <label>Título / Tipo do Documento</label>
            <input type="text" id="doc-titulo" class="form-control" placeholder="Contrato de Locação, Laudo de Vistoria..." required>
          </div>
          <div class="form-group full-width">
            <label>Imóvel Vinculado</label>
            <select id="doc-imovel" class="form-control" required></select>
          </div>
          <div class="form-group full-width">
            <label>Arquivo</label>
            <input type="file" id="doc-arquivo" class="form-control" required>
          </div>
          <div class="form-group full-width" style="margin-top: 16px; text-align: right;">
            <button type="button" class="btn btn-outline" id="cancel-doc" style="margin-right: 8px;">Cancelar</button>
            <button type="submit" class="btn btn-primary" id="btn-upload">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export async function initDocumentos() {
  const modal = document.getElementById('modal-doc');
  const btnAdd = document.getElementById('btn-add-doc');
  const btnClose = document.getElementById('close-modal-doc');
  const btnCancel = document.getElementById('cancel-doc');
  const form = document.getElementById('form-doc');
  const tbody = document.querySelector('#table-documentos tbody');
  const selectImovel = document.getElementById('doc-imovel');
  const btnUpload = document.getElementById('btn-upload');

  const openModal = async () => {
    try {
      const { data } = await db.select('properties');
      if (data && data.length > 0) {
        selectImovel.innerHTML = data.map(p => `<option value="${p.id}">${p.title}</option>`).join('');
      } else {
        selectImovel.innerHTML = '<option value="">(Nenhum imóvel)</option>';
      }
      modal.classList.add('open');
    } catch(e){}
  };
  const closeModal = () => modal.classList.remove('open');

  if(btnAdd) btnAdd.addEventListener('click', openModal);
  if(btnClose) btnClose.addEventListener('click', closeModal);
  if(btnCancel) btnCancel.addEventListener('click', closeModal);

  if(form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('doc-titulo').value;
      const property_id = selectImovel.value;
      const fileInput = document.getElementById('doc-arquivo');
      const file = fileInput.files[0];

      if(!file) return alert('Selecione um arquivo.');
      if(!property_id) return alert('Selecione um imóvel.');
      
      if(file.size > 2 * 1024 * 1024) {
        if(!confirm("O arquivo é maior que 2MB e pode causar lentidão severa. Deseja continuar?")) {
           return;
        }
      }

      btnUpload.disabled = true;
      btnUpload.innerText = 'Processando...';

      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result;
        try {
          const { error: dbError } = await db.insert('documents', {
            title, property_id, file_path: base64, file_name: file.name
          });

          if (dbError) throw dbError;

          closeModal();
          form.reset();
          loadDocumentos();
        } catch(err) {
          alert('Erro no banco: ' + err.message);
        } finally {
          btnUpload.disabled = false;
          btnUpload.innerText = 'Salvar';
        }
      };
      reader.onerror = () => {
        alert("Erro ao ler arquivo");
        btnUpload.disabled = false;
        btnUpload.innerText = 'Salvar';
      }
      reader.readAsDataURL(file);
    });
  }

  window.deleteDocument = async (id) => {
    if(confirm("Deseja mesmo apagar este documento? Se apagar, não é possível recuperar a não ser por backup.")) {
       await db.delete('documents', id);
       loadDocumentos();
    }
  }

  async function loadDocumentos() {
    try {
      const { data: rawData, error } = await db.select('documents');
      if (error) throw error;
      
      const { data: allProps } = await db.select('properties');
      const data = rawData.map(d => ({...d, properties: allProps.find(p => p.id === d.property_id)}));

      if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nenhum documento encontrado.</td></tr>';
        return;
      }

      tbody.innerHTML = data.map(d => `
        <tr>
          <td><strong>${d.title}</strong><br><small class="text-secondary">${d.file_name}</small></td>
          <td>${d.properties?.title || 'Desconhecido'}</td>
          <td>${new Date(d.created_at).toLocaleDateString('pt-BR')}</td>
          <td>
            <a href="${d.file_path}" download="${d.file_name}" class="btn btn-outline" style="padding: 4px 8px; font-size: 12px; text-decoration: none; margin-right: 8px;">Baixar</a>
            <button class="btn-icon" onclick="deleteDocument('${d.id}')" title="Excluir"><i data-lucide="trash-2"></i></button>
          </td>
        </tr>
      `).join('');
      createIcons({ icons });
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--danger)">Erro no banco local.</td></tr>';
    }
  }
  loadDocumentos();
}
