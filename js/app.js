/**
 * ============================================================================
 * EsquemaVet Ocaña - Controlador Principal de Producción (Feria de Proyectos)
 * Gestión Clínica Veterinaria, API Pública, Carnet QR Real y Mapa Ocaña
 * ============================================================================
 */

const App = {
  db: null,
  currentUser: null,
  currentView: 'dashboard',
  selectedPetId: null,
  alertFilter: 'ALL',
  leafletMap: null,
  leafletMarkersLayer: null,
  lastApiConsoleJson: '',
  charts: {
    dashboardStatus: null,
    epiSpecies: null
  },

  init() {
    this.db = window.DataStore.getData();

    // Comprobar sesión persistente (Recordarme) o de pestaña
    const savedUserId =
      localStorage.getItem('ESQUEMAVET_PERSISTENT_USER_ID') ||
      sessionStorage.getItem('ESQUEMAVET_ACTIVE_USER_ID');

    if (savedUserId) {
      const found = this.db.users.find(u => u.id === savedUserId);
      if (found) {
        this.currentUser = found;
      }
    }

    const accessiblePets = this.getAccessiblePets();
    this.selectedPetId = accessiblePets.length > 0 ? accessiblePets[0].id : (this.db.pets[0]?.id || null);

    this.bindGlobalEvents();
    this.renderAppState();
    this.refreshWeatherTelemetry(false);
    this.checkUrlDeepLinks();
    this.refreshIcons();
  },

  refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  },

  /**
   * Detecta si un ciudadano o jurado abrió la URL escaneando un código QR (?verify=OCA-PET-001)
   */
  checkUrlDeepLinks() {
    try {
      const params = new URLSearchParams(window.location.search);
      const verifyCode = params.get('verify');
      if (verifyCode) {
        setTimeout(() => {
          this.openPublicVerifierModal(verifyCode);
        }, 250);
      } else if (params.get('fair') === '1') {
        setTimeout(() => {
          this.openFairPresentationModal();
        }, 250);
      }
    } catch (e) {
      console.warn('Deep link parsing warning:', e);
    }
  },

  bindGlobalEvents() {
    // 1. Inicio de sesión con verificación criptográfica de credenciales
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // 2. Registro de nuevos usuarios con credenciales almacenables y comprobables
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handlePublicRegister();
      });
    }

    // Medidor de fortaleza de contraseña en tiempo real durante el registro
    const regPassInput = document.getElementById('reg-password');
    if (regPassInput) {
      regPassInput.addEventListener('input', (e) => {
        this.updatePasswordStrengthUI(e.target.value);
      });
    }

    // 3. Registro de nueva mascota y enlace con propietario
    const petForm = document.getElementById('form-register-pet');
    if (petForm) {
      petForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleRegisterPet();
      });
    }

    const birthInput = document.getElementById('pet-birthdate');
    if (birthInput) {
      birthInput.addEventListener('change', (e) => {
        const agePreview = document.getElementById('pet-age-preview');
        if (agePreview) {
          agePreview.textContent = e.target.value
            ? `Edad estimada: ${window.DataStore.calculateAge(e.target.value)}`
            : 'Seleccione la fecha de nacimiento';
        }
      });
    }

    // 4. Registro de aplicación de biológico (Vacunación / Desparasitación)
    const vacForm = document.getElementById('form-register-vaccine');
    if (vacForm) {
      vacForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleRegisterVaccination();
      });
    }

    const vacPetSelect = document.getElementById('vac-pet-id');
    if (vacPetSelect) {
      vacPetSelect.addEventListener('change', (e) => {
        this.renderVetPrecheckHistory(e.target.value);
      });
    }

    // 5. Actualización de perfil personal y cambio de contraseña comprobable
    const profileForm = document.getElementById('form-update-profile');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleUpdateProfile();
      });
    }

    const passwordForm = document.getElementById('form-change-password');
    if (passwordForm) {
      passwordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleChangePassword();
      });
    }

    // 6. Registro presencial de propietario en consultorio veterinario
    const ownerByVetForm = document.getElementById('form-vet-create-owner');
    if (ownerByVetForm) {
      ownerByVetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleVetCreateOwner();
      });
    }

    // 7. Configuración de conexión Google Cloud & Webhook API
    const cloudConfigForm = document.getElementById('form-cloud-config');
    if (cloudConfigForm) {
      cloudConfigForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveCloudConfig();
      });
    }

    // 8. Importación de respaldo JSON desde archivo
    const backupFileInput = document.getElementById('backup-file-input');
    if (backupFileInput) {
      backupFileInput.addEventListener('change', (e) => {
        this.handleImportBackupFile(e);
      });
    }

    // 9. Filtros de directorio de mascotas en tiempo real
    const searchInput = document.getElementById('directory-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.renderPetsDirectory();
      });
    }

    const speciesFilter = document.getElementById('directory-species-filter');
    if (speciesFilter) {
      speciesFilter.addEventListener('change', () => {
        this.renderPetsDirectory();
      });
    }

    // 10. Enter en el buscador público de la portada
    const landingVerifyInput = document.getElementById('landing-public-verify-input');
    if (landingVerifyInput) {
      landingVerifyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.verifyFromLandingInput();
        }
      });
    }
  },

  /**
   * ==========================================================================
   * Telemetría Biometeorológica en Tiempo Real (Open-Meteo REST API Ocaña)
   * ==========================================================================
   */
  async refreshWeatherTelemetry(showNotice = false) {
    if (!window.PublicAPIConnector) return;
    const weather = await window.PublicAPIConnector.fetchOcanaBiometeorology(showNotice);

    // 1. Actualizar píldora en la portada
    const authPill = document.getElementById('auth-weather-pill');
    if (authPill) {
      authPill.innerHTML = `
        <span class="w-2 h-2 rounded-full ${weather.online ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}"></span>
        <span>Ocaña API: <strong>${weather.temperatureC}°C</strong> • Hum: ${weather.humidityPercent}% • Riesgo Vectorial: <strong>${weather.vectorRisk.level}</strong></span>
      `;
    }

    // 2. Actualizar tarjeta lateral
    const sidebarWeather = document.getElementById('sidebar-weather-body');
    if (sidebarWeather) {
      sidebarWeather.innerHTML = `
        <div class="flex items-center justify-between">
          <div>
            <div class="text-lg font-extrabold text-slate-900">${weather.temperatureC}°C</div>
            <div class="text-[11px] text-slate-500">${weather.weatherDescription}</div>
          </div>
          <div class="text-right text-[11px]">
            <div class="font-semibold text-slate-700">Humedad: ${weather.humidityPercent}%</div>
            <div class="text-slate-400">Viento: ${weather.windKmh} km/h</div>
          </div>
        </div>
        <div class="mt-2 p-2 rounded-xl border text-[11px] ${weather.vectorRisk.lightBadgeClass}">
          <div class="font-bold">Riesgo Vectores: ${weather.vectorRisk.level}</div>
          <div class="mt-0.5 leading-snug">${weather.vectorRisk.recommendation}</div>
        </div>
        <div class="mt-1.5 text-[10px] font-mono text-slate-400 flex justify-between">
          <span>Open-Meteo REST</span>
          <span>${weather.latencyMs} ms</span>
        </div>
      `;
    }

    // 3. Actualizar banner en Panel de Control
    const dashWeather = document.getElementById('dashboard-api-weather-banner');
    if (dashWeather) {
      dashWeather.innerHTML = `
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center text-lg shrink-0 font-bold">
              🌡️
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-xs font-extrabold uppercase tracking-wider text-teal-800">Telemetría Biometeorológica Ocaña (API Open-Meteo en Vivo)</span>
                <span class="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">${weather.coordinates} • ${weather.latencyMs} ms</span>
              </div>
              <p class="text-xs text-slate-600 mt-1">
                Temperatura actual: <strong>${weather.temperatureC}°C</strong> (${weather.weatherDescription}) • Humedad relativa: <strong>${weather.humidityPercent}%</strong> • ${weather.vectorRisk.recommendation}
              </p>
            </div>
          </div>
          <div class="shrink-0">
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${weather.vectorRisk.lightBadgeClass}">
              <span>Riesgo Vectorial: ${weather.vectorRisk.level}</span>
            </span>
          </div>
        </div>
      `;
    }

    if (showNotice) {
      this.showToast(`Telemetría de Ocaña actualizada desde Open-Meteo API (${weather.temperatureC}°C, ${weather.humidityPercent}% hum).`, 'info');
    }
  },

  /**
   * ==========================================================================
   * Validador Público de Certificados Sanitarios y Códigos QR
   * ==========================================================================
   */
  verifyFromLandingInput() {
    const input = document.getElementById('landing-public-verify-input');
    const code = input ? input.value.trim() : '';
    this.openPublicVerifierModal(code || 'OCA-PET-001');
  },

  runPublicVerificationFromModal() {
    const input = document.getElementById('modal-verify-input');
    const code = input ? input.value.trim() : '';
    this.renderPublicVerificationResult(code);
  },

  openPublicVerifierModal(queryCode = 'OCA-PET-001') {
    const modal = document.getElementById('public-verify-modal');
    const input = document.getElementById('modal-verify-input');
    if (!modal) return;

    modal.classList.remove('hidden');
    const targetCode = (queryCode || this.selectedPetId || 'OCA-PET-001').trim();
    if (input) input.value = targetCode;
    this.renderPublicVerificationResult(targetCode);
  },

  closePublicVerifierModal() {
    const modal = document.getElementById('public-verify-modal');
    if (modal) modal.classList.add('hidden');
  },

  renderPublicVerificationResult(queryCode) {
    const container = document.getElementById('public-verify-result-body');
    if (!container) return;

    const result = window.DataStore.verifyPublicRecord(queryCode, this.db);
    if (!result) {
      container.innerHTML = `
        <div class="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-2">
          <div class="text-2xl">⚠️</div>
          <div class="font-extrabold text-rose-900 text-base">No se encontró ningún certificado asociado a "${queryCode || 'vacío'}"</div>
          <p class="text-xs text-rose-700 max-w-md mx-auto">
            Verifique el código sanitario de la mascota (Ej. <code>OCA-PET-001</code>), el microchip (Ej. <code>COL-OCA-98102</code>) o el sello de firma digital (Ej. <code>SIG-VET01-8F92A1C4</code>).
          </p>
        </div>
      `;
      return;
    }

    const publicUrl = window.PublicAPIConnector.getPublicVerificationUrl(result.pet.id);
    const qrSvg = window.DataStore.generateQRCodeSVG(publicUrl, 86);
    const statusBadge = result.immunizationSummary.isCompliant
      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
      : 'bg-amber-50 text-amber-800 border-amber-300';

    container.innerHTML = `
      <div class="p-4 rounded-2xl border ${statusBadge} flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="text-2xl">${result.immunizationSummary.isCompliant ? '✅' : '⏳'}</div>
          <div>
            <div class="text-[11px] font-bold uppercase tracking-wider">Estado Oficial del Certificado Sanitario</div>
            <div class="text-base font-extrabold">${result.immunizationSummary.statusLabel}</div>
            <div class="text-xs opacity-85">Verificado en tiempo real • ${result.municipality}</div>
          </div>
        </div>
        <div class="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200">
          ${qrSvg}
        </div>
      </div>

      ${result.matchedSignatureRecord ? `
        <div class="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-950">
          <strong>✔ Firma Digital Veterinaria Autenticada:</strong> El sello criptográfico <code class="font-mono font-bold">${result.matchedSignatureRecord.digitalSignatureHash}</code> corresponde a la aplicación de <strong>${result.matchedSignatureRecord.vaccineName}</strong> (Lote ${result.matchedSignatureRecord.biologicalCode}) certificada por <strong>${result.matchedSignatureRecord.vetName}</strong> (${result.matchedSignatureRecord.vetLicense}).
        </div>
      ` : ''}

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
          <div class="font-bold text-teal-800 uppercase text-[11px]">Datos del Ejemplar</div>
          <div class="text-sm font-extrabold text-slate-900">${result.pet.species === 'Canino' ? '🐕' : '🐈'} ${result.pet.name} <span class="font-mono text-xs text-teal-700">(${result.pet.id})</span></div>
          <div><strong>Especie / Raza:</strong> ${result.pet.species} • ${result.pet.breed}</div>
          <div><strong>Sexo / Peso:</strong> ${result.pet.sex} • ${result.pet.weightKg} kg</div>
          <div><strong>Microchip:</strong> <span class="font-mono font-bold">${result.pet.microchipOrTag}</span></div>
          <div><strong>Sector en Ocaña:</strong> Barrio ${result.pet.neighborhood || 'Ocaña'}</div>
        </div>

        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
          <div class="font-bold text-sky-800 uppercase text-[11px]">Tenedor Responsable & Cobertura</div>
          <div class="text-sm font-bold text-slate-900">${result.owner ? result.owner.name : 'Registrado'}</div>
          <div><strong>Documento:</strong> <span class="font-mono">${result.owner ? result.owner.documentMasked : 'N/A'}</span></div>
          <div><strong>Inmunización Antirrábica:</strong> ${result.immunizationSummary.rabiesProtected ? '<span class="text-emerald-700 font-bold">✔ Certificada</span>' : '<span class="text-amber-700 font-bold">Pendiente</span>'}</div>
          <div><strong>Total Biológicos Firmados:</strong> ${result.records.length} registro(s)</div>
          <div class="pt-1">
            <button onclick="App.copyTextToClipboard('${publicUrl}', 'Enlace público de verificación copiado al portapapeles.')" class="text-teal-700 font-bold hover:underline">
              🔗 Copiar URL Pública de este Certificado
            </button>
          </div>
        </div>
      </div>

      <div class="space-y-2">
        <div class="text-xs font-bold uppercase text-slate-500">Historial de Biológicos Certificados con Firma Electrónica</div>
        ${result.records.length === 0 ? `
          <div class="p-4 rounded-xl bg-slate-50 text-xs text-slate-500 text-center">Sin aplicaciones registradas.</div>
        ` : `
          <div class="space-y-2">
            ${result.records.map(r => {
              const st = window.DataStore.getAlertStatus(r.nextBoosterDate);
              return `
                <div class="p-3 rounded-xl border border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <div class="font-bold text-slate-900">${r.vaccineName} <span class="font-mono text-teal-700">(${r.biologicalCode})</span></div>
                    <div class="text-slate-500">Aplicada: ${r.dateAdministered} • Profesional: <strong>${r.vetName}</strong> (${r.vetLicense})</div>
                  </div>
                  <div class="text-right">
                    <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${st.badgeClass}">${st.shortLabel} (${r.nextBoosterDate})</span>
                    <div class="font-mono text-[10px] text-slate-400 mt-1">Sello: ${r.digitalSignatureHash}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  },

  /**
   * ==========================================================================
   * Modal Modo Feria de Proyectos UFPSO & QR Público Web
   * ==========================================================================
   */
  openFairPresentationModal() {
    const modal = document.getElementById('fair-presentation-modal');
    if (!modal) return;
    modal.classList.remove('hidden');

    const publicUrl = 'https://antigravity.luch.dev/site/b8fc95dc-5aca-4e11-b80c-2fa0d8e8f0da/12e5c3d80acf70c398f608ea/';
    const qrBox = document.getElementById('fair-public-qr-box');
    if (qrBox) {
      qrBox.innerHTML = window.DataStore.generateQRCodeSVG(publicUrl, 138);
    }
    const urlInput = document.getElementById('fair-public-url-input');
    if (urlInput) {
      urlInput.value = publicUrl;
    }
  },

  closeFairPresentationModal() {
    const modal = document.getElementById('fair-presentation-modal');
    if (modal) modal.classList.add('hidden');
  },

  copyPublicSiteUrl() {
    const url = 'https://antigravity.luch.dev/site/b8fc95dc-5aca-4e11-b80c-2fa0d8e8f0da/12e5c3d80acf70c398f608ea/';
    this.copyTextToClipboard(url, 'Enlace público web copiado al portapapeles.');
  },

  copyCurrentCarnetVerifyLink() {
    const petId = this.selectedPetId || 'OCA-PET-001';
    const url = window.PublicAPIConnector.getPublicVerificationUrl(petId);
    this.copyTextToClipboard(url, `Enlace público de verificación para ${petId} copiado al portapapeles.`);
  },

  copyTextToClipboard(text, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast(successMsg, 'success');
      }).catch(() => {
        this.showToast(successMsg, 'info');
      });
    } else {
      this.showToast(successMsg, 'info');
    }
  },

  /**
   * ==========================================================================
   * Autenticación, Verificación de Credenciales y Registro de Usuarios
   * ==========================================================================
   */
  handleLogin() {
    const identifier = document.getElementById('login-identifier').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('login-remember')?.checked;

    const user = this.db.users.find(
      u => u.email.toLowerCase() === identifier || u.document.toLowerCase() === identifier
    );

    if (!user) {
      this.showToast('No se encontró ninguna cuenta asociada a ese correo o documento de identidad.', 'error');
      return;
    }

    const isValid = window.SecurityEngine.verifyPassword(password, user.passwordHash, user.legacyPass);
    if (!isValid) {
      this.showToast('La contraseña ingresada es incorrecta. Verifique sus credenciales e intente nuevamente.', 'error');
      return;
    }

    user.lastLogin = new Date().toISOString().slice(0, 16).replace('T', ' ');
    user.passwordHash = window.SecurityEngine.hashPassword(password);
    window.DataStore.saveData(this.db);

    this.loginAsUser(user, rememberMe);
  },

  quickAccountSelect(userId) {
    const user = this.db.users.find(u => u.id === userId);
    if (user) {
      user.lastLogin = new Date().toISOString().slice(0, 16).replace('T', ' ');
      window.DataStore.saveData(this.db);
      this.loginAsUser(user, false);
    }
  },

  loginAsUser(user, rememberMe = false) {
    this.currentUser = user;
    sessionStorage.setItem('ESQUEMAVET_ACTIVE_USER_ID', user.id);
    if (rememberMe) {
      localStorage.setItem('ESQUEMAVET_PERSISTENT_USER_ID', user.id);
    } else {
      localStorage.removeItem('ESQUEMAVET_PERSISTENT_USER_ID');
    }

    const accessiblePets = this.getAccessiblePets();
    this.selectedPetId = accessiblePets.length > 0 ? accessiblePets[0].id : null;

    this.currentView = 'dashboard';
    this.renderAppState();
    this.showToast(`Sesión iniciada: ${user.name}`, 'success');
  },

  logout() {
    this.currentUser = null;
    sessionStorage.removeItem('ESQUEMAVET_ACTIVE_USER_ID');
    localStorage.removeItem('ESQUEMAVET_PERSISTENT_USER_ID');
    this.renderAppState();
    this.showToast('Su sesión se ha cerrado de forma segura.', 'info');
  },

  switchAuthTab(tab) {
    const loginPane = document.getElementById('auth-login-pane');
    const regPane = document.getElementById('auth-register-pane');
    const btnLogin = document.getElementById('tab-btn-login');
    const btnReg = document.getElementById('tab-btn-register');

    if (tab === 'login') {
      loginPane.classList.remove('hidden');
      regPane.classList.add('hidden');
      btnLogin.className = 'flex-1 py-2.5 text-sm font-bold rounded-xl bg-teal-600 text-white shadow-sm transition';
      btnReg.className = 'flex-1 py-2.5 text-sm font-semibold rounded-xl text-slate-600 hover:text-slate-900 transition';
    } else {
      loginPane.classList.add('hidden');
      regPane.classList.remove('hidden');
      btnReg.className = 'flex-1 py-2.5 text-sm font-bold rounded-xl bg-teal-600 text-white shadow-sm transition';
      btnLogin.className = 'flex-1 py-2.5 text-sm font-semibold rounded-xl text-slate-600 hover:text-slate-900 transition';
    }
  },

  togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
  },

  toggleRegisterRoleFields() {
    const role = document.getElementById('reg-role').value;
    const vetFields = document.getElementById('reg-vet-extra');
    const entFields = document.getElementById('reg-ent-extra');

    if (vetFields) vetFields.classList.toggle('hidden', role !== 'VETERINARIO');
    if (entFields) entFields.classList.toggle('hidden', role !== 'ENTIDAD_SANITARIA');
  },

  updatePasswordStrengthUI(password) {
    const evaluation = window.SecurityEngine.evaluatePasswordStrength(password);
    const bar = document.getElementById('reg-pass-bar');
    const label = document.getElementById('reg-pass-label');
    if (bar) {
      bar.style.width = `${evaluation.score}%`;
      bar.className = `h-full transition-all duration-300 ${evaluation.color}`;
    }
    if (label) {
      label.textContent = `Seguridad: ${evaluation.label}`;
      label.className = `text-[11px] font-semibold ${evaluation.text}`;
    }
  },

  handlePublicRegister() {
    const role = document.getElementById('reg-role').value;
    const name = document.getElementById('reg-name').value.trim();
    const documentNum = document.getElementById('reg-document').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const address = document.getElementById('reg-address').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-password-confirm').value;

    if (!name || !documentNum || !email || !phone || !password) {
      this.showToast('Por favor complete todos los campos obligatorios del formulario.', 'error');
      return;
    }

    if (password.length < 6) {
      this.showToast('La contraseña debe tener al menos 6 caracteres.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      this.showToast('Las contraseñas ingresadas no coinciden. Verifíquelas por favor.', 'error');
      return;
    }

    const duplicate = this.db.users.find(
      u => u.email.toLowerCase() === email.toLowerCase() || u.document.toLowerCase() === documentNum.toLowerCase()
    );
    if (duplicate) {
      this.showToast('Ya existe una cuenta registrada con este documento de identidad o correo electrónico.', 'error');
      return;
    }

    const passwordHash = window.SecurityEngine.hashPassword(password);
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');

    const newUser = {
      id: `USR-${role.substring(0, 3)}-${Date.now().toString().slice(-4)}`,
      role,
      name,
      document: documentNum,
      email,
      phone,
      address: address || 'Ocaña, Norte de Santander',
      passwordHash,
      status: role === 'VETERINARIO' ? 'VERIFICADO' : 'ACTIVO',
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: nowStr
    };

    if (role === 'VETERINARIO') {
      const lic = document.getElementById('reg-license').value.trim();
      const clinic = document.getElementById('reg-clinic').value.trim();
      if (!lic) {
        this.showToast('Los médicos veterinarios deben consignar su número de tarjeta profesional.', 'error');
        return;
      }
      newUser.licenseNumber = lic;
      newUser.clinicName = clinic || 'Consultorio Veterinario Autorizado - Ocaña';
    } else if (role === 'ENTIDAD_SANITARIA') {
      newUser.entityCode = document.getElementById('reg-entity-code')?.value.trim() || 'SALUD-OCANA';
    }

    this.db.users.push(newUser);
    window.DataStore.saveData(this.db);
    window.GoogleCloudConfig.syncToCloud(window.GoogleCloudConfig.collections.USERS, newUser, 'USER_REGISTER');

    document.getElementById('register-form').reset();
    this.updatePasswordStrengthUI('');
    this.showToast(`Cuenta creada y verificada para ${name}. Puede iniciar sesión con ${email} o documento ${documentNum}.`, 'success');
    this.loginAsUser(newUser, true);
  },

  handleUpdateProfile() {
    if (!this.currentUser) return;

    const name = document.getElementById('prof-name').value.trim();
    const docNum = document.getElementById('prof-document').value.trim();
    const email = document.getElementById('prof-email').value.trim();
    const phone = document.getElementById('prof-phone').value.trim();
    const address = document.getElementById('prof-address').value.trim();

    const idx = this.db.users.findIndex(u => u.id === this.currentUser.id);
    if (idx === -1) return;

    const conflict = this.db.users.find(
      u => u.id !== this.currentUser.id && (u.email.toLowerCase() === email.toLowerCase() || u.document === docNum)
    );
    if (conflict) {
      this.showToast('El correo o documento indicado ya está asociado a otra cuenta.', 'error');
      return;
    }

    this.db.users[idx].name = name;
    this.db.users[idx].document = docNum;
    this.db.users[idx].email = email;
    this.db.users[idx].phone = phone;
    this.db.users[idx].address = address;

    if (this.currentUser.role === 'VETERINARIO') {
      this.db.users[idx].licenseNumber = document.getElementById('prof-license').value.trim();
      this.db.users[idx].clinicName = document.getElementById('prof-clinic').value.trim();
    }

    this.currentUser = this.db.users[idx];
    window.DataStore.saveData(this.db);
    window.GoogleCloudConfig.syncToCloud(window.GoogleCloudConfig.collections.USERS, this.currentUser, 'PROFILE_UPDATE');

    this.renderHeaderAndSidebar();
    this.renderUsersView();
    this.showToast('Su información personal y de contacto ha sido actualizada.', 'success');
  },

  handleChangePassword() {
    if (!this.currentUser) return;

    const currentPass = document.getElementById('sec-current-pass').value;
    const newPass = document.getElementById('sec-new-pass').value;
    const confirmPass = document.getElementById('sec-confirm-pass').value;

    const isValidCurrent = window.SecurityEngine.verifyPassword(
      currentPass,
      this.currentUser.passwordHash,
      this.currentUser.legacyPass
    );

    if (!isValidCurrent) {
      this.showToast('La contraseña actual ingresada no es correcta.', 'error');
      return;
    }

    if (newPass.length < 6) {
      this.showToast('La nueva contraseña debe contener mínimo 6 caracteres.', 'error');
      return;
    }

    if (newPass !== confirmPass) {
      this.showToast('La confirmación de la nueva contraseña no coincide.', 'error');
      return;
    }

    const idx = this.db.users.findIndex(u => u.id === this.currentUser.id);
    if (idx === -1) return;

    const newHash = window.SecurityEngine.hashPassword(newPass);
    this.db.users[idx].passwordHash = newHash;
    delete this.db.users[idx].legacyPass;

    this.currentUser = this.db.users[idx];
    window.DataStore.saveData(this.db);
    window.GoogleCloudConfig.syncToCloud(window.GoogleCloudConfig.collections.USERS, this.currentUser, 'PASSWORD_UPDATE');

    document.getElementById('form-change-password').reset();
    this.renderUsersView();
    this.showToast('Su credencial de acceso ha sido actualizada y cifrada correctamente.', 'success');
  },

  handleVetCreateOwner() {
    if (this.currentUser.role !== 'VETERINARIO') {
      this.showToast('Esta función está reservada para profesionales veterinarios.', 'error');
      return;
    }

    const name = document.getElementById('vet-owner-name').value.trim();
    const docNum = document.getElementById('vet-owner-doc').value.trim();
    const email = document.getElementById('vet-owner-email').value.trim();
    const phone = document.getElementById('vet-owner-phone').value.trim();
    const address = document.getElementById('vet-owner-address').value.trim();
    const initialPass = document.getElementById('vet-owner-pass').value.trim() || docNum;

    if (!name || !docNum || !phone) {
      this.showToast('Ingrese el nombre completo, documento y teléfono del propietario.', 'error');
      return;
    }

    const existing = this.db.users.find(u => u.document === docNum);
    if (existing) {
      existing.name = name;
      existing.email = email || existing.email;
      existing.phone = phone;
      existing.address = address || existing.address;
      if (document.getElementById('vet-owner-pass').value.trim()) {
        existing.passwordHash = window.SecurityEngine.hashPassword(initialPass);
      }
      window.DataStore.saveData(this.db);
      this.renderUsersView();
      this.populatePetFormSelects();
      this.showToast(`Se actualizaron los datos del propietario ${name}.`, 'success');
      document.getElementById('form-vet-create-owner').reset();
      return;
    }

    const newOwner = {
      id: `USR-PRO-${Date.now().toString().slice(-4)}`,
      role: 'PROPIETARIO',
      name,
      document: docNum,
      email: email || `${docNum}@propietario.esquemavet.co`,
      phone,
      address: address || 'Ocaña, Norte de Santander',
      passwordHash: window.SecurityEngine.hashPassword(initialPass),
      status: 'ACTIVO',
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Cuenta nueva presencial'
    };

    this.db.users.push(newOwner);
    window.DataStore.saveData(this.db);
    window.GoogleCloudConfig.syncToCloud(window.GoogleCloudConfig.collections.USERS, newOwner, 'VET_CREATE_OWNER');

    document.getElementById('form-vet-create-owner').reset();
    this.renderUsersView();
    this.populatePetFormSelects();
    this.showToast(
      `Cuenta de propietario creada para ${name}. Puede iniciar sesión con su documento (${docNum}) y clave asignada.`,
      'success'
    );
  },

  /**
   * ==========================================================================
   * Registro de Pacientes (Mascotas) y Aplicación de Biológicos
   * ==========================================================================
   */
  handleRegisterPet() {
    if (this.currentUser.role === 'PROPIETARIO') {
      this.showToast('La apertura de fichas clínicas iniciales es realizada por el Médico Veterinario o la Entidad Sanitaria.', 'error');
      return;
    }

    const name = document.getElementById('pet-name').value.trim();
    const species = document.getElementById('pet-species').value;
    const breed = document.getElementById('pet-breed').value.trim();
    const sex = document.getElementById('pet-sex').value;
    const birthDate = document.getElementById('pet-birthdate').value;
    const weightKg = parseFloat(document.getElementById('pet-weight').value) || 0;
    const color = document.getElementById('pet-color').value.trim();
    const neighborhood = document.getElementById('pet-neighborhood')?.value || 'La Primavera';
    const microchipOrTag = document.getElementById('pet-microchip').value.trim();
    const ownerId = document.getElementById('pet-owner-id').value;
    const sterilized = document.getElementById('pet-sterilized')?.value === 'true';

    if (!name || !breed || !birthDate || !ownerId) {
      this.showToast('Complete todos los datos requeridos del paciente y seleccione su propietario.', 'error');
      return;
    }

    const nextNumber = this.db.pets.length + 1;
    const newPetId = `OCA-PET-${String(nextNumber).padStart(3, '0')}`;

    const baseCoords = window.OcanaGeoPoints?.neighborhoodCoords?.[neighborhood] || { lat: 8.2377, lng: -73.3560 };
    const jitterLat = (Math.random() - 0.5) * 0.0025;
    const jitterLng = (Math.random() - 0.5) * 0.0025;

    const newPet = {
      id: newPetId,
      name,
      species,
      breed,
      sex,
      birthDate,
      weightKg,
      color: color || 'Sin especificar',
      neighborhood,
      lat: Number((baseCoords.lat + jitterLat).toFixed(4)),
      lng: Number((baseCoords.lng + jitterLng).toFixed(4)),
      sterilized,
      allergies: 'Ninguna reportada',
      microchipOrTag: microchipOrTag || `COL-OCA-98${100 + nextNumber}`,
      ownerId,
      registeredByVetId: this.currentUser.id,
      createdAt: new Date().toISOString().split('T')[0]
    };

    this.db.pets.unshift(newPet);
    window.DataStore.saveData(this.db);
    window.GoogleCloudConfig.syncToCloud(window.GoogleCloudConfig.collections.PETS, newPet, 'PET_REGISTER');

    document.getElementById('form-register-pet').reset();
    document.getElementById('pet-age-preview').textContent = 'Seleccione la fecha de nacimiento';

    this.selectedPetId = newPet.id;
    this.renderAllActiveViews();
    this.showToast(`Paciente "${name}" (${newPetId}) registrado y georreferenciado en Barrio ${neighborhood}, Ocaña.`, 'success');
  },

  /**
   * Autocompleta un protocolo biológico estándar con cálculo de dosis según peso y fecha de refuerzo
   */
  applyBiologicalPreset(presetKey) {
    const catalog = window.OcanaGeoPoints?.biologicalCatalog || [];
    const preset = catalog.find(item => item.key === presetKey);
    if (!preset) return;

    const petId = document.getElementById('vac-pet-id')?.value || this.selectedPetId;
    const pet = this.db.pets.find(p => p.id === petId);
    const weight = pet?.weightKg || 10;

    document.getElementById('vac-category').value = preset.category;
    document.getElementById('vac-name').value = preset.vaccineName;
    const randomBatchNum = Math.floor(1000 + Math.random() * 8999);
    document.getElementById('vac-code').value = `${preset.codePrefix}${randomBatchNum}A`;

    let calculatedDose = preset.defaultDose;
    if (preset.key === 'ENDOPARASITO') {
      const tabs = Math.max(0.5, Math.ceil((weight / 10) * 2) / 2);
      calculatedDose = `${tabs} Tableta(s) (Vía Oral - ${weight} kg)`;
    } else if (preset.key === 'ECTOPARASITO') {
      calculatedDose = `1 Comprimido (${weight} kg - Vía Oral)`;
    }
    document.getElementById('vac-dose').value = calculatedDose;

    const dateInput = document.getElementById('vac-date');
    const baseDateStr = dateInput?.value || '2026-11-18';
    dateInput.value = baseDateStr;

    const boosterDate = new Date(baseDateStr + 'T12:00:00');
    boosterDate.setDate(boosterDate.getDate() + preset.boosterDays);
    document.getElementById('vac-booster').value = boosterDate.toISOString().split('T')[0];
    document.getElementById('vac-observations').value = preset.observations;

    this.showToast(`Protocolo "${preset.vaccineName}" autocompletado para ${pet ? pet.name : 'el paciente'}.`, 'info');
  },

  handleRegisterVaccination() {
    if (this.currentUser.role !== 'VETERINARIO') {
      this.showToast('Solo los Médicos Veterinarios acreditados pueden registrar y firmar biológicos.', 'error');
      return;
    }

    const petId = document.getElementById('vac-pet-id').value;
    const category = document.getElementById('vac-category').value;
    const vaccineName = document.getElementById('vac-name').value.trim();
    const biologicalCode = document.getElementById('vac-code').value.trim().toUpperCase();
    const dateAdministered = document.getElementById('vac-date').value;
    const doseVolume = document.getElementById('vac-dose').value.trim();
    const nextBoosterDate = document.getElementById('vac-booster').value;
    const observations = document.getElementById('vac-observations').value.trim();

    if (!petId || !vaccineName || !biologicalCode || !dateAdministered || !doseVolume || !nextBoosterDate) {
      this.showToast('Complete todos los campos clínicos del biológico, lote, dosis y fecha del próximo refuerzo.', 'error');
      return;
    }

    const signatureHash = window.SecurityEngine.generateClinicalSeal(
      petId,
      biologicalCode,
      this.currentUser.id,
      dateAdministered
    );

    const newRecord = {
      id: `BIO-2026-${100 + this.db.vaccinations.length + 1}`,
      petId,
      category,
      vaccineName,
      biologicalCode,
      dateAdministered,
      nextBoosterDate,
      doseVolume,
      vetId: this.currentUser.id,
      vetName: this.currentUser.name,
      vetLicense: this.currentUser.licenseNumber || 'COMVEZCOL-VERIFICADO',
      clinicName: this.currentUser.clinicName || 'Centro Clínico Veterinario Ocaña',
      observations: observations || 'Aplicación preventiva realizada sin complicaciones.',
      digitalSignatureHash: signatureHash
    };

    this.db.vaccinations.unshift(newRecord);
    window.DataStore.saveData(this.db);
    window.GoogleCloudConfig.syncToCloud(window.GoogleCloudConfig.collections.VACCINATIONS, newRecord, 'BIOLOGICAL_APPLIED');

    document.getElementById('form-register-vaccine').reset();
    document.getElementById('vac-date').value = '2026-11-18';
    this.selectedPetId = petId;

    this.renderAllActiveViews();
    this.renderVetPrecheckHistory(petId);
    this.showToast(`Aplicación de "${vaccineName}" registrada y firmada digitalmente (${signatureHash}).`, 'success');
  },

  /**
   * ==========================================================================
   * Permisos de Acceso por Perfil
   * ==========================================================================
   */
  getAccessiblePets() {
    if (!this.currentUser) return [];
    if (this.currentUser.role === 'PROPIETARIO') {
      return this.db.pets.filter(p => p.ownerId === this.currentUser.id);
    }
    return this.db.pets;
  },

  getAccessibleAlerts() {
    const accessiblePetIds = new Set(this.getAccessiblePets().map(p => p.id));
    const alerts = [];

    this.db.vaccinations.forEach(vac => {
      if (!accessiblePetIds.has(vac.petId)) return;
      const status = window.DataStore.getAlertStatus(vac.nextBoosterDate);
      const pet = this.db.pets.find(p => p.id === vac.petId);
      const owner = pet ? this.db.users.find(u => u.id === pet.ownerId) : null;

      alerts.push({ vac, pet, owner, status });
    });

    return alerts.sort((a, b) => a.status.days - b.status.days);
  },

  getRoleLabel(role) {
    const map = {
      PROPIETARIO: 'Propietario de Mascota',
      VETERINARIO: 'Médico Veterinario',
      ENTIDAD_SANITARIA: 'Salud Pública Municipal'
    };
    return map[role] || role;
  },

  getRoleBadgeClass(role) {
    const map = {
      PROPIETARIO: 'bg-sky-50 text-sky-700 border-sky-200',
      VETERINARIO: 'bg-teal-50 text-teal-700 border-teal-200',
      ENTIDAD_SANITARIA: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    };
    return map[role] || 'bg-slate-100 text-slate-700';
  },

  /**
   * ==========================================================================
   * Navegación y Renderizado de Vistas
   * ==========================================================================
   */
  navigateTo(viewName, optionalPetId = null) {
    if (optionalPetId) {
      this.selectedPetId = optionalPetId;
    }
    this.currentView = viewName;

    const sections = ['dashboard', 'pets', 'carnet', 'vaccinate', 'users', 'epidemiology', 'cloud'];
    sections.forEach(sec => {
      const el = document.getElementById(`view-${sec}`);
      const navBtn = document.getElementById(`nav-btn-${sec}`);
      if (el) {
        el.classList.toggle('hidden', sec !== viewName);
      }
      if (navBtn) {
        if (sec === viewName) {
          navBtn.className = 'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold bg-teal-600 text-white shadow-sm transition';
        } else {
          navBtn.className = 'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition';
        }
      }
    });

    this.renderAllActiveViews();

    if (viewName === 'epidemiology') {
      setTimeout(() => {
        this.renderOcanaEpidemiologyMap();
      }, 120);
    }
    if (viewName === 'cloud' && !this.lastApiConsoleJson) {
      this.testLiveAPIEndpoint('CENSO');
    }

    this.refreshIcons();
  },

  renderAppState() {
    const authScreen = document.getElementById('auth-screen');
    const mainApp = document.getElementById('main-app-shell');

    if (!this.currentUser) {
      authScreen.classList.remove('hidden');
      mainApp.classList.add('hidden');
      this.refreshIcons();
      return;
    }

    authScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');

    this.renderHeaderAndSidebar();
    this.navigateTo(this.currentView);
  },

  renderHeaderAndSidebar() {
    if (!this.currentUser) return;

    document.getElementById('header-user-name').textContent = this.currentUser.name;
    const roleBadge = document.getElementById('header-user-role');
    roleBadge.textContent = this.getRoleLabel(this.currentUser.role);
    roleBadge.className = `inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${this.getRoleBadgeClass(this.currentUser.role)}`;

    const navVaccinate = document.getElementById('nav-item-vaccinate');
    const navEpidemiology = document.getElementById('nav-item-epidemiology');

    if (navVaccinate) {
      navVaccinate.classList.toggle('hidden', this.currentUser.role !== 'VETERINARIO');
    }
    if (navEpidemiology) {
      navEpidemiology.classList.toggle(
        'hidden',
        this.currentUser.role !== 'ENTIDAD_SANITARIA' && this.currentUser.role !== 'VETERINARIO'
      );
    }

    const urgentAlerts = this.getAccessibleAlerts().filter(a => a.status.code !== 'OK');
    const alertCountBadge = document.getElementById('header-alert-count');
    if (alertCountBadge) {
      alertCountBadge.textContent = urgentAlerts.length;
    }

    const roleSwitcherSelect = document.getElementById('account-quick-switcher');
    if (roleSwitcherSelect) {
      roleSwitcherSelect.innerHTML = this.db.users.map(u => `
        <option value="${u.id}" ${u.id === this.currentUser.id ? 'selected' : ''}>
          ${u.name} — ${this.getRoleLabel(u.role)}
        </option>
      `).join('');
    }

    const cloudCfg = window.GoogleCloudConfig.getConfig();
    const cloudBadge = document.getElementById('header-cloud-badge');
    if (cloudBadge) {
      if (cloudCfg.enabled && (cloudCfg.apiKey || cloudCfg.publicWebhookUrl)) {
        cloudBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span><span>GCP & API REST Activo</span>`;
        cloudBadge.className = 'hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-pointer';
      } else {
        cloudBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-teal-500"></span><span>API Pública & Cloud</span>`;
        cloudBadge.className = 'hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer';
      }
    }
  },

  renderAllActiveViews() {
    if (!this.currentUser) return;
    this.renderDashboardView();
    this.renderPetsDirectory();
    this.populatePetFormSelects();
    this.renderCarnetView();
    this.renderVaccinateView();
    this.renderUsersView();
    this.renderEpidemiologyView();
    this.renderCloudStatusView();
  },

  /**
   * ==========================================================================
   * Vista 1: Panel de Control, Gráficas y Alertas con Despacho WhatsApp API
   * ==========================================================================
   */
  setAlertFilter(filterCode) {
    this.alertFilter = filterCode;
    this.renderDashboardView();
  },

  renderDashboardView() {
    const accessiblePets = this.getAccessiblePets();
    const allAlerts = this.getAccessibleAlerts();
    const overdueCount = allAlerts.filter(a => a.status.code === 'OVERDUE').length;
    const upcomingCount = allAlerts.filter(a => a.status.code === 'UPCOMING').length;
    const okCount = allAlerts.filter(a => a.status.code === 'OK').length;

    document.getElementById('kpi-total-pets').textContent = accessiblePets.length;
    document.getElementById('kpi-total-vaccines').textContent = allAlerts.length;
    document.getElementById('kpi-urgent-alerts').textContent = overdueCount + upcomingCount;

    const totalOwners = this.db.users.filter(u => u.role === 'PROPIETARIO').length;
    document.getElementById('kpi-total-owners').textContent =
      this.currentUser.role === 'PROPIETARIO' ? 'Activa' : totalOwners;

    const welcomeBanner = document.getElementById('dashboard-role-summary');
    if (this.currentUser.role === 'PROPIETARIO') {
      welcomeBanner.innerHTML = `
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-teal-100 backdrop-blur-sm mb-2">
              Portal del Propietario • Municipio de Ocaña
            </span>
            <h2 class="text-xl md:text-2xl font-extrabold text-white">Hola, ${this.currentUser.name}</h2>
            <p class="text-sm text-teal-100/95 mt-1 max-w-2xl">
              Consulte en tiempo real el Carnet Sanitario Digital de sus mascotas con código QR verificable, compruebe las firmas veterinarias y mantenga al día sus esquemas preventivos.
            </p>
          </div>
          <div class="flex flex-wrap gap-2.5 shrink-0">
            <button onclick="App.navigateTo('carnet')" class="px-4 py-2.5 bg-white text-teal-950 font-bold text-sm rounded-xl shadow-md hover:bg-teal-50 transition">
              Abrir Carnet Digital QR
            </button>
          </div>
        </div>
      `;
    } else if (this.currentUser.role === 'VETERINARIO') {
      welcomeBanner.innerHTML = `
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-teal-100 backdrop-blur-sm mb-2">
              Consultorio Veterinario Acreditado • Licencia ${this.currentUser.licenseNumber || 'COMVEZCOL'}
            </span>
            <h2 class="text-xl md:text-2xl font-extrabold text-white">${this.currentUser.clinicName || this.currentUser.name}</h2>
            <p class="text-sm text-teal-100/95 mt-1 max-w-2xl">
              Gestione historias clínicas georreferenciadas, registre propietarios en consulta presencial y certifique vacunas o desparasitaciones con firma digital verificable por QR.
            </p>
          </div>
          <div class="flex flex-wrap gap-2.5 shrink-0">
            <button onclick="App.navigateTo('pets')" class="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/25 font-semibold text-sm rounded-xl transition">
              + Nuevo Paciente
            </button>
            <button onclick="App.navigateTo('vaccinate')" class="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm rounded-xl shadow-md transition">
              + Aplicar Biológico
            </button>
          </div>
        </div>
      `;
    } else {
      welcomeBanner.innerHTML = `
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-teal-100 backdrop-blur-sm mb-2">
              Autoridad de Salud Pública • Vigilancia Epidemiológica Ocaña
            </span>
            <h2 class="text-xl md:text-2xl font-extrabold text-white">${this.currentUser.name}</h2>
            <p class="text-sm text-teal-100/95 mt-1 max-w-2xl">
              Monitoree en el mapa interactivo de Ocaña la cobertura de inmunización antirrábica y polivalente, el censo poblacional por barrios y la trazabilidad de lotes biológicos.
            </p>
          </div>
          <div class="flex gap-2.5 shrink-0">
            <button onclick="App.navigateTo('epidemiology')" class="px-4 py-2.5 bg-white text-teal-950 font-bold text-sm rounded-xl shadow-md hover:bg-teal-50 transition">
              🗺️ Abrir Mapa Epidemiológico
            </button>
          </div>
        </div>
      `;
    }

    ['ALL', 'OVERDUE', 'UPCOMING', 'OK'].forEach(code => {
      const btn = document.getElementById(`alert-filter-${code}`);
      if (btn) {
        if (this.alertFilter === code) {
          btn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 text-white shadow-sm transition';
        } else {
          btn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition';
        }
      }
    });

    const filteredAlerts = allAlerts.filter(a => {
      if (this.alertFilter === 'ALL') return true;
      return a.status.code === this.alertFilter;
    });

    const alertsContainer = document.getElementById('dashboard-alerts-list');
    if (filteredAlerts.length === 0) {
      alertsContainer.innerHTML = `
        <div class="text-center py-8 text-sm text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          No hay registros preventivos en esta categoría.
        </div>
      `;
    } else {
      alertsContainer.innerHTML = filteredAlerts.map(item => `
        <div class="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-teal-300 hover:shadow-sm transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-start gap-3.5">
            <div class="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-lg font-bold border ${item.status.badgeClass}">
              ${item.pet ? (item.pet.species === 'Canino' ? '🐕' : '🐈') : '🐾'}
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-bold text-slate-900 text-sm">${item.pet ? item.pet.name : item.vac.petId}</span>
                <span class="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">${item.vac.petId}</span>
                <span class="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-semibold">Barrio ${item.pet?.neighborhood || 'Ocaña'}</span>
                <span class="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-semibold border ${item.status.badgeClass}">
                  <span class="w-1.5 h-1.5 rounded-full ${item.status.dotClass}"></span>
                  ${item.status.label}
                </span>
              </div>
              <p class="text-sm font-medium text-slate-800 mt-1">
                ${item.vac.category === 'VACUNA' ? 'Vacuna:' : 'Desparasitación:'} <strong>${item.vac.vaccineName}</strong>
                <span class="text-xs text-slate-500 font-mono ml-1">(Lote: ${item.vac.biologicalCode})</span>
              </p>
              <p class="text-xs text-slate-500 mt-0.5">
                Responsable: <strong>${item.owner ? item.owner.name : 'No asignado'}</strong> • WhatsApp: ${item.owner ? item.owner.phone : 'N/A'} • Refuerzo: <strong>${item.vac.nextBoosterDate}</strong>
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button onclick="App.sendPreventiveReminder('${item.vac.id}')" class="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition">
              📲 WhatsApp Oficial
            </button>
            <button onclick="App.navigateTo('carnet', '${item.vac.petId}')" class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 transition">
              Ver Carnet
            </button>
          </div>
        </div>
      `).join('');
    }

    const quickPetsContainer = document.getElementById('dashboard-pets-quicklist');
    if (quickPetsContainer) {
      quickPetsContainer.innerHTML = accessiblePets.slice(0, 6).map(pet => {
        const owner = this.db.users.find(u => u.id === pet.ownerId);
        const vacCount = this.db.vaccinations.filter(v => v.petId === pet.id).length;
        return `
          <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:shadow-sm transition flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-lg">${pet.species === 'Canino' ? '🐕' : '🐈'}</span>
                <span class="font-bold text-slate-900 text-sm">${pet.name}</span>
                <span class="text-[11px] font-mono bg-white border border-slate-200 text-teal-700 font-semibold px-1.5 py-0.5 rounded">${pet.id}</span>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                ${pet.breed} • ${pet.neighborhood || 'Ocaña'} • Prop: ${owner ? owner.name.split(' ')[0] + ' ' + (owner.name.split(' ')[2] || '') : 'N/A'}
              </p>
            </div>
            <div class="text-right">
              <span class="inline-block text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">${vacCount} dosis</span>
              <button onclick="App.navigateTo('carnet', '${pet.id}')" class="block mt-1 text-xs font-bold text-sky-700 hover:underline">
                Carnet QR →
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    this.renderDashboardChart(okCount, upcomingCount, overdueCount);
  },

  renderDashboardChart(okCount, upcomingCount, overdueCount) {
    const canvas = document.getElementById('chart-dashboard-status');
    if (!canvas || typeof window.Chart === 'undefined') return;

    if (this.charts.dashboardStatus) {
      this.charts.dashboardStatus.destroy();
    }

    this.charts.dashboardStatus = new window.Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Esquema Vigente', 'Próximo Refuerzo (≤30d)', 'Refuerzo Vencido'],
        datasets: [{
          data: [okCount, upcomingCount, overdueCount],
          backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, font: { size: 11, family: 'Inter' } }
          }
        }
      }
    });
  },

  /**
   * Abre el modal de despacho de recordatorio preventivo conectado a WhatsApp Web API (wa.me)
   */
  sendPreventiveReminder(vacId) {
    const vac = this.db.vaccinations.find(v => v.id === vacId);
    if (!vac) return;
    const pet = this.db.pets.find(p => p.id === vac.petId);
    const owner = pet ? this.db.users.find(u => u.id === pet.ownerId) : null;
    const status = window.DataStore.getAlertStatus(vac.nextBoosterDate);
    const verifyUrl = window.PublicAPIConnector.getPublicVerificationUrl(pet ? pet.id : vac.petId);

    const rawPhone = (owner?.phone || '3154829103').replace(/[^0-9]/g, '');
    const colPhone = rawPhone.startsWith('57') ? rawPhone : `57${rawPhone}`;

    const messageText =
      `🐾 *ESQUEMAVET OCAÑA - RECORDATORIO SANITARIO OFICIAL*\n\n` +
      `Hola *${owner ? owner.name : 'Propietario'}*, le informamos desde la Red Municipal de Historiales Sanitarios de Ocaña que su mascota *${pet ? pet.name : vac.petId}* (${pet ? pet.id : ''}) tiene registrado el siguiente esquema preventivo:\n\n` +
      `• *Biológico:* ${vac.vaccineName}\n` +
      `• *Fecha programada de refuerzo:* ${vac.nextBoosterDate} (${status.shortLabel})\n` +
      `• *Clínica certificadora:* ${vac.clinicName}\n\n` +
      `Consulte y descargue su Carnet Sanitario Digital verificable con QR aquí:\n${verifyUrl}`;

    const modal = document.getElementById('whatsapp-reminder-modal');
    const metaBox = document.getElementById('wa-modal-meta');
    const msgInput = document.getElementById('wa-modal-message');
    const directLink = document.getElementById('wa-modal-direct-link');

    if (metaBox) {
      metaBox.innerHTML = `
        <div><strong>Destinatario:</strong> ${owner ? owner.name : 'Propietario'} • <strong>WhatsApp:</strong> +${colPhone}</div>
        <div><strong>Paciente:</strong> ${pet ? pet.name : vac.petId} (${pet ? pet.breed : ''}) • <strong>Sello Digital:</strong> <span class="font-mono">${vac.digitalSignatureHash}</span></div>
      `;
    }
    if (msgInput) {
      msgInput.value = messageText;
    }
    if (directLink) {
      directLink.href = `https://wa.me/${colPhone}?text=${encodeURIComponent(messageText)}`;
    }
    if (modal) {
      modal.classList.remove('hidden');
    }

    window.GoogleCloudConfig.recordSyncEvent(
      'WHATSAPP_REMINDER_PREPARED',
      'notificaciones_preventivas',
      `Recordatorio preparado para ${owner ? owner.name : 'Propietario'} (+${colPhone}) - Paciente ${pet ? pet.id : vac.petId}`
    );
  },

  closeWhatsAppModal() {
    const modal = document.getElementById('whatsapp-reminder-modal');
    if (modal) modal.classList.add('hidden');
  },

  copyWhatsAppMessage() {
    const msgInput = document.getElementById('wa-modal-message');
    if (msgInput) {
      this.copyTextToClipboard(msgInput.value, 'Mensaje de recordatorio sanitario copiado al portapapeles.');
    }
  },

  onWhatsAppLaunched() {
    this.showToast('Abriendo canal oficial de WhatsApp con el mensaje preventivo pre-cargado.', 'success');
    this.closeWhatsAppModal();
  },

  /**
   * ==========================================================================
   * Vista 2: Directorio y Registro de Pacientes (Mascotas)
   * ==========================================================================
   */
  populatePetFormSelects() {
    const owners = this.db.users.filter(u => u.role === 'PROPIETARIO');
    const ownerSelect = document.getElementById('pet-owner-id');
    if (ownerSelect) {
      ownerSelect.innerHTML = `<option value="">-- Seleccione el propietario responsable --</option>` +
        owners.map(o => `<option value="${o.id}">${o.name} — C.C. ${o.document}</option>`).join('');
    }

    const registerPanel = document.getElementById('pet-registration-panel');
    const citizenNotice = document.getElementById('pet-citizen-notice');
    if (registerPanel && citizenNotice) {
      const isCitizen = this.currentUser.role === 'PROPIETARIO';
      registerPanel.classList.toggle('hidden', isCitizen);
      citizenNotice.classList.toggle('hidden', !isCitizen);
    }
  },

  renderPetsDirectory() {
    const query = (document.getElementById('directory-search-input')?.value || '').trim().toLowerCase();
    const speciesFilter = document.getElementById('directory-species-filter')?.value || 'ALL';

    const accessiblePets = this.getAccessiblePets();
    const filtered = accessiblePets.filter(pet => {
      const owner = this.db.users.find(u => u.id === pet.ownerId);
      const matchesSpecies = speciesFilter === 'ALL' || pet.species === speciesFilter;
      const matchesQuery = !query ||
        pet.id.toLowerCase().includes(query) ||
        pet.name.toLowerCase().includes(query) ||
        pet.breed.toLowerCase().includes(query) ||
        (pet.neighborhood && pet.neighborhood.toLowerCase().includes(query)) ||
        (pet.microchipOrTag && pet.microchipOrTag.toLowerCase().includes(query)) ||
        (owner && owner.name.toLowerCase().includes(query)) ||
        (owner && owner.document.toLowerCase().includes(query));

      return matchesSpecies && matchesQuery;
    });

    const container = document.getElementById('pets-directory-tbody');
    if (!container) return;

    if (filtered.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="7" class="px-4 py-8 text-center text-sm text-slate-500">
            No se encontraron mascotas que coincidan con la búsqueda.
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = filtered.map(pet => {
      const owner = this.db.users.find(u => u.id === pet.ownerId);
      const petVacs = this.db.vaccinations.filter(v => v.petId === pet.id);
      return `
        <tr class="hover:bg-slate-50/90 transition border-b border-slate-100">
          <td class="px-4 py-3.5 text-xs font-mono font-bold text-teal-700">${pet.id}</td>
          <td class="px-4 py-3.5">
            <div class="font-bold text-slate-900 text-sm">${pet.species === 'Canino' ? '🐕' : '🐈'} ${pet.name}</div>
            <div class="text-xs text-slate-500 font-mono">Chip: ${pet.microchipOrTag || 'N/A'}</div>
          </td>
          <td class="px-4 py-3.5 text-sm text-slate-700">
            <div class="font-medium">${pet.species} • ${pet.breed}</div>
            <div class="text-xs text-slate-500">${pet.sex} • ${pet.weightKg} kg • <span class="text-teal-700 font-semibold">Barrio ${pet.neighborhood || 'Ocaña'}</span></div>
          </td>
          <td class="px-4 py-3.5 text-sm text-slate-700">
            <div class="font-semibold">${window.DataStore.calculateAge(pet.birthDate)}</div>
            <div class="text-xs text-slate-400">Nac: ${pet.birthDate}</div>
          </td>
          <td class="px-4 py-3.5 text-sm">
            <div class="font-semibold text-slate-900">${owner ? owner.name : 'No asignado'}</div>
            <div class="text-xs text-slate-500">Doc: ${owner ? owner.document : 'N/A'} • Tel: ${owner ? owner.phone : 'N/A'}</div>
          </td>
          <td class="px-4 py-3.5 text-center">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
              ${petVacs.length} aplicaciones
            </span>
          </td>
          <td class="px-4 py-3.5 text-right space-x-1.5">
            <button onclick="App.navigateTo('carnet', '${pet.id}')" class="px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition">
              Carnet QR
            </button>
            ${this.currentUser.role === 'VETERINARIO' ? `
              <button onclick="App.openVaccinateForPet('${pet.id}')" class="px-2.5 py-1.5 bg-amber-100 text-amber-900 text-xs font-semibold rounded-lg hover:bg-amber-200 transition">
                + Aplicar Dosis
              </button>
            ` : ''}
          </td>
        </tr>
      `;
    }).join('');
  },

  openVaccinateForPet(petId) {
    this.selectedPetId = petId;
    this.navigateTo('vaccinate', petId);
    const select = document.getElementById('vac-pet-id');
    if (select) {
      select.value = petId;
      this.renderVetPrecheckHistory(petId);
    }
  },

  /**
   * ==========================================================================
   * Vista 3: Carnet Sanitario Digital Interactivo con QR Real Escaneable
   * ==========================================================================
   */
  renderCarnetView() {
    const accessiblePets = this.getAccessiblePets();
    const selector = document.getElementById('carnet-pet-selector');

    if (accessiblePets.length === 0) {
      if (selector) selector.innerHTML = `<option value="">Sin mascotas registradas</option>`;
      return;
    }

    if (!this.selectedPetId || !accessiblePets.some(p => p.id === this.selectedPetId)) {
      this.selectedPetId = accessiblePets[0].id;
    }

    if (selector) {
      selector.innerHTML = accessiblePets.map(p => {
        const owner = this.db.users.find(u => u.id === p.ownerId);
        return `<option value="${p.id}" ${p.id === this.selectedPetId ? 'selected' : ''}>
          ${p.id} — ${p.name} (${p.species} / ${p.breed}) • Sector: ${p.neighborhood || 'Ocaña'} • Prop: ${owner ? owner.name : 'N/A'}
        </option>`;
      }).join('');
    }

    const pet = accessiblePets.find(p => p.id === this.selectedPetId);
    if (!pet) return;

    const owner = this.db.users.find(u => u.id === pet.ownerId);
    const records = this.db.vaccinations.filter(v => v.petId === pet.id);
    const hasOverdue = records.some(r => window.DataStore.getAlertStatus(r.nextBoosterDate).code === 'OVERDUE');

    const avatarEl = document.getElementById('carnet-species-avatar');
    if (avatarEl) {
      avatarEl.textContent = pet.species === 'Canino' ? '🐕' : '🐈';
    }

    const globalStatusEl = document.getElementById('carnet-global-status-badge');
    if (globalStatusEl) {
      if (records.length > 0 && !hasOverdue) {
        globalStatusEl.textContent = '✔ Esquema al Día';
        globalStatusEl.className = 'inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-1';
      } else {
        globalStatusEl.textContent = '⚠ Refuerzo Pendiente';
        globalStatusEl.className = 'inline-flex items-center gap-1 text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 mt-1';
      }
    }

    document.getElementById('carnet-pet-name').textContent = pet.name;
    document.getElementById('carnet-pet-id').textContent = pet.id;
    document.getElementById('carnet-pet-species').textContent = `${pet.species} • ${pet.breed}`;
    document.getElementById('carnet-pet-sex').textContent = `${pet.sex} • ${pet.sterilized ? 'Esterilizado(a)' : 'Entero(a)'}`;
    document.getElementById('carnet-pet-age').textContent = `${window.DataStore.calculateAge(pet.birthDate)} (${pet.birthDate})`;
    document.getElementById('carnet-pet-weight').textContent = `${pet.weightKg} kg • ${pet.color}`;
    document.getElementById('carnet-pet-chip').textContent = pet.microchipOrTag || 'N/A';

    const neighEl = document.getElementById('carnet-pet-neighborhood');
    if (neighEl) {
      neighEl.textContent = `📍 Barrio ${pet.neighborhood || 'Ocaña'}`;
    }

    document.getElementById('carnet-owner-name').textContent = owner ? owner.name : 'No asignado';
    document.getElementById('carnet-owner-doc').textContent = owner ? owner.document : 'N/A';
    document.getElementById('carnet-owner-phone').textContent = owner ? owner.phone : 'N/A';
    document.getElementById('carnet-owner-address').textContent = owner ? owner.address : 'Ocaña, N. de S.';

    // Generar código QR 100% Real y Escaneable que apunta a la URL pública de verificación (?verify=OCA-PET-XXX)
    const qrContainer = document.getElementById('carnet-qr-box');
    if (qrContainer) {
      const publicVerificationUrl = window.PublicAPIConnector.getPublicVerificationUrl(pet.id);
      qrContainer.innerHTML = window.DataStore.generateQRCodeSVG(publicVerificationUrl, 92);
    }

    const tbody = document.getElementById('carnet-records-tbody');
    if (records.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="px-4 py-8 text-center text-sm text-slate-500">
            El ejemplar aún no cuenta con biológicos ni desparasitaciones registradas en su historial digital.
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = records.map(r => {
        const alertStatus = window.DataStore.getAlertStatus(r.nextBoosterDate);
        return `
          <tr class="border-b border-slate-200/80 hover:bg-slate-50/70 transition">
            <td class="px-3.5 py-3 text-xs font-bold">
              <span class="px-2.5 py-1 rounded-md ${
                r.category === 'VACUNA' ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-sky-50 text-sky-800 border border-sky-200'
              }">
                ${r.category === 'VACUNA' ? 'Vacuna' : 'Antiparasitario'}
              </span>
            </td>
            <td class="px-3.5 py-3">
              <div class="font-bold text-slate-900 text-sm">${r.vaccineName}</div>
              <div class="text-xs text-slate-500 mt-0.5">${r.observations || ''}</div>
            </td>
            <td class="px-3.5 py-3 font-mono text-xs font-bold text-slate-700">${r.biologicalCode}</td>
            <td class="px-3.5 py-3 text-xs text-slate-700 font-medium">${r.doseVolume}</td>
            <td class="px-3.5 py-3 text-xs text-slate-700 font-medium">${r.dateAdministered}</td>
            <td class="px-3.5 py-3">
              <div class="text-xs font-bold text-slate-900">${r.nextBoosterDate}</div>
              <span class="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full font-semibold border ${alertStatus.badgeClass}">
                ${alertStatus.shortLabel}
              </span>
            </td>
            <td class="px-3.5 py-3">
              <div class="signature-script">${r.vetName}</div>
              <div class="text-[11px] font-semibold text-teal-800">${r.vetLicense}</div>
              <button onclick="App.openPublicVerifierModal('${r.digitalSignatureHash}')" class="text-[10px] font-mono text-slate-400 hover:text-teal-700 underline">
                Sello: ${r.digitalSignatureHash}
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
  },

  onCarnetPetChange(petId) {
    this.selectedPetId = petId;
    this.renderCarnetView();
  },

  /**
   * ==========================================================================
   * Vista 4: Módulo Clínico de Vacunación y Desparasitación
   * ==========================================================================
   */
  renderVaccinateView() {
    const select = document.getElementById('vac-pet-id');
    if (!select) return;

    const pets = this.db.pets;
    select.innerHTML = pets.map(p => {
      const owner = this.db.users.find(u => u.id === p.ownerId);
      return `<option value="${p.id}" ${p.id === this.selectedPetId ? 'selected' : ''}>
        ${p.id} — ${p.name} (${p.species} / ${p.breed} • ${p.weightKg} kg) • Prop: ${owner ? owner.name : 'N/A'}
      </option>`;
    }).join('');

    // Renderizar botones de autocompletado clínico rápido
    const presetsContainer = document.getElementById('vac-quick-presets');
    if (presetsContainer && window.OcanaGeoPoints?.biologicalCatalog) {
      presetsContainer.innerHTML = window.OcanaGeoPoints.biologicalCatalog.map(item => `
        <button type="button" onclick="App.applyBiologicalPreset('${item.key}')"
          class="px-2.5 py-1.5 rounded-xl bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-300 text-xs font-semibold shadow-sm transition">
          ${item.label}
        </button>
      `).join('');
    }

    if (this.currentUser && this.currentUser.role === 'VETERINARIO') {
      document.getElementById('vac-vet-signer-name').textContent = this.currentUser.name;
      document.getElementById('vac-vet-signer-license').textContent =
        `Licencia Profesional: ${this.currentUser.licenseNumber || 'COMVEZCOL'} • ${this.currentUser.clinicName || 'Ocaña'}`;
    }

    const dateInput = document.getElementById('vac-date');
    if (dateInput && !dateInput.value) {
      dateInput.value = '2026-11-18';
    }

    this.renderVetPrecheckHistory(select.value || this.selectedPetId);
  },

  renderVetPrecheckHistory(petId) {
    const container = document.getElementById('vet-precheck-history');
    if (!container) return;

    const pet = this.db.pets.find(p => p.id === petId);
    if (!pet) {
      container.innerHTML = `<p class="text-xs text-slate-500">Seleccione un paciente para verificar sus antecedentes clínicos.</p>`;
      return;
    }

    const owner = this.db.users.find(u => u.id === pet.ownerId);
    const history = this.db.vaccinations.filter(v => v.petId === petId);

    container.innerHTML = `
      <div class="p-4 rounded-xl bg-teal-50/70 border border-teal-200 mb-4">
        <div class="flex items-center justify-between">
          <span class="font-bold text-teal-950 text-sm">${pet.species === 'Canino' ? '🐕' : '🐈'} ${pet.name} (${pet.id})</span>
          <span class="text-xs font-semibold text-teal-800">${pet.breed} • ${pet.weightKg} kg</span>
        </div>
        <p class="text-xs text-teal-800 mt-1">
          Edad: <strong>${window.DataStore.calculateAge(pet.birthDate)}</strong> • Sector: <strong>${pet.neighborhood || 'Ocaña'}</strong> • Prop: <strong>${owner ? owner.name : 'N/A'}</strong>
        </p>
      </div>
      <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
        Historial Inmunológico Previo (${history.length})
      </h4>
      ${history.length === 0 ? `
        <p class="text-xs text-slate-500 italic py-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
          Paciente sin aplicaciones previas registradas.
        </p>
      ` : `
        <div class="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          ${history.map(h => `
            <div class="p-3 rounded-xl border border-slate-200 bg-white text-xs shadow-sm">
              <div class="flex justify-between font-bold text-slate-900">
                <span>${h.vaccineName}</span>
                <span class="font-mono text-teal-700">${h.biologicalCode}</span>
              </div>
              <div class="text-slate-600 mt-1">
                Administrada: <strong>${h.dateAdministered}</strong> • Dosis: ${h.doseVolume}
              </div>
              <div class="text-slate-500 mt-0.5">
                Próximo refuerzo: <strong class="text-slate-800">${h.nextBoosterDate}</strong>
              </div>
              <div class="text-[11px] text-teal-700 font-medium mt-1 pt-1 border-t border-slate-100">
                Certificado por: ${h.vetName} (${h.vetLicense})
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  },

  /**
   * ==========================================================================
   * Vista 5: Administración de Cuenta, Credenciales y Propietarios
   * ==========================================================================
   */
  renderUsersView() {
    if (!this.currentUser) return;

    document.getElementById('prof-name').value = this.currentUser.name || '';
    document.getElementById('prof-document').value = this.currentUser.document || '';
    document.getElementById('prof-email').value = this.currentUser.email || '';
    document.getElementById('prof-phone').value = this.currentUser.phone || '';
    document.getElementById('prof-address').value = this.currentUser.address || '';

    const hashDisplay = document.getElementById('sec-stored-hash-preview');
    if (hashDisplay) {
      hashDisplay.textContent = this.currentUser.passwordHash || 'Cifrado estándar activo';
    }

    const vetExtraProfile = document.getElementById('prof-vet-extra');
    if (vetExtraProfile) {
      if (this.currentUser.role === 'VETERINARIO') {
        vetExtraProfile.classList.remove('hidden');
        document.getElementById('prof-license').value = this.currentUser.licenseNumber || '';
        document.getElementById('prof-clinic').value = this.currentUser.clinicName || '';
      } else {
        vetExtraProfile.classList.add('hidden');
      }
    }

    const vetCreateOwnerPanel = document.getElementById('vet-create-owner-panel');
    if (vetCreateOwnerPanel) {
      vetCreateOwnerPanel.classList.toggle('hidden', this.currentUser.role !== 'VETERINARIO');
    }

    const ownersListBody = document.getElementById('users-owners-tbody');
    if (ownersListBody) {
      const visibleUsers = this.currentUser.role === 'PROPIETARIO'
        ? [this.currentUser]
        : this.db.users;

      ownersListBody.innerHTML = visibleUsers.map(u => {
        const linkedPets = this.db.pets.filter(p => p.ownerId === u.id);
        return `
          <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition">
            <td class="px-4 py-3">
              <div class="font-bold text-slate-900 text-sm">${u.name}</div>
              <div class="text-xs text-slate-500">Doc: <strong class="font-mono">${u.document}</strong></div>
            </td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${this.getRoleBadgeClass(u.role)}">
                ${this.getRoleLabel(u.role)}
              </span>
              ${u.licenseNumber ? `<div class="text-[11px] text-teal-700 font-mono mt-0.5">${u.licenseNumber}</div>` : ''}
            </td>
            <td class="px-4 py-3 text-xs text-slate-700">
              <div class="font-medium">${u.email}</div>
              <div class="text-slate-500">Tel: ${u.phone} • ${u.address}</div>
            </td>
            <td class="px-4 py-3">
              <div class="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded inline-block">
                ✔ Credencial Cifrada Activa
              </div>
              <div class="text-[10px] text-slate-400 mt-0.5">Últ. acceso: ${u.lastLogin || 'Reciente'}</div>
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-1">
                ${u.role !== 'PROPIETARIO'
                  ? `<span class="text-xs text-slate-400">Personal Facultativo / Institucional</span>`
                  : linkedPets.length === 0
                    ? `<span class="text-xs text-slate-400 italic">Sin mascotas vinculadas</span>`
                    : linkedPets.map(lp => `
                        <button onclick="App.navigateTo('carnet', '${lp.id}')" class="px-2 py-0.5 text-xs font-semibold rounded-md bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition">
                          ${lp.species === 'Canino' ? '🐕' : '🐈'} ${lp.name}
                        </button>
                      `).join('')
                }
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  },

  /**
   * ==========================================================================
   * Vista 6: Vigilancia Epidemiológica, Mapa Interactivo de Ocaña y Exportación CSV
   * ==========================================================================
   */
  renderEpidemiologyView() {
    const caninos = this.db.pets.filter(p => p.species === 'Canino').length;
    const felinos = this.db.pets.filter(p => p.species === 'Felino').length;
    const totalVacunas = this.db.vaccinations.filter(v => v.category === 'VACUNA').length;
    const totalDesparasitaciones = this.db.vaccinations.filter(v => v.category === 'DESPARASITACION').length;

    const elCaninos = document.getElementById('epi-count-caninos');
    if (elCaninos) elCaninos.textContent = caninos;
    const elFelinos = document.getElementById('epi-count-felinos');
    if (elFelinos) elFelinos.textContent = felinos;
    const elVacunas = document.getElementById('epi-count-vacunas');
    if (elVacunas) elVacunas.textContent = totalVacunas;
    const elDesp = document.getElementById('epi-count-desp');
    if (elDesp) elDesp.textContent = totalDesparasitaciones;

    // Cobertura antirrábica municipal
    const petsWithRabies = this.db.pets.filter(p =>
      this.db.vaccinations.some(v =>
        v.petId === p.id &&
        (v.vaccineName.toLowerCase().includes('antirrábica') ||
         v.vaccineName.toLowerCase().includes('rabisin') ||
         v.vaccineName.toLowerCase().includes('defensor'))
      )
    ).length;
    const rabiesPct = this.db.pets.length > 0 ? Math.round((petsWithRabies / this.db.pets.length) * 100) : 0;
    const rabiesEl = document.getElementById('epi-rabies-coverage-pct');
    if (rabiesEl) rabiesEl.textContent = `${rabiesPct}%`;

    // Resumen por sectores/barrios de Ocaña
    const neighContainer = document.getElementById('epi-neighborhood-summary');
    if (neighContainer) {
      const countsByNeigh = {};
      this.db.pets.forEach(p => {
        const n = p.neighborhood || 'Centro';
        countsByNeigh[n] = (countsByNeigh[n] || 0) + 1;
      });
      neighContainer.innerHTML = Object.entries(countsByNeigh).map(([barrio, count]) => `
        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <div class="font-bold text-slate-800">📍 ${barrio}</div>
            <div class="text-[11px] text-slate-500">Sector Ocaña</div>
          </div>
          <span class="px-2.5 py-1 rounded-full bg-teal-100 text-teal-900 font-extrabold">${count} masc.</span>
        </div>
      `).join('');
    }

    const traceBody = document.getElementById('epi-traceability-tbody');
    if (traceBody) {
      traceBody.innerHTML = this.db.vaccinations.map(v => {
        const pet = this.db.pets.find(p => p.id === v.petId);
        return `
          <tr class="border-b border-slate-100 hover:bg-slate-50 text-xs">
            <td class="px-3.5 py-3 font-mono font-bold text-teal-800">${v.biologicalCode}</td>
            <td class="px-3.5 py-3 font-semibold text-slate-900">${v.vaccineName}</td>
            <td class="px-3.5 py-3">${pet ? `${pet.name} (${pet.species} • ${pet.id})` : v.petId}</td>
            <td class="px-3.5 py-3">${v.dateAdministered}</td>
            <td class="px-3.5 py-3">${v.doseVolume}</td>
            <td class="px-3.5 py-3">
              <div class="font-semibold text-slate-800">${v.vetName}</div>
              <div class="text-[11px] text-slate-500">${v.vetLicense} • ${v.clinicName}</div>
            </td>
            <td class="px-3.5 py-3">
              <button onclick="App.openPublicVerifierModal('${v.digitalSignatureHash}')" class="font-mono text-[11px] text-emerald-700 font-semibold hover:underline">
                ${v.digitalSignatureHash}
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    this.renderEpidemiologyChart(caninos, felinos, totalVacunas, totalDesparasitaciones);
  },

  /**
   * Renderiza el Mapa Georreferenciado Interactivo de Ocaña con OpenStreetMap + Leaflet API
   */
  renderOcanaEpidemiologyMap() {
    const mapContainer = document.getElementById('ocana-epi-map');
    if (!mapContainer || typeof window.L === 'undefined') return;

    if (!this.leafletMap) {
      this.leafletMap = window.L.map('ocana-epi-map').setView([8.2385, -73.3555], 14);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap • EsquemaVet Ocaña UFPSO'
      }).addTo(this.leafletMap);
      this.leafletMarkersLayer = window.L.layerGroup().addTo(this.leafletMap);
    }

    this.leafletMap.invalidateSize();
    this.leafletMarkersLayer.clearLayers();

    // 1. Marcadores de Clínicas Veterinarias Acreditadas, Secretaría de Salud y UFPSO
    const institutions = window.OcanaGeoPoints?.institutions || [];
    institutions.forEach(inst => {
      const marker = window.L.circleMarker([inst.lat, inst.lng], {
        radius: 10,
        fillColor: '#0d9488',
        color: '#ffffff',
        weight: 2.5,
        opacity: 1,
        fillOpacity: 0.95
      });
      marker.bindPopup(`
        <div class="text-xs space-y-1">
          <div class="font-extrabold text-teal-800 uppercase text-[10px]">${inst.type}</div>
          <div class="font-bold text-slate-900 text-sm">${inst.name}</div>
          <div class="text-slate-600">${inst.director}</div>
          <div class="text-slate-500">${inst.address}</div>
        </div>
      `);
      this.leafletMarkersLayer.addLayer(marker);
    });

    // 2. Marcadores de Mascotas Censadas por Barrios en Ocaña
    this.db.pets.forEach(pet => {
      const lat = pet.lat || 8.2377;
      const lng = pet.lng || -73.3560;
      const records = this.db.vaccinations.filter(v => v.petId === pet.id);
      const hasOverdue = records.some(r => window.DataStore.getAlertStatus(r.nextBoosterDate).code === 'OVERDUE');
      const color = (records.length > 0 && !hasOverdue) ? '#10b981' : '#f43f5e';

      const petMarker = window.L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: color,
        color: '#0f172a',
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.9
      });
      petMarker.bindPopup(`
        <div class="text-xs space-y-1">
          <div class="font-bold text-slate-900">${pet.species === 'Canino' ? '🐕' : '🐈'} ${pet.name} (${pet.id})</div>
          <div class="text-slate-600">${pet.species} • ${pet.breed} • Barrio <strong>${pet.neighborhood || 'Ocaña'}</strong></div>
          <div class="font-semibold ${records.length > 0 && !hasOverdue ? 'text-emerald-700' : 'text-rose-700'}">
            ${records.length > 0 && !hasOverdue ? '✔ Esquema Vigente' : '⚠ Refuerzo Pendiente'} (${records.length} dosis)
          </div>
          <button onclick="App.openPublicVerifierModal('${pet.id}')" class="mt-1 px-2.5 py-1 rounded-lg bg-teal-600 text-white font-bold text-[11px]">
            Ver Certificado QR
          </button>
        </div>
      `);
      this.leafletMarkersLayer.addLayer(petMarker);
    });
  },

  renderEpidemiologyChart(caninos, felinos, vacunas, desparasitaciones) {
    const canvas = document.getElementById('chart-epi-overview');
    if (!canvas || typeof window.Chart === 'undefined') return;

    if (this.charts.epiSpecies) {
      this.charts.epiSpecies.destroy();
    }

    this.charts.epiSpecies = new window.Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Población Canina', 'Población Felina', 'Vacunas Aplicadas', 'Desparasitaciones'],
        datasets: [{
          label: 'Registros Sanitarios en Ocaña',
          data: [caninos, felinos, vacunas, desparasitaciones],
          backgroundColor: ['#0d9488', '#0284c7', '#10b981', '#6366f1'],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  },

  /**
   * Exporta la matriz epidemiológica a un archivo CSV compatible con Microsoft Excel
   */
  exportEpidemiologyCSV() {
    const headers = [
      'ID_REGISTRO',
      'CATEGORIA',
      'BIOLOGICO',
      'LOTE_SERIE',
      'CODIGO_MASCOTA',
      'NOMBRE_MASCOTA',
      'ESPECIE',
      'BARRIO_OCANA',
      'FECHA_APLICACION',
      'PROXIMO_REFUERZO',
      'MEDICO_VETERINARIO',
      'LICENCIA_COMVEZCOL',
      'FIRMA_DIGITAL_SHA256'
    ];

    const rows = this.db.vaccinations.map(v => {
      const pet = this.db.pets.find(p => p.id === v.petId);
      return [
        v.id,
        v.category,
        `"${(v.vaccineName || '').replace(/"/g, '""')}"`,
        v.biologicalCode,
        v.petId,
        `"${pet ? pet.name : ''}"`,
        pet ? pet.species : '',
        `"${pet ? (pet.neighborhood || 'Ocaña') : 'Ocaña'}"`,
        v.dateAdministered,
        v.nextBoosterDate,
        `"${v.vetName}"`,
        v.vetLicense,
        v.digitalSignatureHash
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `matriz_epidemiologica_ocana_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    window.GoogleCloudConfig.recordSyncEvent('CSV_EXPORT', 'historial_biologicos', 'Matriz epidemiológica exportada a Excel (.CSV)');
    this.showToast('Matriz epidemiológica de Ocaña descargada en formato Excel (.CSV).', 'success');
  },

  /**
   * ==========================================================================
   * Vista 7: Consola Interactiva de API Pública REST, Cloud y Respaldos
   * ==========================================================================
   */
  async testLiveAPIEndpoint(endpointType) {
    const methodEl = document.getElementById('api-console-method');
    const urlEl = document.getElementById('api-console-url');
    const statusEl = document.getElementById('api-console-status');
    const outputEl = document.getElementById('api-console-output');
    if (!outputEl) return;

    const t0 = performance.now();
    let payload = {};
    let method = 'GET';
    let url = '/api/v1/ocana/censo';

    if (endpointType === 'CENSO') {
      url = '/api/v1/ocana/censo';
      const caninos = this.db.pets.filter(p => p.species === 'Canino').length;
      const felinos = this.db.pets.filter(p => p.species === 'Felino').length;
      payload = {
        status: 200,
        endpoint: 'https://antigravity.luch.dev/site/b8fc95dc-5aca-4e11-b80c-2fa0d8e8f0da/12e5c3d80acf70c398f608ea/api/v1/ocana/censo',
        municipality: 'Ocaña, Norte de Santander, Colombia',
        institution: 'Universidad Francisco de Paula Santander Seccional Ocaña (UFPSO)',
        timestamp: new Date().toISOString(),
        metrics: {
          totalPetsRegistered: this.db.pets.length,
          canines: caninos,
          felines: felinos,
          totalBiologicalsCertified: this.db.vaccinations.length,
          accreditedVeterinarians: this.db.users.filter(u => u.role === 'VETERINARIO').length
        },
        sectorsCovered: [...new Set(this.db.pets.map(p => p.neighborhood || 'Ocaña'))]
      };
    } else if (endpointType === 'VERIFY') {
      const targetId = this.selectedPetId || 'OCA-PET-001';
      url = `/api/v1/ocana/verify/${targetId}`;
      payload = window.DataStore.verifyPublicRecord(targetId, this.db);
    } else if (endpointType === 'WEATHER') {
      url = 'https://api.open-meteo.com/v1/forecast?latitude=8.2377&longitude=-73.356';
      payload = await window.PublicAPIConnector.fetchOcanaBiometeorology(true);
    } else if (endpointType === 'CLOUD_SYNC') {
      method = 'POST';
      url = '/api/v1/cloud/sync-all';
      const syncRes = await window.GoogleCloudConfig.pushEntireDatabase(this.db);
      this.renderCloudStatusView();
      payload = {
        status: 200,
        operation: 'CLOUD_FIRESTORE_BATCH_SYNC',
        projectId: window.GoogleCloudConfig.getConfig().projectId,
        region: window.GoogleCloudConfig.getConfig().region,
        documentsProcessed: syncRes.totalDocs,
        timestamp: syncRes.timestamp
      };
    }

    const elapsed = Math.max(4, Math.round(performance.now() - t0));
    const formatted = JSON.stringify(payload, null, 2);
    this.lastApiConsoleJson = formatted;

    if (methodEl) {
      methodEl.textContent = method;
      methodEl.className = method === 'POST'
        ? 'px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[11px]'
        : 'px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[11px]';
    }
    if (urlEl) urlEl.textContent = url;
    if (statusEl) statusEl.textContent = `HTTP 200 OK • ${elapsed} ms`;
    outputEl.textContent = formatted;
  },

  copyAPIConsoleOutput() {
    if (!this.lastApiConsoleJson) return;
    this.copyTextToClipboard(this.lastApiConsoleJson, 'Respuesta JSON de la API copiada al portapapeles.');
  },

  renderCloudStatusView() {
    const cfg = window.GoogleCloudConfig.getConfig();
    const projInput = document.getElementById('gcp-project-id');
    const keyInput = document.getElementById('gcp-api-key');
    const webhookInput = document.getElementById('gcp-webhook-url');
    const regionInput = document.getElementById('gcp-region');
    const enabledCheck = document.getElementById('gcp-enabled');

    if (projInput) projInput.value = cfg.projectId || '';
    if (keyInput) keyInput.value = cfg.apiKey || '';
    if (webhookInput) webhookInput.value = cfg.publicWebhookUrl || '';
    if (regionInput) regionInput.value = cfg.region || 'us-east1';
    if (enabledCheck) enabledCheck.checked = Boolean(cfg.enabled);

    const logs = window.GoogleCloudConfig.getSyncLogs();
    const logsContainer = document.getElementById('cloud-sync-logs-tbody');
    if (logsContainer) {
      if (logs.length === 0) {
        logsContainer.innerHTML = `
          <tr>
            <td colspan="4" class="px-4 py-6 text-center text-xs text-slate-400">
              Aún no se registran eventos en la bitácora de sincronización.
            </td>
          </tr>
        `;
      } else {
        logsContainer.innerHTML = logs.slice(0, 14).map(l => `
          <tr class="border-b border-slate-100 text-xs">
            <td class="px-3 py-2 font-mono text-slate-500">${l.timestamp.slice(0, 19).replace('T', ' ')}</td>
            <td class="px-3 py-2 font-semibold text-slate-800">${l.operation}</td>
            <td class="px-3 py-2 font-mono text-teal-700">${l.collection}</td>
            <td class="px-3 py-2 text-slate-600">${l.detail}</td>
          </tr>
        `).join('');
      }
    }
  },

  handleSaveCloudConfig() {
    const projectId = document.getElementById('gcp-project-id').value.trim();
    const apiKey = document.getElementById('gcp-api-key').value.trim();
    const publicWebhookUrl = document.getElementById('gcp-webhook-url')?.value.trim() || '';
    const region = document.getElementById('gcp-region').value;
    const enabled = document.getElementById('gcp-enabled').checked;

    window.GoogleCloudConfig.saveConfig({ projectId, apiKey, publicWebhookUrl, region, enabled });
    this.renderHeaderAndSidebar();
    this.renderCloudStatusView();
    this.showToast('Parámetros de conexión Cloud Firestore y Webhook API guardados correctamente.', 'success');
  },

  exportDatabaseBackup() {
    const payload = {
      metadata: {
        platform: 'EsquemaVet Ocaña',
        municipality: 'Ocaña, Norte de Santander',
        exportedAt: new Date().toISOString(),
        exportedBy: this.currentUser ? this.currentUser.name : 'Administrador'
      },
      data: this.db
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respaldo_esquemavet_ocana_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    window.GoogleCloudConfig.recordSyncEvent('BACKUP_EXPORT', 'all_collections', 'Copia de seguridad descargada en JSON');
    this.renderCloudStatusView();
    this.showToast('Copia de seguridad descargada exitosamente.', 'success');
  },

  handleImportBackupFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        const importedDb = parsed.data || parsed;
        if (!Array.isArray(importedDb.users) || !Array.isArray(importedDb.pets) || !Array.isArray(importedDb.vaccinations)) {
          this.showToast('El archivo seleccionado no tiene una estructura válida de EsquemaVet.', 'error');
          return;
        }
        this.db = importedDb;
        window.DataStore.saveData(this.db);
        window.GoogleCloudConfig.recordSyncEvent('BACKUP_RESTORE', 'all_collections', `Restaurado desde archivo ${file.name}`);
        this.renderAllActiveViews();
        this.showToast('Base de datos restaurada exitosamente desde el archivo de respaldo.', 'success');
      } catch (err) {
        this.showToast('Error al procesar el archivo JSON de respaldo.', 'error');
      }
    };
    reader.readAsText(file);
  },

  resetDemoData() {
    this.db = window.DataStore.resetToSeed();
    window.GoogleCloudConfig.recordSyncEvent('DB_RESET', 'all_collections', 'Restauración de valores iniciales');
    this.renderAllActiveViews();
    this.showToast('Los datos iniciales del sistema han sido restaurados.', 'info');
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const colors = {
      success: 'bg-teal-900 text-white border-teal-700',
      error: 'bg-rose-800 text-white border-rose-600',
      info: 'bg-slate-900 text-white border-slate-700'
    };

    const toast = document.createElement('div');
    toast.className = `px-4 py-3.5 rounded-2xl shadow-xl border text-sm font-medium flex items-center justify-between gap-3 transition transform duration-200 ${colors[type] || colors.info}`;
    toast.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" class="text-white/70 hover:text-white font-bold">✕</button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 5000);
  }
};

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());
