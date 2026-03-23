import { db } from './database.js';

// Para habilitar, crie um projeto no Google Cloud, habilite a Google Drive API, crie credenciais OAuth e cole o Client ID abaixo.
const CLIENT_ID = '830275531265-2vcrqkofphidjmlc21n7tvccpgvh8j7o.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly';

let tokenClient;

export function initDrive() {
  if (typeof google === 'undefined' || !google.accounts) {
    setTimeout(initDrive, 500); // aguarda o script carregar
    return;
  }
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    hint: 'ivanw3arts@gmail.com',
    callback: '', 
  });
}

export async function uploadBackupToDrive() {
  if (CLIENT_ID.startsWith('INSIRA_SEU')) {
    alert("CONFIGURAÇÃO OAUTH PENDENTE:\nPara exportar diretamente pelo navegador, você precisa criar um projeto no Google Cloud Console, e inserir o seu 'Client ID' no arquivo src/lib/drive.js.");
    return Promise.reject(new Error("CONFIGURAÇÃO CLI_ID AUSENTE"));
  }
  
  return new Promise((resolve, reject) => {
    tokenClient.callback = async (resp) => {
      if (resp.error) return reject(resp);

      try {
        const backup = {
          properties: db.get('properties'),
          rentals: db.get('rentals'),
          maintenances: db.get('maintenances'),
          transactions: db.get('transactions'),
          payments: db.get('payments'),
          documents: db.get('documents'),
          version: '1.0',
          exportDate: new Date().toISOString()
        };
        const jsonStr = JSON.stringify(backup, null, 2);
        
        const fileName = `Holding_Backup_${new Date().toISOString().slice(0, 10)}.json`;
        
        const fileMetadata = { name: fileName, mimeType: 'application/json' };
        
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(fileMetadata)], {type: 'application/json'}));
        form.append('file', new Blob([jsonStr], {type: 'application/json'}));
        
        const r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
           method: 'POST',
           headers: { 'Authorization': 'Bearer ' + resp.access_token },
           body: form
        });
        
        const resData = await r.json();
        resolve(resData);
      } catch (e) {
        reject(e);
      }
    };
    
    tokenClient.requestAccessToken({prompt: ''});
  });
}

export async function downloadFromDrive() {
  if (CLIENT_ID.startsWith('INSIRA_SEU')) {
    alert("CONFIGURAÇÃO OAUTH PENDENTE:\nPara importar diretamente do navegador, insira o seu 'Client ID' no arquivo src/lib/drive.js.");
    return Promise.reject(new Error("CONFIGURAÇÃO CLI_ID AUSENTE"));
  }
  
  return new Promise((resolve, reject) => {
    tokenClient.callback = async (resp) => {
      if (resp.error) return reject(resp);
      try {
        // Find latest json backup using the Drive API
        const rList = await fetch("https://www.googleapis.com/drive/v3/files?q=mimeType='application/json' and name contains 'Holding_Backup_'&orderBy=createdTime desc&pageSize=5", {
          headers: { 'Authorization': 'Bearer ' + resp.access_token }
        });
        const listData = await rList.json();
        const files = listData.files;
        
        if(!files || files.length === 0) {
           alert("Nenhum backup encontrado no nome 'Holding_Backup_*.json' no seu Google Drive.");
           return resolve(false);
        }
        
        const latestInfo = files[0];
        if(!confirm(`Backup mais recente encontrado: ${latestInfo.name}\nDeseja restaurar este arquivo? (Isso substituirá seus dados locais atuais).`)) {
           return resolve(false); // aborted
        }

        const rFile = await fetch(`https://www.googleapis.com/drive/v3/files/${latestInfo.id}?alt=media`, {
          headers: { 'Authorization': 'Bearer ' + resp.access_token }
        });
        const jsonContent = await rFile.text();
        
        const blob = new Blob([jsonContent], {type: 'application/json'});
        const file = new File([blob], latestInfo.name, {type: 'application/json'});
        
        await db.importJSON(file);
        resolve(true);

      } catch (e) {
        reject(e);
      }
    };

    tokenClient.requestAccessToken({prompt: ''});
  });
}
