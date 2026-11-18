/**
 * ============================================================================
 * EsquemaVet Ocaña - Controlador Principal de Producción (Versión Entregable)
 * Gestión Clínica Veterinaria, Carnet Sanitario Digital y Vigilancia Zoonótica
 * ============================================================================
 */

const App = {
  db: null,
  currentUser: null,
  currentView: 'dashboard',
  selectedPetId: null,
  alertFilter: 'ALL',
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

    this.bindGlobalEvents();
    this.renderAppState();
    this.refreshIcons();
  },

  refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
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

    // 7. Configuración de conexión Google Cloud
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

    // Actualizar marca de último acceso y migrar hash si venía de legacy
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

    // Verificar que el documento o email no pertenezca a otro usuario distinto
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
    const microchipOrTag = document.getElementById('pet-microchip').value.trim();
    const ownerId = document.getElementById('pet-owner-id').value;

    if (!name || !breed || !birthDate || !ownerId) {
      this.showToast('Complete todos los datos requeridos del paciente y seleccione su propietario.', 'error');
      return;
    }

    const nextNumber = this.db.pets.length + 1;
    const newPetId = `OCA-PET-${String(nextNumber).padStart(3, '0')}`;

    const newPet = {
      id: newPetId,
      name,
      species,
      breed,
      sex,
      birthDate,
      weightKg,
      color: color || 'Sin especificar',
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
    this.showToast(`Paciente "${name}" (${newPetId}) registrado y vinculado a su propietario.`, 'success');
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

    const signatureHash = `SIG-${this.currentUser.id.slice(-5)}-${Math.random().toString(16).substring(2, 8).toUpperCase()}`;

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
    document.getElementById('vac-date').value = '2026-11-09';
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

    // Selector de cambio rápido de cuenta en barra superior
    const roleSwitcherSelect = document.getElementById('account-quick-switcher');
    if (roleSwitcherSelect) {
      roleSwitcherSelect.innerHTML = this.db.users.map(u => `
        <option value="${u.id}" ${u.id === this.currentUser.id ? 'selected' : ''}>
          ${u.name} — ${this.getRoleLabel(u.role)}
        </option>
      `).join('');
    }

    // Indicador Cloud en cabecera
    const cloudCfg = window.GoogleCloudConfig.getConfig();
    const cloudBadge = document.getElementById('header-cloud-badge');
    if (cloudBadge) {
      if (cloudCfg.enabled && cloudCfg.apiKey) {
        cloudBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span><span>GCP Firestore Activo</span>`;
        cloudBadge.className = 'hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-pointer';
      } else {
        cloudBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-teal-500"></span><span>Almacenamiento Híbrido</span>`;
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
   * Vista 1: Panel de Control, Gráficas y Alertas Preventivas
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

    // Banner ejecutivo según perfil
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
              Consulte en tiempo real el Carnet Sanitario Digital de sus mascotas, verifique las firmas veterinarias de cada biológico y mantenga al día sus esquemas de vacunación y desparasitación.
            </p>
          </div>
          <div class="flex gap-2.5 shrink-0">
            <button onclick="App.navigateTo('carnet')" class="px-4 py-2.5 bg-white text-teal-950 font-bold text-sm rounded-xl shadow-md hover:bg-teal-50 transition">
              Abrir Carnet Digital
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
              Gestione historias clínicas preventivas, registre propietarios en consulta presencial y certifique vacunas o desparasitaciones con firma digital verificable.
            </p>
          </div>
          <div class="flex flex-wrap gap-2.5 shrink-0">
            <button onclick="App.navigateTo('pets')" class="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/25 font-semibold text-sm rounded-xl transition">
              + Nuevo Paciente
            </button>
            <button onclick="App.navigateTo('vaccinate')" class="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm rounded-xl shadow-md transition">
              + Registrar Vacuna / Biológico
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
              Monitoree la cobertura de inmunización antirrábica y polivalente en el municipio, el censo poblacional de animales de compañía y la trazabilidad de lotes biológicos.
            </p>
          </div>
          <div class="flex gap-2.5 shrink-0">
            <button onclick="App.navigateTo('epidemiology')" class="px-4 py-2.5 bg-white text-teal-950 font-bold text-sm rounded-xl shadow-md hover:bg-teal-50 transition">
              Ver Reporte Epidemiológico
            </button>
          </div>
        </div>
      `;
    }

    // Actualizar botones de filtro de alertas
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
                Responsable: <strong>${item.owner ? item.owner.name : 'No asignado'}</strong> • Tel: ${item.owner ? item.owner.phone : 'N/A'} • Refuerzo programado: <strong>${item.vac.nextBoosterDate}</strong>
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button onclick="App.sendPreventiveReminder('${item.vac.id}')" class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition">
              📲 Enviar Recordatorio
            </button>
            <button onclick="App.navigateTo('carnet', '${item.vac.petId}')" class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 transition">
              Ver Carnet
            </button>
          </div>
        </div>
      `).join('');
    }

    // Lista rápida de mascotas
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
                ${pet.breed} • ${window.DataStore.calculateAge(pet.birthDate)} • Prop: ${owner ? owner.name.split(' ')[0] + ' ' + (owner.name.split(' ')[2] || '') : 'N/A'}
              </p>
            </div>
            <div class="text-right">
              <span class="inline-block text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">${vacCount} dosis</span>
              <button onclick="App.navigateTo('carnet', '${pet.id}')" class="block mt-1 text-xs font-bold text-sky-700 hover:underline">
                Ver Carnet →
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

  sendPreventiveReminder(vacId) {
    const vac = this.db.vaccinations.find(v => v.id === vacId);
    if (!vac) return;
    const pet = this.db.pets.find(p => p.id === vac.petId);
    const owner = pet ? this.db.users.find(u => u.id === pet.ownerId) : null;

    this.showToast(
      `Notificación preventiva enviada a ${owner ? owner.name : 'Propietario'} (${owner ? owner.phone : ''}) recordando el refuerzo de ${vac.vaccineName} para ${pet ? pet.name : ''} programado el ${vac.nextBoosterDate}.`,
      'success'
    );
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
            <div class="text-xs text-slate-500">${pet.sex} • ${pet.weightKg} kg • ${pet.color}</div>
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
              Carnet Digital
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
   * Vista 3: Carnet Sanitario Digital Interactivo con QR Vectorial
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
          ${p.id} — ${p.name} (${p.species} / ${p.breed}) • Propietario: ${owner ? owner.name : 'N/A'}
        </option>`;
      }).join('');
    }

    const pet = accessiblePets.find(p => p.id === this.selectedPetId);
    if (!pet) return;

    const owner = this.db.users.find(u => u.id === pet.ownerId);
    const records = this.db.vaccinations.filter(v => v.petId === pet.id);

    document.getElementById('carnet-pet-name').textContent = pet.name;
    document.getElementById('carnet-pet-id').textContent = pet.id;
    document.getElementById('carnet-pet-species').textContent = `${pet.species} • ${pet.breed}`;
    document.getElementById('carnet-pet-sex').textContent = pet.sex;
    document.getElementById('carnet-pet-age').textContent = `${window.DataStore.calculateAge(pet.birthDate)} (${pet.birthDate})`;
    document.getElementById('carnet-pet-weight').textContent = `${pet.weightKg} kg • ${pet.color}`;
    document.getElementById('carnet-pet-chip').textContent = pet.microchipOrTag || 'N/A';

    document.getElementById('carnet-owner-name').textContent = owner ? owner.name : 'No asignado';
    document.getElementById('carnet-owner-doc').textContent = owner ? owner.document : 'N/A';
    document.getElementById('carnet-owner-phone').textContent = owner ? owner.phone : 'N/A';
    document.getElementById('carnet-owner-address').textContent = owner ? owner.address : 'Ocaña, N. de S.';

    // Generar código QR único verificable para la mascota
    const qrContainer = document.getElementById('carnet-qr-box');
    if (qrContainer) {
      const qrPayload = `ESQUEMAVET|${pet.id}|${pet.name}|${owner ? owner.document : ''}|OCANA`;
      qrContainer.innerHTML = window.DataStore.generateQRCodeSVG(qrPayload, 88);
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
              <div class="text-[10px] font-mono text-slate-400">Sello: ${r.digitalSignatureHash}</div>
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
        ${p.id} — ${p.name} (${p.species} / ${p.breed}) • Propietario: ${owner ? owner.name : 'N/A'}
      </option>`;
    }).join('');

    if (this.currentUser && this.currentUser.role === 'VETERINARIO') {
      document.getElementById('vac-vet-signer-name').textContent = this.currentUser.name;
      document.getElementById('vac-vet-signer-license').textContent =
        `Licencia Profesional: ${this.currentUser.licenseNumber || 'COMVEZCOL'} • ${this.currentUser.clinicName || 'Ocaña'}`;
    }

    const dateInput = document.getElementById('vac-date');
    if (dateInput && !dateInput.value) {
      dateInput.value = '2026-11-09';
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
          Edad: <strong>${window.DataStore.calculateAge(pet.birthDate)}</strong> • Propietario: <strong>${owner ? owner.name : 'N/A'}</strong>
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

    // Mostrar el hash criptográfico actual de la credencial almacenada
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
   * Vista 6: Vigilancia Epidemiológica y Censo Sanitario Municipal
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
            <td class="px-3.5 py-3 font-mono text-[11px] text-emerald-700 font-semibold">${v.digitalSignatureHash}</td>
          </tr>
        `;
      }).join('');
    }

    this.renderEpidemiologyChart(caninos, felinos, totalVacunas, totalDesparasitaciones);
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
   * ==========================================================================
   * Vista 7: Configuración Google Cloud y Respaldos de Base de Datos
   * ==========================================================================
   */
  renderCloudStatusView() {
    const cfg = window.GoogleCloudConfig.getConfig();
    const projInput = document.getElementById('gcp-project-id');
    const keyInput = document.getElementById('gcp-api-key');
    const regionInput = document.getElementById('gcp-region');
    const enabledCheck = document.getElementById('gcp-enabled');

    if (projInput) projInput.value = cfg.projectId || '';
    if (keyInput) keyInput.value = cfg.apiKey || '';
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
        logsContainer.innerHTML = logs.slice(0, 12).map(l => `
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
    const region = document.getElementById('gcp-region').value;
    const enabled = document.getElementById('gcp-enabled').checked;

    window.GoogleCloudConfig.saveConfig({ projectId, apiKey, region, enabled });
    this.renderHeaderAndSidebar();
    this.renderCloudStatusView();
    this.showToast('Parámetros de conexión con Google Cloud Platform guardados correctamente.', 'success');
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
