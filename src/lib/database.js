// Gerenciador de Banco de Dados Local (Substitui o Supabase)
// Armazena dados no localStorage e permite exportar/importar via JSON.

function generateUUID() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export const db = {
  get(table) {
    const data = localStorage.getItem(`holding_${table}`);
    return data ? JSON.parse(data) : [];
  },
  
  save(table, data) {
    localStorage.setItem(`holding_${table}`, JSON.stringify(data));
  },
  
  async insert(table, item) {
    const data = this.get(table);
    const newItem = { id: generateUUID(), created_at: new Date().toISOString(), ...item };
    data.push(newItem);
    this.save(table, data);
    return { data: [newItem], error: null };
  },

  async select(table) {
    // Simula uma resposta do supabase: { data, error }
    const data = this.get(table);
    
    // Retorna um objeto que permite chaining básico como .order('created_at', { ascending: false })
    // Como simplificação, já retornaremos os dados ordenados do mais novo pro mais velho.
    const sorted = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Supabase JS retorna uma promise que resolve pra {data, error}
    return { data: sorted, error: null };
  },

  async update(table, id, updates) {
    const data = this.get(table);
    const index = data.findIndex(item => item.id === id);
    if (index === -1) return { error: { message: "Item não encontrado" } };
    
    data[index] = { ...data[index], ...updates };
    this.save(table, data);
    return { data: [data[index]], error: null };
  },

  async delete(table, id) {
    let data = this.get(table);
    data = data.filter(item => item.id !== id);
    this.save(table, data);
    return { data: null, error: null };
  },

  exportJSON() {
    const backup = {
      properties: this.get('properties'),
      rentals: this.get('rentals'),
      maintenances: this.get('maintenances'),
      transactions: this.get('transactions'),
      documents: this.get('documents'),
      version: '1.0',
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `holding-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backup = JSON.parse(e.target.result);
          if (backup.properties) this.save('properties', backup.properties);
          if (backup.rentals) this.save('rentals', backup.rentals);
          if (backup.maintenances) this.save('maintenances', backup.maintenances);
          if (backup.transactions) this.save('transactions', backup.transactions);
          if (backup.documents) this.save('documents', backup.documents);
          resolve(true);
        } catch (err) {
          reject(new Error("Arquivo JSON inválido ou corrompido."));
        }
      };
      reader.readAsText(file);
    });
  }
};
