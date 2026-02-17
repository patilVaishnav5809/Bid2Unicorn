
const STORAGE_PREFIX = 'base44_data_';
const EVENTS = new EventTarget();

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Mock Data
const SEED_DATA = {
  Startup: [
    {
      id: 's1',
      name: 'PayPulse',
      domain: 'fintech',
      description: 'Revolutionary payment gateway for micro-transactions.',
      logo_url: '',
      base_price: 50,
      current_price: 50,
      status: 'upcoming',
      order: 1,
      created_date: new Date().toISOString()
    },
    {
      id: 's2',
      name: 'MediConnect',
      domain: 'healthtech',
      description: 'Telemedicine platform connecting rural patients with specialists.',
      logo_url: '',
      base_price: 40,
      current_price: 40,
      status: 'upcoming',
      order: 2,
      created_date: new Date().toISOString()
    },
    {
      id: 's3',
      name: 'EduSphere',
      domain: 'edtech',
      description: 'AI-driven personalized learning paths for K-12 students.',
      logo_url: '',
      base_price: 45,
      current_price: 45,
      status: 'upcoming',
      order: 3,
      created_date: new Date().toISOString()
    },
    {
      id: 's4',
      name: 'EcoEnergy',
      domain: 'cleantech',
      description: 'Sustainable energy solutions for urban homes.',
      logo_url: '',
      base_price: 60,
      current_price: 60,
      status: 'upcoming',
      order: 4,
      created_date: new Date().toISOString()
    }
  ],
  Team: [
    {
      id: 't1',
      name: 'Alpha Ventures',
      logo_url: '',
      total_budget: 500,
      spent: 0,
      is_online: true,
      members: ['user@example.com'],
      created_by: 'user@example.com',
      created_date: new Date().toISOString()
    },
    {
      id: 't2',
      name: 'Beta Capital',
      logo_url: '',
      total_budget: 500,
      spent: 0,
      is_online: true,
      members: ['beta@example.com'],
      created_by: 'beta@example.com',
      created_date: new Date().toISOString()
    },
    {
      id: 't3',
      name: 'Gamma Partners',
      logo_url: '',
      total_budget: 500,
      spent: 0,
      is_online: true,
      members: ['gamma@example.com'],
      created_by: 'gamma@example.com',
      created_date: new Date().toISOString()
    }
  ],
  AuctionSettings: [
    {
      id: 'settings',
      current_round: 1,
      round_name: 'Qualification Round',
      timer_seconds: 300,
      is_auction_active: true,
      active_startup_id: 's1', // Start with first startup active
      created_date: new Date().toISOString()
    }
  ],
  PowerCard: [
    {
      id: 'pc1',
      name: 'Budget Boost',
      type: 'budget_boost',
      description: 'Increase total budget by 10%',
      status: 'available',
      effect_value: 10,
      team_id: 't1',
      created_date: new Date().toISOString()
    }
  ],
  BreakingNews: [],
  Bid: [],
  ActivityLog: []
};

class MockEntityClient {
  constructor(entityName) {
    this.entityName = entityName;
    this.storageKey = `${STORAGE_PREFIX}${entityName}`;
    this.init();
  }

  init() {
    // Only access localStorage in browser environment
    if (typeof window !== 'undefined' && window.localStorage) {
      if (!localStorage.getItem(this.storageKey)) {
        if (SEED_DATA[this.entityName]) {
          localStorage.setItem(this.storageKey, JSON.stringify(SEED_DATA[this.entityName]));
        } else {
          localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
      }
    }
  }

  getAll() {
     if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  }

  saveAll(data) {
     if (typeof window === 'undefined') return;
    localStorage.setItem(this.storageKey, JSON.stringify(data));
    // Dispatch event for local subscriptions
    EVENTS.dispatchEvent(new CustomEvent('change', { detail: { entity: this.entityName } }));
    // Dispatch event for cross-tab sync
    window.dispatchEvent(new StorageEvent('storage', {
      key: this.storageKey,
      newValue: JSON.stringify(data)
    }));
  }

  async list(sortParams) {
    let data = this.getAll();
    // Simple sorting support
    if (sortParams) {
      const desc = sortParams.startsWith('-');
      const field = desc ? sortParams.slice(1) : sortParams;
      data.sort((a, b) => {
        if (a[field] < b[field]) return desc ? 1 : -1;
        if (a[field] > b[field]) return desc ? -1 : 1;
        return 0;
      });
    }
    return data;
  }

  async get(id) {
    const data = this.getAll();
    return data.find(item => item.id === id);
  }

  async create(item) {
    const data = this.getAll();
    const newItem = {
      ...item,
      id: item.id || generateId(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };
    data.push(newItem);
    this.saveAll(data);
    return newItem;
  }

  async update(id, updates) {
    const data = this.getAll();
    const index = data.findIndex(item => item.id === id);
    if (index === -1) throw new Error('Item not found');
    
    const updatedItem = {
      ...data[index],
      ...updates,
      updated_date: new Date().toISOString()
    };
    data[index] = updatedItem;
    this.saveAll(data);
    return updatedItem;
  }

  async delete(id) {
    const data = this.getAll();
    const index = data.findIndex(item => item.id === id);
    if (index === -1) throw new Error('Item not found');
    
    data.splice(index, 1);
    this.saveAll(data);
    return { success: true };
  }

  subscribe(callback) {
    const handler = (e) => {
      if (e.detail?.entity === this.entityName || (e.type === 'storage' && e.key === this.storageKey)) {
        callback({ type: 'update', entity: this.entityName });
      }
    };
    
    EVENTS.addEventListener('change', handler);
    if (typeof window !== 'undefined') {
        window.addEventListener('storage', handler);
    }
    
    return () => {
      EVENTS.removeEventListener('change', handler);
      if (typeof window !== 'undefined') {
          window.removeEventListener('storage', handler);
      }
    };
  }
}

class MockUsersClient {
  async inviteUser(email, role) {
    // Mock implementation
    console.log(`Invited user ${email} as ${role}`);
    return { success: true, message: `Invited ${email}` };
  }
}

class MockAuthClient {
  constructor() {
    this.userKey = 'base44_mock_user';
  }

  async me() {
     if (typeof window === 'undefined') return null;
    const userJson = localStorage.getItem(this.userKey);
    if (!userJson) throw new Error('Not authenticated');
    return JSON.parse(userJson);
  }

  async login(email, role = 'user') {
    const user = {
      id: 'u1',
      email: email,
      role: role,
      name: email.split('@')[0]
    };
    if (typeof window !== 'undefined') {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }
    return user;
  }

  async logout() {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.userKey);
      }
  }
  
  redirectToLogin() {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
  }
}


class MockAppLogsClient {
  constructor(base44) {
    this.base44 = base44;
  }

  async logUserInApp(pageName) {
    try {
      const user = await this.base44.auth.me();
      if (!user) return; // Only log for authenticated users

      await this.base44.entities.ActivityLog.create({
        user_id: user.id,
        user_email: user.user_email || user.email,
        action: 'page_view',
        details: { page: pageName },
        timestamp: new Date().toISOString()
      });
      console.log(`[AppLogs] Logged view for page: ${pageName}`);
    } catch (error) {
      console.warn('[AppLogs] Failed to log activity:', error);
    }
  }
}

class MockBase44Client {
  constructor() {
    this.auth = new MockAuthClient();
    this.users = new MockUsersClient();
    this.appLogs = new MockAppLogsClient(this);
    /** @type {any} */
    this.entities = new Proxy({}, {
      get: (target, prop) => {
        if (!target[prop]) {
          target[prop] = new MockEntityClient(prop);
        }
        return target[prop];
      }
    });
  }
}

export const mockBase44 = new MockBase44Client();
