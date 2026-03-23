import { db } from '../lib/database.js';
import { icons, createIcons } from 'lucide';

export async function renderLocacoes() {
  return `
    <div class="header-actions">
      <h2>Controle de Locações</h2>
      <button class="btn btn-primary" id="btn-add-locacao"><i data-lucide="plus"></i> Nova Locação</button>
    </div>
    
    <div class="table-container">
      <table id="table-locacoes" style="font-size: 14px;">
        <thead>
          <tr>
            <th>Imóvel</th>
            <th>Inquilino</th>
            <th>Vigência (Venc)</th>
            <th>Valores (Aluguel/IPTU/Cond)</th>
            <th>Status / Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colspan="5" style="text-align: center;">Carregando...</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Locação -->
    <div class="modal" id="modal-locacao">
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="modal-locacao-title">Nova Locação</h2>
          <button class="btn-icon" id="close-modal-locacao"><i data-lucide="x"></i></button>
        </div>
        <form id="form-locacao" class="form-grid">
          <div class="form-group full-width">
            <label>Imóvel (Apenas disponíveis)</label>
            <select id="locacao-imovel" class="form-control" required></select>
          </div>
          <div class="form-group">
            <label>Inquilino (Nome Completo)</label>
            <input type="text" id="locacao-inquilino" class="form-control" required>
          </div>
          <div class="form-group">
            <label>Documento (CPF/CNPJ)</label>
            <input type="text" id="locacao-documento" class="form-control">
          </div>
          <div class="form-group">
            <label>Data de Início</label>
            <input type="date" id="locacao-inicio" class="form-control" required>
          </div>
          <div class="form-group">
            <label>Data de Término</label>
            <input type="date" id="locacao-fim" class="form-control">
          </div>
          <div class="form-group">
            <label>Dia de Vencimento</label>
            <input type="number" min="1" max="31" id="locacao-vencimento" class="form-control" placeholder="Dia 1 ao 31" required>
          </div>
          <div class="form-group">
            <label>Condição Inicial do Imóvel</label>
            <input type="text" id="locacao-condicao" class="form-control" placeholder="Ex: Pintura nova...">
          </div>
          
          <div class="form-group full-width"><hr style="border-color: var(--border-color); margin: 8px 0;"></div>
          <div class="form-group full-width" style="margin-bottom: 0;">
             <label style="color:var(--text-secondary); font-size: 12px; margin-bottom: 8px;">VALORES MENSAIS GERAIS</label>
          </div>
          
          <div class="form-group">
            <label>Valor do Aluguel Livre (R$)</label>
            <input type="number" step="0.01" id="locacao-valor" class="form-control" required>
          </div>
          <div class="form-group">
            <label>Condomínio (Mensal R$)</label>
            <input type="number" step="0.01" id="locacao-condominio" value="0" class="form-control">
          </div>

          <div class="form-group full-width"><hr style="border-color: var(--border-color); margin: 8px 0;"></div>
          <div class="form-group full-width" style="margin-bottom: 0;">
             <label style="color:var(--text-secondary); font-size: 12px; margin-bottom: 8px;">DADOS DO IPTU</label>
          </div>

          <div class="form-group">
            <label>Formato de Pagt. IPTU</label>
            <select id="locacao-iptu-tipo" class="form-control">
               <option value="parcelado">Parcelado (Cota Mensal)</option>
               <option value="total">Pagamento Único (Total)</option>
               <option value="isento">Isento / Não aplicável</option>
            </select>
          </div>
          <div class="form-group">
            <label id="lbl-iptu-valor">Valor (R$)</label>
            <input type="number" step="0.01" id="locacao-iptu-valor" value="0" class="form-control">
          </div>
          <div class="form-group" id="group-iptu-parcelas">
            <label>Qtd Parcela(s)</label>
            <input type="number" id="locacao-iptu-parcelas" value="10" min="1" max="12" class="form-control">
          </div>

          <div class="form-group full-width"><hr style="border-color: var(--border-color); margin: 8px 0;"></div>
          <div class="form-group">
            <label>Status</label>
            <select id="locacao-status" class="form-control">
              <option value="ativo">Ativo</option>
              <option value="encerrado">Encerrado</option>
            </select>
          </div>
          
          <div class="form-group full-width" style="margin-top: 16px; text-align: right;">
            <button type="button" class="btn btn-outline" id="cancel-locacao" style="margin-right: 8px;">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar Locação</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Financeiro (Histórico de Pagamentos) -->
    <div class="modal" id="modal-financeiro">
      <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
          <h2 id="modal-fin-title">Histórico Mensal / Inadimplência</h2>
          <button class="btn-icon" id="close-modal-fin"><i data-lucide="x"></i></button>
        </div>
        
        <div style="background: var(--bg-color); padding: 16px; border-radius: var(--radius-md); margin-bottom: 24px;">
           <h4 style="margin-bottom: 12px;">Registrar Recebimento do Mês</h4>
           <form id="form-pagamento" style="display: flex; gap: 12px; align-items: end; flex-wrap: wrap;">
              <div style="flex: 1; min-width: 120px;">
                <label style="font-size: 12px; display:block; margin-bottom:4px; font-weight: 500;">Mês Ref.</label>
                <input type="month" id="pag-mes" class="form-control" required>
              </div>
              <div style="flex: 1; min-width: 140px;">
                <label style="font-size: 12px; display:block; margin-bottom:4px; font-weight: 500;">Status</label>
                <select id="pag-status" class="form-control" required>
                   <option value="pago">Totalmente Pago</option>
                   <option value="parcial">Pago Parcial</option>
                   <option value="nao_pago">Inadimplente (Não Pago)</option>
                </select>
              </div>
              <div style="flex: 1; min-width: 120px;">
                <label style="font-size: 12px; display:block; margin-bottom:4px; font-weight: 500;">Valor Pago (R$)</label>
                <input type="number" step="0.01" id="pag-valor" class="form-control" required>
              </div>
              <div>
                <button type="submit" class="btn btn-primary" style="height: 42px;">Lançar</button>
              </div>
           </form>
        </div>
        
        <div class="table-container" style="max-height: 300px; overflow-y: auto;">
          <table id="table-pagamentos" style="font-size: 13px;">
            <thead style="position: sticky; top: 0; z-index: 1;">
              <tr>
                 <th>Ref. (Mês/Ano)</th>
                 <th>Data de Registro</th>
                 <th>Status</th>
                 <th>Valor Recebido</th>
                 <th>Recibo / Ações</th>
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

export async function initLocacoes() {
  const modal = document.getElementById('modal-locacao');
  const btnAdd = document.getElementById('btn-add-locacao');
  const btnClose = document.getElementById('close-modal-locacao');
  const btnCancel = document.getElementById('cancel-locacao');
  const form = document.getElementById('form-locacao');
  const tbody = document.querySelector('#table-locacoes tbody');
  const selectImovel = document.getElementById('locacao-imovel');
  const modalTitle = document.getElementById('modal-locacao-title');

  // Controle IPTU UI
  const iptuTipoInput = document.getElementById('locacao-iptu-tipo');
  const groupIptuParcelas = document.getElementById('group-iptu-parcelas');
  const lblIptuValor = document.getElementById('lbl-iptu-valor');
  
  if (iptuTipoInput) {
     iptuTipoInput.addEventListener('change', () => {
        const type = iptuTipoInput.value;
        if (type === 'parcelado') {
           groupIptuParcelas.style.display = 'block';
           lblIptuValor.innerText = 'Valor da Parcela Mensal (R$)';
        } else if (type === 'total') {
           groupIptuParcelas.style.display = 'none';
           lblIptuValor.innerText = 'Valor Total Único (R$)';
        } else {
           groupIptuParcelas.style.display = 'none';
           lblIptuValor.innerText = 'Valor (R$)';
           document.getElementById('locacao-iptu-valor').value = 0;
        }
     });
  }

  // Financeiro elements
  const modalFin = document.getElementById('modal-financeiro');
  const btnCloseFin = document.getElementById('close-modal-fin');
  const formPag = document.getElementById('form-pagamento');
  const tbodyPag = document.querySelector('#table-pagamentos tbody');
  const modalFinTitle = document.getElementById('modal-fin-title');

  let currentData = [];
  let editingId = null;
  let activeRentalFinId = null; 

  const openModal = async (editItem = null) => {
    try {
      if(modalTitle) modalTitle.innerText = editItem ? 'Editar Locação' : 'Nova Locação';
      const { data: allProps } = await db.select('properties');
      
      const data = allProps.filter(p => p.status === 'disponivel' || (editItem && p.id === editItem.property_id));
      if (data && data.length > 0) {
        selectImovel.innerHTML = data.map(p => `<option value="${p.id}">${p.title}</option>`).join('');
      } else {
        selectImovel.innerHTML = '<option value="">(Nenhum imóvel disponível)</option>';
      }
      modal.classList.add('open');
      
      // trigger change event to adjust UI for iptu type
      if(iptuTipoInput) iptuTipoInput.dispatchEvent(new Event('change'));
    } catch(e) {}
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
      const property_id = selectImovel.value;
      const status = document.getElementById('locacao-status').value;
      const payload = {
        property_id,
        tenant_name: document.getElementById('locacao-inquilino').value,
        tenant_document: document.getElementById('locacao-documento').value,
        start_date: document.getElementById('locacao-inicio').value,
        end_date: document.getElementById('locacao-fim').value || null,
        due_day: parseInt(document.getElementById('locacao-vencimento').value),
        monthly_rent: document.getElementById('locacao-valor').value,
        iptu_type: document.getElementById('locacao-iptu-tipo').value || 'isento',
        iptu_value: document.getElementById('locacao-iptu-valor').value || 0,
        iptu_installments: document.getElementById('locacao-iptu-parcelas').value || 1,
        condo_value: document.getElementById('locacao-condominio').value || 0,
        initial_condition: document.getElementById('locacao-condicao').value,
        status: status
      };

      if(!property_id) { alert('Selecione um imóvel válido'); return; }

      const { error } = editingId 
        ? await db.update('rentals', editingId, payload)
        : await db.insert('rentals', payload);
      
      if (error) alert('Erro ao salvar: ' + error.message);
      else {
        await db.update('properties', property_id, { status: status === 'ativo' ? 'alugado' : 'disponivel' });
        closeModal();
        loadLocacoes();
      }
    });
  }

  // MODAL FINANCEIRO LÓGICA
  if(btnCloseFin) btnCloseFin.addEventListener('click', () => {
     modalFin.classList.remove('open');
     activeRentalFinId = null;
  });

  if(formPag) {
     formPag.addEventListener('submit', async (e) => {
       e.preventDefault();
       const payload = {
          rental_id: activeRentalFinId,
          ref_month: document.getElementById('pag-mes').value, // YYYY-MM
          status: document.getElementById('pag-status').value, // pago, parcial, nao_pago
          amount_paid: document.getElementById('pag-valor').value
       };
       if(!activeRentalFinId) return;
       const { error } = await db.insert('payments', payload);
       if(error) alert(error.message);
       else {
          formPag.reset();
          loadPagamentos(activeRentalFinId); // refresh
       }
     });
  }

  window.openFinanceiro = (rental_id, imovelTitle) => {
     activeRentalFinId = rental_id;
     modalFinTitle.innerText = 'Histórico: ' + imovelTitle;
     
     const now = new Date();
     const m = ('0' + (now.getMonth() + 1)).slice(-2);
     document.getElementById('pag-mes').value = `${now.getFullYear()}-${m}`;
     
     const rental = currentData.find(r => r.id === rental_id);
     if(rental){
        const iptuAdd = rental.iptu_type === 'parcelado' ? Number(rental.iptu_value || 0) : 0;
        const totalAluguel = Number(rental.monthly_rent) + iptuAdd + Number(rental.condo_value || 0);
        document.getElementById('pag-valor').value = totalAluguel.toFixed(2);
     }
     
     loadPagamentos(rental_id);
     modalFin.classList.add('open');
  };

  window.deletePayment = async (pay_id) => {
    if(confirm('Tem certeza que deseja apagar esse registro?')){
      await db.delete('payments', pay_id);
      loadPagamentos(activeRentalFinId);
    }
  };

  window.generateReceipt = async (pay_id) => {
     const { data: payments } = await db.select('payments');
     const { data: rentals } = await db.select('rentals');
     const { data: props } = await db.select('properties');
     
     const pay = payments.find(p => p.id === pay_id);
     if(!pay) return;
     const rental = rentals.find(r => r.id === pay.rental_id);
     const prop = props.find(p => p.id === rental.property_id);
     
     // Quebrar ano/mês
     const dm = pay.ref_month.split('-');
     const mesDoc = dm[1] + '/' + dm[0];

     const html = `
       <html>
         <head>
           <title>Recibo de Aluguel - ${mesDoc}</title>
           <style>
             body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #222; }
             .receipt-box { border: 2px dashed #999; padding: 40px; border-radius: 8px; max-width: 800px; margin: 0 auto; position: relative; }
             .title { text-align: center; font-size: 26px; font-weight: bold; margin-bottom: 30px; border-bottom: 2px solid #222; padding-bottom: 10px; text-transform: uppercase; letter-spacing: 2px;}
             .amount { position: absolute; top: 40px; right: 40px; font-size: 22px; font-weight: bold; background: #e5e7eb; padding: 10px 20px; border-radius: 6px; border: 1px solid #d1d5db;}
             .content { font-size: 18px; line-height: 2; margin-bottom: 50px; text-align: justify; }
             .content strong { font-weight: 700; }
             .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end;}
             .date { font-size: 16px; }
             .signature { border-top: 1px solid #222; padding-top: 10px; width: 40%; text-align: center; font-weight: bold; }
             @media print { .receipt-box { border: 2px solid #000; } }
           </style>
         </head>
         <body>
           <div class="receipt-box">
             <div class="title">RECIBO DE PAGAMENTO</div>
             <div class="amount">R$ ${Number(pay.amount_paid).toLocaleString('pt-BR', {minimumFractionDigits:2})}</div>
             
             <div class="content">
                Recebi(emos) do(a) Sr(a). <strong>${rental.tenant_name.toUpperCase()}</strong>, inscrito(a) sob o documento <strong>${rental.tenant_document || '_______'}</strong>, 
                a importância líquida de <strong>R$ ${Number(pay.amount_paid).toLocaleString('pt-BR', {minimumFractionDigits:2})}</strong>,
                referente ao aluguel mensal e encargos associados (IPTU/Condomínio) de competência do mês <strong>${mesDoc}</strong>, 
                relativo ao imóvel situado no endereço: <strong>${prop.address || ''} (${prop.title})</strong>.
                <br><br>
                Por ser verdade, e para maior clareza, firmo(amos) o presente recibo dando plena e geral quitação do valor aqui discriminado.
             </div>
             
             <div class="footer">
                <div class="date">
                  <strong>Local e Data:</strong><br>
                  ________________, ${new Date().toLocaleDateString('pt-BR')}
                </div>
                <div class="signature">
                  Assinatura do Locador / Gestor
                </div>
             </div>
           </div>
           <script>
             window.print();
             setTimeout(() => window.close(), 1000); // Fecha a guia auto
           </script>
         </body>
       </html>
     `;
     
     const win = window.open('', '_blank');
     win.document.write(html);
     win.document.close();
  };

  async function loadPagamentos(rental_id) {
     try {
       const { data, error } = await db.select('payments');
       if(error) throw error;
       
       const payments = data.filter(p => p.rental_id === rental_id);
       
       if(!payments || payments.length === 0){
          tbodyPag.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum pagamento registrado</td></tr>';
          return;
       }
       
       payments.sort((a,b) => b.ref_month.localeCompare(a.ref_month));

       tbodyPag.innerHTML = payments.map(p => {
          let badgeStatus = '';
          let textStatus = '';
          if(p.status === 'pago') { badgeStatus='badge-disponivel'; textStatus='PAGO'; }
          else if(p.status === 'parcial') { badgeStatus='badge-vendido'; textStatus='PARCIAL'; }
          else { badgeStatus='badge-manutencao'; textStatus='INADIMPLENTE'; }
          
          const [y, m] = p.ref_month.split('-');

          return `
            <tr>
              <td><strong>${m}/${y}</strong></td>
              <td>${new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
              <td><span class="badge ${badgeStatus}">${textStatus}</span></td>
              <td>R$ ${Number(p.amount_paid).toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
              <td>
                <button class="btn btn-outline" onclick="generateReceipt('${p.id}')" title="Gerar Recibo PDF" style="padding: 4px 8px; font-size: 11px; margin-right: 4px;"><i data-lucide="printer" style="width:14px; height:14px;"></i> Recibo</button>
                <button class="btn-icon" onclick="deletePayment('${p.id}')" title="Excluir"><i data-lucide="trash-2" style="width:16px;"></i></button>
              </td>
            </tr>
          `;
       }).join('');
       createIcons({ icons });

     }catch(e){
       tbodyPag.innerHTML = '<tr><td colspan="5" style="color:var(--danger)">Erro ao ler base.</td></tr>';
     }
  }

  window.editLocacao = (id) => {
    const item = currentData.find(i => i.id === id);
    if (!item) return;
    editingId = id;
    openModal(item).then(() => {
      document.getElementById('locacao-imovel').value = item.property_id;
      document.getElementById('locacao-inquilino').value = item.tenant_name;
      document.getElementById('locacao-documento').value = item.tenant_document || '';
      document.getElementById('locacao-inicio').value = item.start_date;
      document.getElementById('locacao-fim').value = item.end_date || '';
      document.getElementById('locacao-vencimento').value = item.due_day || 5;
      document.getElementById('locacao-valor').value = Number(item.monthly_rent).toFixed(2);
      
      document.getElementById('locacao-iptu-tipo').value = item.iptu_type || 'isento';
      document.getElementById('locacao-iptu-valor').value = Number(item.iptu_value || 0).toFixed(2);
      document.getElementById('locacao-iptu-parcelas').value = item.iptu_installments || 10;
      
      document.getElementById('locacao-condominio').value = Number(item.condo_value || 0).toFixed(2);
      document.getElementById('locacao-condicao').value = item.initial_condition || '';
      document.getElementById('locacao-status').value = item.status || 'ativo';
      
      if(iptuTipoInput) iptuTipoInput.dispatchEvent(new Event('change'));
    });
  };

  window.deleteLocacao = async (id, prop_id) => {
    if(confirm('Tem certeza que deseja excluir tudo desta locação?')) {
      await db.delete('rentals', id);
      await db.update('properties', prop_id, { status: 'disponivel' });
      loadLocacoes();
    }
  };

  async function loadLocacoes() {
    try {
      const { data: rawData, error } = await db.select('rentals');
      if (error) throw error;
      
      const { data: allProps } = await db.select('properties');
      currentData = rawData;
      const mappedData = rawData.map(r => ({...r, properties: allProps.find(p => p.id === r.property_id)}));
      
      if (!mappedData || mappedData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhuma locação encontrada.</td></tr>';
        return;
      }

      tbody.innerHTML = mappedData.map(loc => {
         const tA = Number(loc.monthly_rent);
         const iType = loc.iptu_type || 'isento';
         const tI = Number(loc.iptu_value || 0);
         const numP = loc.iptu_installments || 1;
         const tC = Number(loc.condo_value || 0);
         
         const iptuPrt = iType === 'parcelado' ? ` +${numP}x R$ ${tI}` : (iType==='total' ? ` +1x R$ ${tI}` : '');
         
         const imovelNome = loc.properties?.title || 'Desconhecido';
         
         return `
          <tr>
            <td><strong>${imovelNome}</strong></td>
            <td>${loc.tenant_name}<br><small class="text-secondary">${loc.tenant_document || ''}</small></td>
            <td>
               Dia ${loc.due_day || 5} <small class="text-secondary">(Venc)</small><br>
               ${formatDate(loc.start_date)} até ${loc.end_date ? formatDate(loc.end_date) : '-'}
            </td>
            <td>
              <strong class="text-success">R$ ${tA.toLocaleString('pt-BR', {minimumFractionDigits: 2})} (A)</strong><br>
              <small class="text-secondary">Cond: R$ ${tC} | IPTU: ${iptuPrt}</small>
            </td>
            <td>
              <span class="badge ${loc.status === 'ativo' ? 'badge-disponivel' : 'badge-manutencao'}" style="margin-bottom:8px; display:inline-block;">${loc.status}</span><br>
              <div style="display:flex;">
                <button class="btn-icon" onclick="openFinanceiro('${loc.id}', '${imovelNome.replace(/'/g, "")}')" title="Financeiro / Pagamentos"><i data-lucide="dollar-sign"></i></button>
                <button class="btn-icon" onclick="editLocacao('${loc.id}')" title="Editar"><i data-lucide="edit"></i></button>
                <button class="btn-icon" onclick="deleteLocacao('${loc.id}', '${loc.property_id}')" title="Excluir"><i data-lucide="trash-2"></i></button>
              </div>
            </td>
          </tr>
        `
      }).join('');
      createIcons({ icons });
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger)">Erro ao carregar do banco local.</td></tr>';
    }
  }

  function formatDate(d) {
    if(!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  }

  loadLocacoes();
}
