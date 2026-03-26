import { db } from '../lib/database.js';
import { icons, createIcons } from 'lucide';

export async function renderLocacoes() {
  return `
    <div class="header-actions">
      <h2>Controle de Locações</h2>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-outline" id="btn-zerar-valores" style="color: var(--warning); border-color: var(--warning);" title="Zerar valores de todas locações"><i data-lucide="refresh-cw"></i> Zerar Todos Valores</button>
        <button class="btn btn-primary" id="btn-add-locacao"><i data-lucide="plus"></i> Nova Locação</button>
      </div>
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
            <label>WhatsApp do Inquilino</label>
            <input type="text" id="locacao-whatsapp" class="form-control" placeholder="Apenas números ex: 5511999999999">
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
            <button type="button" class="btn btn-outline" id="limpar-valores-locacao" style="margin-right: 8px; float: left;"><i data-lucide="eraser" style="width:16px; height:16px;"></i> Limpar Valores</button>
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
                 <th style="min-width: 250px;">Ações</th>
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

  const btnZerarTodos = document.getElementById('btn-zerar-valores');
  if(btnZerarTodos) {
    btnZerarTodos.addEventListener('click', async () => {
      if(confirm('ATENÇÃO: Isso zerará os valores de Aluguel, IPTU e Condomínio de TODAS as locações ativas e inativas. Tem certeza?')) {
        const { data: rentals } = await db.select('rentals');
        if(rentals && rentals.length > 0) {
          for (const r of rentals) {
            await db.update('rentals', r.id, { monthly_rent: 0, iptu_value: 0, condo_value: 0 });
          }
          alert('Valores zerados com sucesso.');
          loadLocacoes();
        }
      }
    });
  }

  const btnLimparValores = document.getElementById('limpar-valores-locacao');
  if(btnLimparValores) {
    btnLimparValores.addEventListener('click', () => {
      document.getElementById('locacao-valor').value = 0;
      document.getElementById('locacao-condominio').value = 0;
      document.getElementById('locacao-iptu-valor').value = 0;
      document.getElementById('locacao-iptu-parcelas').value = 1;
      if (iptuTipoInput) {
        iptuTipoInput.value = 'isento';
        iptuTipoInput.dispatchEvent(new Event('change'));
      }
    });
  }

  if(form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const property_id = selectImovel.value;
      const status = document.getElementById('locacao-status').value;
      const payload = {
        property_id,
        tenant_name: document.getElementById('locacao-inquilino').value,
        tenant_document: document.getElementById('locacao-documento').value,
        tenant_whatsapp: document.getElementById('locacao-whatsapp').value,
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

  window.generateReceiptImage = async (pay_id) => {
     const { data: payments } = await db.select('payments');
     const { data: rentals } = await db.select('rentals');
     const { data: props } = await db.select('properties');
     
     const pay = payments.find(p => p.id === pay_id);
     if(!pay) return;
     const rental = rentals.find(r => r.id === pay.rental_id);
     const prop = props.find(p => p.id === rental.property_id);
     
     const dm = pay.ref_month.split('-');
     const mesDoc = dm[1] + '/' + dm[0];

     const html = `
       <div id="receipt-container" style="width: 800px; padding: 40px; background: white; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #222; position: absolute; left: -9999px;">
         <div style="border: 2px dashed #999; padding: 40px; border-radius: 8px;">
           <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #222; padding-bottom: 20px; margin-bottom: 30px;">
             <div style="font-size: 26px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">RECIBO DE PAGAMENTO</div>
             <div style="font-size: 22px; font-weight: bold; background: #e5e7eb; padding: 10px 20px; border-radius: 6px; border: 1px solid #d1d5db;">R$ ${Number(pay.amount_paid).toLocaleString('pt-BR', {minimumFractionDigits:2})}</div>
           </div>
           
           <div style="font-size: 18px; line-height: 2; margin-bottom: 50px; text-align: justify;">
              Recebi(emos) do(a) Sr(a). <strong>${rental.tenant_name.toUpperCase()}</strong>, inscrito(a) sob o documento <strong>${rental.tenant_document || '_______'}</strong>, 
              a importância líquida de <strong>R$ ${Number(pay.amount_paid).toLocaleString('pt-BR', {minimumFractionDigits:2})}</strong>,
              referente ao aluguel mensal e encargos associados (IPTU/Condomínio) de competência do mês <strong>${mesDoc}</strong>, 
              relativo ao imóvel situado no endereço: <strong>${prop.address || ''} (${prop.title})</strong>.
              <br><br>
              Por ser verdade, e para maior clareza, firmo(amos) o presente recibo dando plena e geral quitação do valor aqui discriminado.
           </div>
           
           <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 60px;">
              <div style="font-size: 16px;">
                <strong>Local e Data:</strong><br>
                ________________, ${new Date().toLocaleDateString('pt-BR')}
              </div>
              <div style="border-top: 1px solid #222; padding-top: 10px; width: 40%; text-align: center; font-weight: bold;">
                <div style="font-family: 'Homemade Apple', cursive, Arial; font-size: 28px; font-weight: normal; margin-bottom: 5px; color: #1a1a1a;">Ivan Mendes</div>
                Assinatura do Locador
              </div>
           </div>
         </div>
       </div>
     `;
     
     const div = document.createElement('div');
     div.innerHTML = html;
     document.body.appendChild(div);

     try {
       const canvas = await html2canvas(document.getElementById('receipt-container'), { scale: 2 });
       const imgData = canvas.toDataURL('image/jpeg', 0.9);
       const a = document.createElement('a');
       a.href = imgData;
       a.download = `Recibo_Aluguel_${rental.tenant_name.replace(/\s/g, '_')}_${mesDoc.replace('/','-')}.jpg`;
       a.click();
     } catch (e) {
       alert('Erro ao gerar imagem do recibo.');
     } finally {
       document.body.removeChild(div);
     }
  };

  window.sendWhatsApp = async (pay_id) => {
     const { data: payments } = await db.select('payments');
     const { data: rentals } = await db.select('rentals');
     
     const pay = payments.find(p => p.id === pay_id);
     if(!pay) return;
     const rental = rentals.find(r => r.id === pay.rental_id);
     
     let whatsapp = rental.tenant_whatsapp;
     if(!whatsapp) {
        alert('WhatsApp do inquilino não cadastrado na Locação.');
        return;
     }

     whatsapp = whatsapp.replace(/\D/g, ''); // manter apenas numeros
     const text = `Olá ${rental.tenant_name}, acusamos o recebimento do seu aluguel no valor de R$ ${Number(pay.amount_paid).toLocaleString('pt-BR',{minimumFractionDigits:2})}. Segue anexo o recibo.`;
     const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`;
     window.open(url, '_blank');
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
                <div style="display:flex; margin-bottom:4px;">
                  <button class="btn btn-outline" onclick="generateReceiptImage('${p.id}')" title="Gerar JPG" style="padding: 4px 8px; font-size: 11px; margin-right: 4px;"><i data-lucide="image" style="width:14px; height:14px;"></i> JPG</button>
                  <button class="btn btn-outline" onclick="sendWhatsApp('${p.id}')" title="WhatsApp" style="padding: 4px 8px; font-size: 11px; margin-right: 4px; border-color:#10b981; color:#10b981;"><i data-lucide="message-square" style="width:14px; height:14px;"></i> Whats</button>
                </div>
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
      document.getElementById('locacao-whatsapp').value = item.tenant_whatsapp || '';
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
