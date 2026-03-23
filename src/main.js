import { createIcons, icons } from 'lucide';
import { renderDashboard, initDashboard } from './pages/dashboard.js';
import { renderImoveis, initImoveis } from './pages/imoveis.js';
import { renderLocacoes, initLocacoes } from './pages/locacoes.js';
import { renderManutencoes, initManutencoes } from './pages/manutencoes.js';
import { renderTransacoes, initTransacoes } from './pages/transacoes.js';
import { renderDocumentos, initDocumentos } from './pages/documentos.js';

// Theme toggler
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
  const icon = document.body.classList.contains('dark-theme') ? 'sun' : 'moon';
  themeToggle.innerHTML = `<i data-lucide="${icon}"></i>`;
  createIcons({ icons });
});

// Routing
const navItems = document.querySelectorAll('.nav-item');
const pageTitle = document.getElementById('page-title');
const contentArea = document.getElementById('content-area');

const pages = {
  dashboard: { title: 'Dashboard Mensal', render: renderDashboard, init: initDashboard },
  imoveis: { title: 'Imóveis da Holding', render: renderImoveis, init: initImoveis },
  locacoes: { title: 'Gestão de Locações', render: renderLocacoes, init: initLocacoes },
  manutencoes: { title: 'Reformas e Manutenções', render: renderManutencoes, init: initManutencoes },
  transacoes: { title: 'Transações Patrimoniais', render: renderTransacoes, init: initTransacoes },
  documentos: { title: 'Acervo de Documentos', render: renderDocumentos, init: initDocumentos },
};

async function navigate(path) {
  navItems.forEach(item => {
    item.classList.remove('active');
    if(item.dataset.path === path) item.classList.add('active');
  });

  const page = pages[path] || pages.dashboard;
  pageTitle.textContent = page.title;
  contentArea.innerHTML = '<p class="text-secondary">Carregando modulo...</p>';
  
  try {
    const html = await page.render();
    contentArea.innerHTML = html;
    createIcons({ icons });
    if(page.init) await page.init();
  } catch (err) {
    contentArea.innerHTML = `<p class="text-danger">Erro de renderização: ${err.message}</p>`;
  }
}

// Router listener
window.addEventListener('hashchange', () => {
  const path = window.location.hash.replace('#', '') || 'dashboard';
  navigate(path);
});

// Init on load
const initPath = window.location.hash.replace('#', '') || 'dashboard';
navigate(initPath);
createIcons({ icons });
