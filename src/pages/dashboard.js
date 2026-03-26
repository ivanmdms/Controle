import { db } from '../lib/database.js';
import { icons, createIcons } from 'lucide';
import { initDrive, uploadBackupToDrive, downloadFromDrive } from '../lib/drive.js';

export async function renderDashboard() {
  return `
    <div class="header-actions">
      <h2>Painel de Controle Patrimonial</h2>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <select id="dash-filter-cidade" class="form-control" style="width: auto; min-width: 150px;">
          <option value="">Todas Cidades</option>
          <option value="Boituva">Boituva</option>
          <option value="Cerquilho">Cerquilho</option>
          <option value="Rio das Pedras">Rio das Pedras</option>
          <option value="Araras">Araras</option>
        </select>
        <select id="dash-filter-prop" class="form-control" style="width: auto; min-width: 150px;">
          <option value="">Todos Proprietários</option>
        </select>
        
        <button class="btn btn-outline" id="btn-export-drive" style="color: var(--primary); border-color: var(--primary);"><i data-lucide="cloud-upload"></i> Salvar no GDrive</button>
        <button class="btn btn-outline" id="btn-import-drive" style="color: var(--primary); border-color: var(--primary);"><i data-lucide="cloud-download"></i> Carregar do GDrive</button>
        
        <button class="btn btn-outline" id="btn-export"><i data-lucide="download"></i> Exportar Local</button>
        <button class="btn btn-outline" id="btn-import"><i data-lucide="upload"></i> Importar Local</button>
        <input type="file" id="import-file" style="display: none;" accept=".json">
        <button class="btn btn-outline" onclick="window.location.reload()"><i data-lucide="refresh-cw"></i> Atualizar</button>
      </div>
    </div>
    
    <div class="grid">
      <div class="card">
        <div class="card-header">
          <span>Receitas Ativas Previstas</span>
          <i data-lucide="trending-up" class="text-success"></i>
        </div>
        <div class="card-value" id="dash-receitas">Carregando...</div>
        <div class="card-subtitle">Incluso Aluguel + IPTU + Cond.</div>
      </div>
      <div class="card">
        <div class="card-header">
          <span>Despesas Lançadas Mensal</span>
          <i data-lucide="wrench" class="text-danger"></i>
        </div>
        <div class="card-value" id="dash-despesas">Carregando...</div>
      </div>
      <div class="card">
        <div class="card-header">
          <span>Resultado Operacional</span>
          <i data-lucide="dollar-sign" class="text-primary"></i>
        </div>
        <div class="card-value text-success" id="dash-liquido">Carregando...</div>
      </div>
    </div>

    <!-- Evolução Anual -->
    <div class="card" style="margin-top: 24px;">
      <div class="card-header">
        <span>Evolução Anual (Balanço Geral ${new Date().getFullYear()})</span>
        <i data-lucide="bar-chart-2" class="text-primary"></i>
      </div>
      <div style="height: 300px; width: 100%; margin-top: 16px;">
         <canvas id="annualChart"></canvas>
      </div>
    </div>

    <!-- Gráfico e Status de Mês Selecionável -->
    <div class="card" style="margin-top: 24px; padding: 0; overflow: hidden;">
      <div style="background: var(--surface-color); padding: 16px 24px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
         <h3 style="margin: 0;">Análise de Aluguéis</h3>
         <div>
            <input type="month" id="filter-month" class="form-control" style="width: auto; display: inline-block;">
         </div>
      </div>
      <div id="dash-status-mes">
         <div style="padding: 24px; text-align: center;" class="text-secondary">Carregando panorama financeiro...</div>
      </div>
    </div>

    <!-- Seção de Alertas -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 24px; margin-top: 24px;">
      <div style="background: var(--surface-color); border-radius: var(--radius-lg); border: 1px solid var(--border-color); padding: 24px; box-shadow: var(--shadow-sm);">
        <h3 style="margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; font-size: 16px;">
           <i data-lucide="calendar-clock" style="vertical-align: middle; color: var(--warning); margin-right: 8px;"></i> 
           Aluguéis vencendo em breve (Próx 5 dias)
        </h3>
        <ul id="alert-vencimentos" style="list-style: none; padding: 0; margin: 0;">
           <li class="text-secondary" style="font-size: 14px;">Analisando...</li>
        </ul>
      </div>

      <div style="background: var(--surface-color); border-radius: var(--radius-lg); border: 1px solid var(--border-color); padding: 24px; box-shadow: var(--shadow-sm);">
        <h3 style="margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; font-size: 16px;">
           <i data-lucide="calendar-heart" style="vertical-align: middle; color: var(--primary); margin-right: 8px;"></i> 
           Término / Reajuste (Menos de 30 dias)
        </h3>
        <ul id="alert-aniversarios" style="list-style: none; padding: 0; margin: 0;">
           <li class="text-secondary" style="font-size: 14px;">Analisando...</li>
        </ul>
      </div>
    </div>
  `;
}

export async function initDashboard() {
  initDrive();
  
  const btnExport = document.getElementById('btn-export');
  const btnImport = document.getElementById('btn-import');
  const fileImport = document.getElementById('import-file');
  const btnDriveExport = document.getElementById('btn-export-drive');
  const btnDriveImport = document.getElementById('btn-import-drive');
  const filterMonthInput = document.getElementById('filter-month');
  
  if(btnDriveExport) {
    btnDriveExport.addEventListener('click', async () => {
       btnDriveExport.innerText = "Salvando...";
       try {
         await uploadBackupToDrive();
         alert("Backup salvo com sucesso no seu Google Drive!");
       } catch(e) {
         if(e.message !== "CONFIGURAÇÃO CLI_ID AUSENTE") {
           alert("Falha: " + (e.message || JSON.stringify(e)));
         }
       } finally {
         btnDriveExport.innerHTML = '<i data-lucide="cloud-upload"></i> Salvar no GDrive';
         createIcons({ icons });
       }
    });
  }

  if(btnDriveImport) {
    btnDriveImport.addEventListener('click', async () => {
       btnDriveImport.innerText = "Carregando...";
       try {
         const sucesso = await downloadFromDrive();
         if(sucesso) {
            alert("Backup do Google Drive importado com sucesso!");
            window.location.reload();
         }
       } catch(e) {
         if(e.message !== "CONFIGURAÇÃO CLI_ID AUSENTE") {
           alert("Falha ao recuperar backup: " + (e.message || JSON.stringify(e)));
         }
       } finally {
         btnDriveImport.innerHTML = '<i data-lucide="cloud-download"></i> Carregar do GDrive';
         createIcons({ icons });
       }
    });
  }

  if(btnExport) btnExport.addEventListener('click', () => db.exportJSON());
  if(btnImport) btnImport.addEventListener('click', () => fileImport.click());
  if(fileImport) {
    fileImport.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if(!file) return;
      try {
        await db.importJSON(file);
        alert("Backup restaurado com sucesso!");
        window.location.reload();
      } catch (err) {
        alert("Erro ao importar: " + err.message);
      }
    });
  }

  try {
    const { data: allRentals } = await db.select('rentals');
    const { data: allProps } = await db.select('properties');
    const { data: allPayments } = await db.select('payments');
    const { data: expenses } = await db.select('maintenances');
    const { data: transacs } = await db.select('transactions');
    const { data: owners } = await db.select('owners');

    const filterProp = document.getElementById('dash-filter-prop');
    const filterCidade = document.getElementById('dash-filter-cidade');

    if(filterProp && owners) {
       filterProp.innerHTML = '<option value="">Todos Proprietários</option>' + owners.map(o => `<option value="${o.id}">${o.name}</option>`).join('');
    }

    if(filterProp) filterProp.addEventListener('change', updateDashboardStats);
    if(filterCidade) filterCidade.addEventListener('change', updateDashboardStats);

    let chartInstance = null;
    const filterMonthInput = document.getElementById('filter-month');
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonthStr = `${today.getFullYear()}-${('0' + (today.getMonth() + 1)).slice(-2)}`;
    
    // Set Input Default
    if (filterMonthInput) {
       filterMonthInput.value = currentMonthStr;
       filterMonthInput.addEventListener('change', () => {
          updateDashboardStats();
       });
    }

    function updateDashboardStats() {
       const cityParam = filterCidade ? filterCidade.value : '';
       const propParam = filterProp ? filterProp.value : '';

       // Filter properties based on Selects
       let filteredProps = allProps || [];
       const isFiltering = !!(cityParam || propParam);
       
       if(cityParam) filteredProps = filteredProps.filter(p => p.city === cityParam);
       if(propParam) filteredProps = filteredProps.filter(p => p.owner_id === propParam);
       
       const propIds = filteredProps.map(p => p.id);

       // Filter everything else based on properties
       const rentals = (allRentals || []).filter(r => r.status === 'ativo' && (!isFiltering || propIds.includes(r.property_id)));
       const payments = (allPayments || []).filter(p => {
          if (!isFiltering) return true;
          const r = (allRentals || []).find(x => x.id === p.rental_id);
          return r && propIds.includes(r.property_id);
       });
       const filteredExpenses = (expenses || []).filter(m => {
          if (!isFiltering) return true;
          return m.property_id ? propIds.includes(m.property_id) : false;
       });
       const filteredTransacs = (transacs || []).filter(t => {
          if (!isFiltering) return true;
          return t.property_id ? propIds.includes(t.property_id) : false;
       });

       rentals.forEach(r => {
          r.imovelNome = filteredProps.find(p => p.id === r.property_id)?.title || 'Desconhecido';
       });

       // FUNCTION TO RENDER MONTHLY PANORAMA
       const selectedMonthStr = filterMonthInput ? filterMonthInput.value : currentMonthStr;
       if(selectedMonthStr) {
          let stats = { paid: 0, pending: 0, unpaid: 0 };
          const isPastMonth = selectedMonthStr < currentMonthStr; // ex: 2026-02 < 2026-03
          const isFutureMonth = selectedMonthStr > currentMonthStr;

       const rentalsStatus = rentals.map(r => {
          const pay = payments.find(p => p.rental_id === r.id && p.ref_month === selectedMonthStr);
          let status = 'pending';
          let statusText = 'Pendente';
          let colorBg = 'var(--warning)';
          let colorText = '#333';
          
          if(pay) {
             if(pay.status === 'pago') { 
               status = 'paid'; statusText = 'Pago'; colorBg = 'var(--success)'; colorText = '#fff';
             }
             else if(pay.status === 'parcial') { 
               status = 'unpaid'; statusText = 'Pago Parcial (Devendo)'; colorBg = 'var(--danger)'; colorText = '#fff';
             }
             else { 
               status = 'unpaid'; statusText = 'Não Pago'; colorBg = 'var(--danger)'; colorText = '#fff';
             }
          } else {
             // Lógica temporal para quando nao tem "pay" lançado
             if(isPastMonth) {
                status = 'unpaid'; statusText = 'Inadimplente (Tempo Esgotado)'; colorBg = 'var(--danger)'; colorText = '#fff';
             } else if(isFutureMonth) {
                const due = Number(r.due_day) || 31;
                status = 'pending'; statusText = `Vencerá dia ${due}`; colorBg = 'var(--warning)'; colorText = '#333';
             } else {
                // Mes atual
                const due = Number(r.due_day) || 31;
                if(due < currentDay) {
                   status = 'unpaid'; statusText = `Atrasado (Venceu Dia ${due})`; colorBg = 'var(--danger)'; colorText = '#fff';
                } else {
                   status = 'pending'; statusText = `Vence dia ${due}`; colorBg = 'var(--warning)'; colorText = '#333';
                }
             }
          }
          
          stats[status]++;
          return { ...r, currentStatus: status, statusText, colorBg, colorText };
       });

       const totalRentals = rentals.length;
       const pctPaid = totalRentals ? (stats.paid / totalRentals) * 100 : 0;
       const pctPending = totalRentals ? (stats.pending / totalRentals) * 100 : 0;
       const pctUnpaid = totalRentals ? (stats.unpaid / totalRentals) * 100 : 0;

       const divPanorama = document.getElementById('dash-status-mes');
       if(totalRentals === 0) {
         divPanorama.innerHTML = '<div style="padding:24px; text-align:center;" class="text-secondary">Nenhum imóvel locado no momento.</div>';
       } else {
         divPanorama.innerHTML = `
           <div style="padding: 24px; border-bottom: 1px solid var(--border-color);">
             
             <!-- Bar Chart -->
             <div style="display: flex; height: 32px; border-radius: 16px; overflow: hidden; background: var(--bg-color); box-shadow: inset 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 24px;">
                <div style="width: ${pctPaid}%; background: var(--success); display: flex; align-items:center; justify-content:center; color:white; font-weight:bold; font-size:12px; transition: width 0.5s;">
                  ${pctPaid > 5 ? stats.paid : ''}
                </div>
                <div style="width: ${pctPending}%; background: var(--warning); display: flex; align-items:center; justify-content:center; color:#333; font-weight:bold; font-size:12px; transition: width 0.5s;">
                  ${pctPending > 5 ? stats.pending : ''}
                </div>
                <div style="width: ${pctUnpaid}%; background: var(--danger); display: flex; align-items:center; justify-content:center; color:white; font-weight:bold; font-size:12px; transition: width 0.5s;">
                  ${pctUnpaid > 5 ? stats.unpaid : ''}
                </div>
             </div>
             
             <!-- Legend -->
             <div style="display: flex; justify-content: space-around; font-size: 14px; flex-wrap: wrap; gap: 8px;">
                <div style="display:flex; align-items:center;">
                  <span style="width:12px; height:12px; border-radius:50%; background:var(--success); margin-right:8px;"></span>
                  <strong>Pagaram (${stats.paid})</strong>
                </div>
                <div style="display:flex; align-items:center;">
                  <span style="width:12px; height:12px; border-radius:50%; background:var(--warning); margin-right:8px;"></span>
                  <strong>Pendentes (${stats.pending})</strong>
                </div>
                <div style="display:flex; align-items:center;">
                  <span style="width:12px; height:12px; border-radius:50%; background:var(--danger); margin-right:8px;"></span>
                  <strong>Inadimplentes (${stats.unpaid})</strong>
                </div>
             </div>
           </div>
           
           <div style="padding: 0; max-height: 400px; overflow-y: auto;">
              <table style="font-size: 13px; margin: 0; width: 100%; border-collapse: collapse;">
                 <thead style="position: sticky; top: 0; z-index: 1;">
                   <tr style="background: var(--bg-color); border-bottom: 1px solid var(--border-color);">
                     <th style="padding: 12px 24px; text-align:left;">Imóvel</th>
                     <th style="padding: 12px 24px; text-align:left;">Inquilino</th>
                     <th style="padding: 12px 24px; text-align:center;">Situação do Mês</th>
                   </tr>
                 </thead>
                 <tbody>
                    ${rentalsStatus.map(r => `
                      <tr style="border-bottom: 1px solid var(--border-color);">
                        <td style="padding: 12px 24px;"><strong>${r.imovelNome}</strong></td>
                        <td style="padding: 12px 24px;">${r.tenant_name}</td>
                        <td style="padding: 12px 24px; text-align:center;">
                          <span style="padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; background: ${r.colorBg}; color: ${r.colorText};">
                            ${r.statusText}
                          </span>
                        </td>
                      </tr>
                    `).join('')}
                 </tbody>
              </table>
           </div>
         `;
       }
    }
    
    // removed renderMonthlyPanorama call because it is now inline
    // ==========================================
    // ANNUAL CHART (CHART.JS)
    // ==========================================
    const ctx = document.getElementById('annualChart');
    if (ctx && window.Chart) {
       const monthsLabel = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
       const annualIncome = Array(12).fill(0);
       const annualExpense = Array(12).fill(0);
       
       const currentYear = today.getFullYear().toString();
       
       // Income (Rentals)
       payments.forEach(p => {
          if((p.status === 'pago' || p.status === 'parcial') && p.ref_month.startsWith(currentYear)) {
             const mIndex = parseInt(p.ref_month.split('-')[1], 10) - 1;
             annualIncome[mIndex] += Number(p.amount_paid);
          }
       });
       
          // Transactions (Buy = Expense, Sell = Income)
          filteredTransacs.forEach(t => {
             if(t.transaction_date && t.transaction_date.startsWith(currentYear)) {
                const mIndex = parseInt(t.transaction_date.split('-')[1], 10) - 1;
                if(t.transaction_type === 'venda') {
                   annualIncome[mIndex] += Number(t.net_total);
                } else if(t.transaction_type === 'compra') {
                   annualExpense[mIndex] += Number(t.net_total);
                }
             }
          });
          
          // Expenses (Maintenances)
          filteredExpenses.forEach(m => {
             if(m.service_date && m.service_date.startsWith(currentYear)) {
                const mIndex = parseInt(m.service_date.split('-')[1], 10) - 1;
                annualExpense[mIndex] += Number(m.repair_cost);
             }
          });
       
          if(chartInstance) {
            chartInstance.data.datasets[0].data = annualIncome;
            chartInstance.data.datasets[1].data = annualExpense;
            chartInstance.update();
          } else {
             chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                   labels: monthsLabel,
                   datasets: [
                      {
                         label: 'Receitas (Aluguéis, Vendas)',
                         data: annualIncome,
                         backgroundColor: '#22c55e', 
                         borderRadius: 4
                      },
                      {
                         label: 'Despesas (Manutenção, Compras)',
                         data: annualExpense,
                         backgroundColor: '#ef4444', 
                         borderRadius: 4
                      }
                   ]
                },
                options: {
                   responsive: true,
                   maintainAspectRatio: false,
                   scales: {
                      y: { 
                         beginAtZero: true, 
                         ticks: { callback: v => 'R$ '+v.toLocaleString('pt-BR') } 
                      }
                   },
                   plugins: {
                      tooltip: {
                         callbacks: { 
                            label: c => c.dataset.label + ': R$ ' + c.raw.toLocaleString('pt-BR', {minimumFractionDigits:2}) 
                         }
                      }
                   }
                }
             });
          }
    }

    // ==========================================
    // ALERTAS E TOTAIS RESUMO
    // ==========================================
    const vencimentos = rentals.filter(r => {
       const due = Number(r.due_day);
       if(!due) return false;
       let diff = due - currentDay;
       if(diff < 0) diff += 30; 
       return diff >= 0 && diff <= 5;
    }).sort((a,b) => Number(a.due_day) - Number(b.due_day));

    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const aniversarios = rentals.filter(r => {
       r.terminationOrAnniv = null;
       r.daysToAlert = 999;
       r.alertType = "";
       
       if(r.end_date) {
         const [eYear, eMonth, eDay] = r.end_date.split('-');
         const endDateObj = new Date(eYear, eMonth - 1, eDay);
         const diffMs = endDateObj - todayDateOnly;
         const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
         if (diffDays <= 30 && diffDays >= -60) {
           r.daysToAlert = diffDays;
           r.alertType = "Término de Contrato";
           r.terminationOrAnniv = endDateObj;
         }
       }
       
       if(r.start_date && r.daysToAlert > 30) {
          const [sYear, sMonth, sDay] = r.start_date.split('-');
          const start = new Date(sYear, sMonth - 1, sDay);
          let anniv = new Date(start);
          anniv.setFullYear(today.getFullYear());
          if (anniv < todayDateOnly) anniv.setFullYear(today.getFullYear() + 1);
          
          const diffMs = anniv - todayDateOnly;
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          const yearsCompleted = anniv.getFullYear() - start.getFullYear();
          
          if (diffDays <= 30 && diffDays >= 0 && yearsCompleted >= 1) {
             r.daysToAlert = diffDays;
             r.alertType = `Reajuste (${yearsCompleted} anos)`;
             r.terminationOrAnniv = anniv;
          }
       }
       
       return r.daysToAlert <= 30;
    }).sort((a,b) => a.daysToAlert - b.daysToAlert);

    let totalR = 0;
    rentals.forEach(r => {
      totalR += Number(r.monthly_rent) + Number(r.iptu_value || 0) + Number(r.condo_value || 0);
    });
    
    let totalD = 0;
    if (filteredExpenses) totalD = filteredExpenses.reduce((acc, curr) => acc + Number(curr.repair_cost), 0);
    
    document.getElementById('dash-receitas').innerText = 'R$ ' + totalR.toLocaleString('pt-BR', {minimumFractionDigits: 2});
    document.getElementById('dash-despesas').innerText = 'R$ ' + totalD.toLocaleString('pt-BR', {minimumFractionDigits: 2});
    
    const liqId = document.getElementById('dash-liquido');
    liqId.innerText = 'R$ ' + (totalR - totalD).toLocaleString('pt-BR', {minimumFractionDigits: 2});
    if(totalR - totalD < 0) {
      liqId.classList.remove('text-success');
      liqId.classList.add('text-danger');
    }

    const listVenc = document.getElementById('alert-vencimentos');
    if(vencimentos.length === 0){
       listVenc.innerHTML = '<li class="text-secondary" style="font-size: 14px;">Nenhum aluguel com vencimento para os próximos 5 dias.</li>';
    } else {
       listVenc.innerHTML = vencimentos.map(v => `
         <li style="padding: 12px 0; border-bottom: 1px solid var(--border-color); font-size: 14px; display:flex; justify-content:space-between;">
            <div>
              <strong>${v.imovelNome}</strong><br>
              <span class="text-secondary">Inquilino: ${v.tenant_name}</span>
            </div>
            <div style="text-align:right;">
               <span class="badge" style="background:var(--warning); color:#333;">Dia ${v.due_day}</span>
            </div>
         </li>
       `).join('');
    }

    const listAniv = document.getElementById('alert-aniversarios');
    if(aniversarios.length === 0){
       listAniv.innerHTML = '<li class="text-secondary" style="font-size: 14px;">Nenhum contrato expirando ou completando aniversário nos próximos 30 dias.</li>';
    } else {
       listAniv.innerHTML = aniversarios.map(a => `
         <li style="padding: 12px 0; border-bottom: 1px solid var(--border-color); font-size: 14px; display:flex; justify-content:space-between;">
            <div>
              <strong>${a.imovelNome}</strong><br>
              <span class="text-secondary">${a.alertType}: ${a.terminationOrAnniv.toLocaleDateString('pt-BR')}</span>
            </div>
            <div style="text-align:right;">
               <span class="badge" style="background:${a.daysToAlert < 0 ? 'var(--danger)' : 'var(--primary)'}; color:#fff;">
                 ${a.daysToAlert < 0 ? 'Vencido há ' + Math.abs(a.daysToAlert) + ' dias' : 'Faltam ' + a.daysToAlert + ' dia(s)'}
               </span>
            </div>
         </li>
       `).join('');
    }

    createIcons({ icons });
  } // End of updateDashboardStats

  updateDashboardStats();

  } catch(e) {
    console.error("Erro no initDashboard:", e);
    document.getElementById('dash-receitas').innerText = 'R$ 0,00';
    document.getElementById('dash-despesas').innerText = 'R$ 0,00';
    document.getElementById('dash-liquido').innerText = 'R$ 0,00';
  }
}
