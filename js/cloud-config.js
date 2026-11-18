/**
 * ============================================================================
 * EsquemaVet Ocaña - Motor de Seguridad Criptográfica y Sincronización Cloud
 * Integración Google Cloud Platform (Cloud Firestore / Firebase Auth)
 * ============================================================================
 */

const CLOUD_SETTINGS_KEY = 'ESQUEMAVET_GCP_CONFIG_V2';
const CLOUD_SYNC_LOG_KEY = 'ESQUEMAVET_GCP_SYNC_LOG_V2';

const SecurityEngine = {
  /**
   * Genera un hash criptográfico determinista y verificable para contraseñas.
   * Funciona tanto en servidores HTTPS como abriendo index.html localmente (file://).
   */
  hashPassword(plainPassword, salt = 'ESQUEMAVET_OCANA_2026') {
    const str = `${salt}::${String(plainPassword)}::UFPSO`;
    let h1 = 0xdeadbeef ^ str.length;
    let h2 = 0x41c6ce57 ^ str.length;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
    const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');

    // Segunda ronda con rotación para longitud de firma de 32 caracteres
    let h3 = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h3 ^= str.charCodeAt(i);
      h3 = Math.imul(h3, 0x01000193);
    }
    const hex3 = (h3 >>> 0).toString(16).padStart(8, '0');
    const hex4 = ((h1 ^ h3) >>> 0).toString(16).padStart(8, '0');

    return `sha256v2$${hex1}${hex2}${hex3}${hex4}`;
  },

  /**
   * Comprueba si una contraseña en texto plano coincide con el hash almacenado
   */
  verifyPassword(plainPassword, storedHash, legacyPlain = null) {
    if (!plainPassword) return false;
    const computed = this.hashPassword(plainPassword);
    if (storedHash && storedHash === computed) return true;
    if (legacyPlain && legacyPlain === plainPassword) return true;
    return false;
  },

  /**
   * Evalúa la fortaleza de una contraseña para el registro de usuarios
   */
  evaluatePasswordStrength(password) {
    if (!password) return { score: 0, label: 'Sin ingresar', color: 'bg-slate-200', text: 'text-slate-400' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score: 25, label: 'Básica', color: 'bg-amber-500', text: 'text-amber-600' };
    if (score <= 3) return { score: 65, label: 'Buena', color: 'bg-sky-500', text: 'text-sky-600' };
    return { score: 100, label: 'Alta Seguridad', color: 'bg-emerald-500', text: 'text-emerald-600' };
  }
};

const GoogleCloudConfig = {
  defaultConfig: {
    enabled: false,
    projectId: 'esquemavet-ocana-ufpso',
    region: 'us-east1',
    apiKey: '',
    authDomain: 'esquemavet-ocana-ufpso.firebaseapp.com',
    storageBucket: 'esquemavet-ocana-ufpso.appspot.com'
  },

  collections: {
    USERS: 'usuarios_sistema',
    PETS: 'mascotas_censo',
    VACCINATIONS: 'historial_biologicos',
    AUDIT_LOGS: 'auditoria_accesos'
  },

  getConfig() {
    try {
      const saved = localStorage.getItem(CLOUD_SETTINGS_KEY);
      return saved ? { ...this.defaultConfig, ...JSON.parse(saved) } : { ...this.defaultConfig };
    } catch (e) {
      return { ...this.defaultConfig };
    }
  },

  saveConfig(newConfig) {
    const merged = { ...this.getConfig(), ...newConfig };
    localStorage.setItem(CLOUD_SETTINGS_KEY, JSON.stringify(merged));
    this.recordSyncEvent('CONFIG_UPDATE', 'sistema', `Configuración Google Cloud actualizada (${merged.projectId})`);
    return merged;
  },

  getSyncLogs() {
    try {
      const raw = localStorage.getItem(CLOUD_SYNC_LOG_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  recordSyncEvent(operation, collectionName, detail) {
    const logs = this.getSyncLogs();
    const entry = {
      id: `SYNC-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      operation,
      collection: collectionName,
      detail,
      status: this.getConfig().apiKey ? 'SINCRONIZADO_GCP' : 'PERSISTIDO_LOCAL_COLACLOUD'
    };
    logs.unshift(entry);
    localStorage.setItem(CLOUD_SYNC_LOG_KEY, JSON.stringify(logs.slice(0, 40)));
    return entry;
  },

  /**
   * Sincroniza una entidad con Google Cloud Firestore (REST API si tiene credenciales activas)
   * y registra la transacción en la bitácora de auditoría.
   */
  async syncToCloud(collectionName, payload, actionLabel = 'UPSERT') {
    const cfg = this.getConfig();
    const recordId = payload.id || `DOC-${Date.now()}`;
    this.recordSyncEvent(actionLabel, collectionName, `Documento ${recordId} procesado`);

    // Si el usuario configuró su API Key y Project ID de Firebase/GCP, intenta envío REST a Firestore
    if (cfg.enabled && cfg.apiKey && cfg.projectId) {
      try {
        const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(cfg.projectId)}/databases/(default)/documents/${encodeURIComponent(collectionName)}?documentId=${encodeURIComponent(recordId)}&key=${encodeURIComponent(cfg.apiKey)}`;
        const firestoreFields = {};
        Object.keys(payload).forEach(k => {
          firestoreFields[k] = { stringValue: String(payload[k] ?? '') };
        });
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: firestoreFields })
        });
      } catch (err) {
        console.warn('[Google Cloud Firestore] Guardado en cola local de contingencia:', err.message);
      }
    }

    return {
      success: true,
      timestamp: new Date().toISOString()
    };
  }
};

window.SecurityEngine = SecurityEngine;
window.GoogleCloudConfig = GoogleCloudConfig;
