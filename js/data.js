/**
 * ============================================================================
 * EsquemaVet Ocaña - Capa de Persistencia, Semilla Georreferenciada y QR Real
 * Municipio de Ocaña, Norte de Santander (UFPSO)
 * ============================================================================
 */

const STORAGE_KEY = 'ESQUEMAVET_OCANA_PROD_V2';

function buildSeedUsers() {
  const hash = (pwd) => window.SecurityEngine ? window.SecurityEngine.hashPassword(pwd) : pwd;
  return [
    {
      id: 'USR-PRO-01',
      role: 'PROPIETARIO',
      name: 'Franklin Mauricio Hernández Galvis',
      document: '1091678234',
      email: 'fmhernandezg@ufpso.edu.co',
      phone: '3154829103',
      address: 'Barrio La Primavera, Ocaña, N. de S.',
      passwordHash: hash('Ocanavet2026*'),
      passwordHint: 'Ocanavet2026* (o 123456)',
      legacyPass: '123456',
      status: 'ACTIVO',
      createdAt: '2026-08-10',
      lastLogin: '2026-11-18 09:15'
    },
    {
      id: 'USR-PRO-02',
      role: 'PROPIETARIO',
      name: 'Andrés Felipe Carrascal Gómez',
      document: '1091681920',
      email: 'afcarrascalg@ufpso.edu.co',
      phone: '3168291044',
      address: 'Sector El Carmen, Ocaña, N. de S.',
      passwordHash: hash('Ocanavet2026*'),
      legacyPass: '123456',
      status: 'ACTIVO',
      createdAt: '2026-08-12',
      lastLogin: '2026-11-17 16:40'
    },
    {
      id: 'USR-PRO-03',
      role: 'PROPIETARIO',
      name: 'María Fernanda Pacheco Claro',
      document: '1091654321',
      email: 'mfpacheco@gmail.com',
      phone: '3105548921',
      address: 'Barrio Santa Clara, Ocaña, N. de S.',
      passwordHash: hash('Ocanavet2026*'),
      legacyPass: '123456',
      status: 'ACTIVO',
      createdAt: '2026-09-01',
      lastLogin: '2026-11-15 11:20'
    },
    {
      id: 'USR-VET-01',
      role: 'VETERINARIO',
      name: 'Dr. Carlos Eduardo Quintero Peñaranda',
      document: '88245910',
      licenseNumber: 'COMVEZCOL-45892',
      clinicName: 'Centro Clínico Veterinario San Francisco',
      specialty: 'Medicina Interna e Inmunología Animal',
      email: 'dr.quintero@vetocana.com',
      phone: '3178902341',
      address: 'Calle 11 # 14-32 Centro, Ocaña',
      passwordHash: hash('VetOcana2026*'),
      legacyPass: '123456',
      status: 'VERIFICADO',
      createdAt: '2026-07-15',
      lastLogin: '2026-11-18 08:05'
    },
    {
      id: 'USR-VET-02',
      role: 'VETERINARIO',
      name: 'Dra. Valentina Coronel Bayona',
      document: '1091667112',
      licenseNumber: 'COMVEZCOL-51209',
      clinicName: 'Clínica Veterinaria Huellas del Catatumbo',
      specialty: 'Salud Pública y Prevención Zoonótica',
      email: 'dra.coronel@vetocana.com',
      phone: '3147721908',
      address: 'Av. Francisco Fernández de Contreras # 20-15, Ocaña',
      passwordHash: hash('VetOcana2026*'),
      legacyPass: '123456',
      status: 'VERIFICADO',
      createdAt: '2026-07-20',
      lastLogin: '2026-11-17 18:12'
    },
    {
      id: 'USR-ENT-01',
      role: 'ENTIDAD_SANITARIA',
      name: 'Secretaría de Salud Municipal de Ocaña',
      document: '890501234-1',
      entityCode: 'INS-OCANA-SALUD',
      email: 'saludpublica@ocana-nortedesantander.gov.co',
      phone: '6075636300',
      address: 'Palacio Municipal, Parque 29 de Mayo, Ocaña',
      passwordHash: hash('SaludOcana2026*'),
      legacyPass: '123456',
      status: 'INSTITUCIONAL',
      createdAt: '2026-07-01',
      lastLogin: '2026-11-18 07:30'
    }
  ];
}

const InitialSeedData = {
  users: buildSeedUsers(),

  pets: [
    {
      id: 'OCA-PET-001',
      name: 'Max',
      species: 'Canino',
      breed: 'Golden Retriever',
      sex: 'Macho',
      birthDate: '2024-03-15',
      weightKg: 28.5,
      color: 'Dorado claro',
      microchipOrTag: 'COL-OCA-98102',
      neighborhood: 'La Primavera',
      lat: 8.2442,
      lng: -73.3591,
      sterilized: true,
      allergies: 'Ninguna reportada',
      ownerId: 'USR-PRO-01',
      registeredByVetId: 'USR-VET-01',
      createdAt: '2026-08-11'
    },
    {
      id: 'OCA-PET-002',
      name: 'Luna',
      species: 'Felino',
      breed: 'Criollo Pelo Corto',
      sex: 'Hembra',
      birthDate: '2025-01-20',
      weightKg: 3.8,
      color: 'Blanco con manchas grises',
      microchipOrTag: 'COL-OCA-98109',
      neighborhood: 'La Primavera',
      lat: 8.2431,
      lng: -73.3578,
      sterilized: true,
      allergies: 'Sensibilidad leve a sulfas',
      ownerId: 'USR-PRO-01',
      registeredByVetId: 'USR-VET-02',
      createdAt: '2026-08-14'
    },
    {
      id: 'OCA-PET-003',
      name: 'Rocky',
      species: 'Canino',
      breed: 'Pastor Alemán',
      sex: 'Macho',
      birthDate: '2023-06-10',
      weightKg: 34.0,
      color: 'Negro y Fuego',
      microchipOrTag: 'COL-OCA-98215',
      neighborhood: 'El Carmen',
      lat: 8.2394,
      lng: -73.3518,
      sterilized: false,
      allergies: 'Ninguna reportada',
      ownerId: 'USR-PRO-02',
      registeredByVetId: 'USR-VET-01',
      createdAt: '2026-08-15'
    },
    {
      id: 'OCA-PET-004',
      name: 'Kiara',
      species: 'Canino',
      breed: 'French Poodle',
      sex: 'Hembra',
      birthDate: '2024-11-02',
      weightKg: 6.2,
      color: 'Blanco',
      microchipOrTag: 'COL-OCA-98301',
      neighborhood: 'Santa Clara',
      lat: 8.2485,
      lng: -73.3612,
      sterilized: true,
      allergies: 'Ninguna reportada',
      ownerId: 'USR-PRO-03',
      registeredByVetId: 'USR-VET-02',
      createdAt: '2026-09-05'
    },
    {
      id: 'OCA-PET-005',
      name: 'Simba',
      species: 'Felino',
      breed: 'Angora Turco',
      sex: 'Macho',
      birthDate: '2024-07-19',
      weightKg: 4.4,
      color: 'Naranja atigrado',
      microchipOrTag: 'COL-OCA-98412',
      neighborhood: 'El Carmen',
      lat: 8.2381,
      lng: -73.3529,
      sterilized: true,
      allergies: 'Ninguna reportada',
      ownerId: 'USR-PRO-02',
      registeredByVetId: 'USR-VET-02',
      createdAt: '2026-09-18'
    },
    {
      id: 'OCA-PET-006',
      name: 'Zeus',
      species: 'Canino',
      breed: 'Labrador Retriever',
      sex: 'Macho',
      birthDate: '2023-11-12',
      weightKg: 31.2,
      color: 'Chocolate',
      microchipOrTag: 'COL-OCA-98504',
      neighborhood: 'Centro',
      lat: 8.2358,
      lng: -73.3552,
      sterilized: true,
      allergies: 'Ninguna reportada',
      ownerId: 'USR-PRO-03',
      registeredByVetId: 'USR-VET-01',
      createdAt: '2026-10-02'
    }
  ],

  vaccinations: [
    {
      id: 'BIO-2026-101',
      petId: 'OCA-PET-001',
      category: 'VACUNA',
      vaccineName: 'Antirrábica Canina (Rabisin)',
      biologicalCode: 'LOT-RB-9941A',
      dateAdministered: '2026-02-15',
      nextBoosterDate: '2026-11-28',
      doseVolume: '1.0 mL (Subcutánea)',
      vetId: 'USR-VET-01',
      vetName: 'Dr. Carlos Eduardo Quintero Peñaranda',
      vetLicense: 'COMVEZCOL-45892',
      clinicName: 'Centro Clínico Veterinario San Francisco',
      observations: 'Paciente sin reacciones adversas. Esquema zoonótico obligatorio.',
      digitalSignatureHash: 'SIG-VET01-8F92A1C4'
    },
    {
      id: 'BIO-2026-102',
      petId: 'OCA-PET-001',
      category: 'VACUNA',
      vaccineName: 'Polivalente Séxtuple (Nobivac DHPPi+L)',
      biologicalCode: 'LOT-NV-4421B',
      dateAdministered: '2026-05-10',
      nextBoosterDate: '2027-05-10',
      doseVolume: '1.0 mL (Subcutánea)',
      vetId: 'USR-VET-01',
      vetName: 'Dr. Carlos Eduardo Quintero Peñaranda',
      vetLicense: 'COMVEZCOL-45892',
      clinicName: 'Centro Clínico Veterinario San Francisco',
      observations: 'Refuerzo anual contra Moquillo, Parvovirus, Hepatitis y Leptospira.',
      digitalSignatureHash: 'SIG-VET01-3B77D9E1'
    },
    {
      id: 'BIO-2026-103',
      petId: 'OCA-PET-001',
      category: 'DESPARASITACION',
      vaccineName: 'Endoparasiticida Total (Drontal Plus)',
      biologicalCode: 'LOT-DR-1180C',
      dateAdministered: '2026-08-12',
      nextBoosterDate: '2026-11-22',
      doseVolume: '3 Tabletas (Vía Oral - 28.5 kg)',
      vetId: 'USR-VET-01',
      vetName: 'Dr. Carlos Eduardo Quintero Peñaranda',
      vetLicense: 'COMVEZCOL-45892',
      clinicName: 'Centro Clínico Veterinario San Francisco',
      observations: 'Control preventivo trimestral contra nematodos y cestodos.',
      digitalSignatureHash: 'SIG-VET01-9C12E4F0'
    },
    {
      id: 'BIO-2026-104',
      petId: 'OCA-PET-002',
      category: 'VACUNA',
      vaccineName: 'Triple Felina (Feligen CRP)',
      biologicalCode: 'LOT-FL-7732M',
      dateAdministered: '2026-03-20',
      nextBoosterDate: '2026-11-24',
      doseVolume: '1.0 mL (Subcutánea)',
      vetId: 'USR-VET-02',
      vetName: 'Dra. Valentina Coronel Bayona',
      vetLicense: 'COMVEZCOL-51209',
      clinicName: 'Clínica Veterinaria Huellas del Catatumbo',
      observations: 'Inmunización contra Rinotraqueítis, Calicivirus y Panleucopenia.',
      digitalSignatureHash: 'SIG-VET02-6A44B8D2'
    },
    {
      id: 'BIO-2026-105',
      petId: 'OCA-PET-003',
      category: 'VACUNA',
      vaccineName: 'Antirrábica Canina (Defensor 3)',
      biologicalCode: 'LOT-DF-8820X',
      dateAdministered: '2025-10-25',
      nextBoosterDate: '2026-10-25',
      doseVolume: '1.0 mL (Subcutánea)',
      vetId: 'USR-VET-01',
      vetName: 'Dr. Carlos Eduardo Quintero Peñaranda',
      vetLicense: 'COMVEZCOL-45892',
      clinicName: 'Centro Clínico Veterinario San Francisco',
      observations: 'Requiere programación inmediata de refuerzo anual obligatorio.',
      digitalSignatureHash: 'SIG-VET01-5D19C7A3'
    },
    {
      id: 'BIO-2026-106',
      petId: 'OCA-PET-004',
      category: 'VACUNA',
      vaccineName: 'Antirrábica + Parvovirus/Moquillo (Vanguard Plus)',
      biologicalCode: 'LOT-VG-5019K',
      dateAdministered: '2026-09-05',
      nextBoosterDate: '2027-09-05',
      doseVolume: '1.0 mL (Subcutánea)',
      vetId: 'USR-VET-02',
      vetName: 'Dra. Valentina Coronel Bayona',
      vetLicense: 'COMVEZCOL-51209',
      clinicName: 'Clínica Veterinaria Huellas del Catatumbo',
      observations: 'Esquema al día. Excelente condición corporal.',
      digitalSignatureHash: 'SIG-VET02-1E88F3B9'
    },
    {
      id: 'BIO-2026-107',
      petId: 'OCA-PET-005',
      category: 'DESPARASITACION',
      vaccineName: 'Antiparasitario Felino Broadline Spot-On',
      biologicalCode: 'LOT-BL-3092F',
      dateAdministered: '2026-09-18',
      nextBoosterDate: '2026-12-18',
      doseVolume: '0.9 mL (Tópica Spot-On)',
      vetId: 'USR-VET-02',
      vetName: 'Dra. Valentina Coronel Bayona',
      vetLicense: 'COMVEZCOL-51209',
      clinicName: 'Clínica Veterinaria Huellas del Catatumbo',
      observations: 'Aplicación preventiva interna y externa.',
      digitalSignatureHash: 'SIG-VET02-4F90E1A2'
    },
    {
      id: 'BIO-2026-108',
      petId: 'OCA-PET-006',
      category: 'VACUNA',
      vaccineName: 'Antirrábica Canina (Rabisin)',
      biologicalCode: 'LOT-RB-9941A',
      dateAdministered: '2026-10-02',
      nextBoosterDate: '2027-10-02',
      doseVolume: '1.0 mL (Subcutánea)',
      vetId: 'USR-VET-01',
      vetName: 'Dr. Carlos Eduardo Quintero Peñaranda',
      vetLicense: 'COMVEZCOL-45892',
      clinicName: 'Centro Clínico Veterinario San Francisco',
      observations: 'Inmunización antirrábica anual verificada en jornada centro.',
      digitalSignatureHash: 'SIG-VET01-7C31B0E8'
    }
  ]
};

/**
 * Puntos Institucionales y Clínicas Veterinarias Georreferenciadas en Ocaña
 */
const OcanaGeoPoints = {
  neighborhoodCoords: {
    'Centro': { lat: 8.2358, lng: -73.3545 },
    'La Primavera': { lat: 8.2440, lng: -73.3588 },
    'El Carmen': { lat: 8.2389, lng: -73.3522 },
    'Santa Clara': { lat: 8.2482, lng: -73.3610 },
    'Ciudadela Norte': { lat: 8.2520, lng: -73.3635 },
    'Juan XXIII': { lat: 8.2330, lng: -73.3585 },
    'Agua de la Virgen': { lat: 8.2298, lng: -73.3530 },
    'Acolsure / UFPSO': { lat: 8.2308, lng: -73.3455 }
  },

  institutions: [
    {
      id: 'INST-01',
      name: 'Centro Clínico Veterinario San Francisco',
      type: 'CLÍNICA ACREDITADA',
      director: 'Dr. Carlos Eduardo Quintero (COMVEZCOL-45892)',
      address: 'Calle 11 # 14-32 Centro, Ocaña',
      lat: 8.2365,
      lng: -73.3548
    },
    {
      id: 'INST-02',
      name: 'Clínica Veterinaria Huellas del Catatumbo',
      type: 'CLÍNICA ACREDITADA',
      director: 'Dra. Valentina Coronel Bayona (COMVEZCOL-51209)',
      address: 'Av. Francisco Fernández de Contreras # 20-15, Ocaña',
      lat: 8.2412,
      lng: -73.3575
    },
    {
      id: 'INST-03',
      name: 'Secretaría de Salud Municipal de Ocaña',
      type: 'AUTORIDAD SANITARIA',
      director: 'Vigilancia Epidemiológica y Zoonosis',
      address: 'Palacio Municipal, Parque 29 de Mayo, Ocaña',
      lat: 8.2351,
      lng: -73.3539
    },
    {
      id: 'INST-04',
      name: 'UFPSO - Campus Universitario Vía Acolsure',
      type: 'NODO ACADÉMICO E INVESTIGACIÓN',
      director: 'Ingeniería de Sistemas • Proyecto Integrador I',
      address: 'Vía Acolsure, Sede El Algodonal, Ocaña',
      lat: 8.2305,
      lng: -73.3452
    }
  ],

  biologicalCatalog: [
    {
      key: 'RABIA',
      label: '🛡️ Antirrábica Oficial',
      category: 'VACUNA',
      vaccineName: 'Antirrábica Canina/Felina (Rabisin)',
      codePrefix: 'LOT-RB-',
      defaultDose: '1.0 mL (Subcutánea)',
      boosterDays: 365,
      observations: 'Esquema zoonótico obligatorio anual sin reacciones adversas.'
    },
    {
      key: 'SEXTUPLE',
      label: '💉 Polivalente Séxtuple Canina',
      category: 'VACUNA',
      vaccineName: 'Polivalente Séxtuple (Nobivac DHPPi+L)',
      codePrefix: 'LOT-NV-',
      defaultDose: '1.0 mL (Subcutánea)',
      boosterDays: 365,
      observations: 'Inmunización contra Moquillo, Parvovirus, Hepatitis, Parainfluenza y Leptospira.'
    },
    {
      key: 'TRIPLE_FELINA',
      label: '🐈 Triple Felina CRP',
      category: 'VACUNA',
      vaccineName: 'Triple Felina (Feligen CRP)',
      codePrefix: 'LOT-FL-',
      defaultDose: '1.0 mL (Subcutánea)',
      boosterDays: 365,
      observations: 'Protección contra Rinotraqueítis viral, Calicivirus y Panleucopenia felina.'
    },
    {
      key: 'ENDOPARASITO',
      label: '💊 Desparasitación Oral Total',
      category: 'DESPARASITACION',
      vaccineName: 'Endoparasiticida Amplio Espectro (Drontal Plus)',
      codePrefix: 'LOT-DR-',
      defaultDose: '1 Tableta / 10 kg (Vía Oral)',
      boosterDays: 90,
      observations: 'Control preventivo trimestral contra nematodos gastrointestinales y cestodos.'
    },
    {
      key: 'ECTOPARASITO',
      label: '💧 Control Garrapatas / Pulgas',
      category: 'DESPARASITACION',
      vaccineName: 'Ectoparasiticida Sistémico (Bravecto / NexGard)',
      codePrefix: 'LOT-EC-',
      defaultDose: '1 Comprimido masticable según peso',
      boosterDays: 90,
      observations: 'Prevención activa contra vectores transmisores de Ehrlichia y Babesia en Ocaña.'
    }
  ]
};

const DataStore = {
  getData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return this.resetToSeed();
    }
    try {
      const parsed = JSON.parse(raw);
      // Asegurar que las mascotas tengan coordenadas para el mapa de Ocaña
      if (Array.isArray(parsed.pets)) {
        parsed.pets.forEach((p, idx) => {
          if (!p.neighborhood) p.neighborhood = idx % 2 === 0 ? 'La Primavera' : 'El Carmen';
          if (!p.lat || !p.lng) {
            const coords = OcanaGeoPoints.neighborhoodCoords[p.neighborhood] || { lat: 8.2377, lng: -73.3560 };
            p.lat = coords.lat + ((idx % 5) - 2) * 0.0008;
            p.lng = coords.lng + ((idx % 4) - 1.5) * 0.0008;
          }
        });
      }
      return parsed;
    } catch (e) {
      console.error('Error al leer almacenamiento local, restaurando base:', e);
      return this.resetToSeed();
    }
  },

  saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  resetToSeed() {
    const fresh = {
      users: buildSeedUsers(),
      pets: JSON.parse(JSON.stringify(InitialSeedData.pets)),
      vaccinations: JSON.parse(JSON.stringify(InitialSeedData.vaccinations))
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  },

  calculateAge(birthDateStr) {
    if (!birthDateStr) return 'No especificada';
    const birth = new Date(birthDateStr);
    const refDate = new Date('2026-11-18');
    let years = refDate.getFullYear() - birth.getFullYear();
    let months = refDate.getMonth() - birth.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years <= 0) {
      return `${Math.max(1, months)} mes(es)`;
    }
    return months > 0 ? `${years} año(s), ${months} mes(es)` : `${years} año(s)`;
  },

  getAlertStatus(nextBoosterDateStr) {
    const today = new Date('2026-11-18T00:00:00');
    const target = new Date(nextBoosterDateStr + 'T00:00:00');
    const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        code: 'OVERDUE',
        label: `Refuerzo vencido (${Math.abs(diffDays)} días)`,
        shortLabel: 'Vencido',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        dotClass: 'bg-rose-500',
        days: diffDays
      };
    } else if (diffDays <= 30) {
      return {
        code: 'UPCOMING',
        label: `Próximo en ${diffDays} días`,
        shortLabel: 'Próximo',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass: 'bg-amber-500',
        days: diffDays
      };
    } else {
      return {
        code: 'OK',
        label: `Vigente (${diffDays} días restantes)`,
        shortLabel: 'Al día',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-500',
        days: diffDays
      };
    }
  },

  /**
   * Genera un código QR Vectorial (SVG) 100% REAL y escaneable por cualquier celular (ISO/IEC 18004)
   * si la librería qrcode-generator está disponible, con respaldo determinista offline.
   */
  generateQRCodeSVG(payloadText, size = 96) {
    if (typeof window.qrcode === 'function') {
      try {
        const qr = window.qrcode(0, 'M');
        qr.addData(String(payloadText));
        qr.make();
        const moduleCount = qr.getModuleCount();
        let rects = '';
        for (let r = 0; r < moduleCount; r++) {
          for (let c = 0; c < moduleCount; c++) {
            if (qr.isDark(r, c)) {
              rects += `<rect x="${c + 2}" y="${r + 2}" width="1" height="1" fill="#0f172a"/>`;
            }
          }
        }
        const totalSize = moduleCount + 4;
        return `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${size}" height="${size}" shape-rendering="crispEdges" class="rounded-xl border border-slate-200 p-1 bg-white shadow-sm">
            <rect width="${totalSize}" height="${totalSize}" fill="#ffffff"/>
            ${rects}
          </svg>
        `;
      } catch (err) {
        console.warn('Usando generador QR SVG determinista de respaldo:', err);
      }
    }

    // Respaldo determinista SVG
    const gridSize = 21;
    const matrix = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));

    const drawFinder = (r0, c0) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            matrix[r0 + r][c0 + c] = 1;
          } else {
            matrix[r0 + r][c0 + c] = 2;
          }
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(0, gridSize - 7);
    drawFinder(gridSize - 7, 0);

    let seed = 2166136261;
    for (let i = 0; i < payloadText.length; i++) {
      seed ^= payloadText.charCodeAt(i);
      seed = Math.imul(seed, 16777619);
    }

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (matrix[r][c] !== 0) continue;
        if (r === 6 || c === 6) {
          matrix[r][c] = (r + c) % 2 === 0 ? 1 : 2;
          continue;
        }
        seed ^= (r * 31 + c * 17) & 0xff;
        seed = Math.imul(seed, 1664525) + 1013904223;
        matrix[r][c] = ((seed >>> 16) & 1) === 1 ? 1 : 2;
      }
    }

    let rects = '';
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (matrix[r][c] === 1) {
          rects += `<rect x="${c}" y="${r}" width="1" height="1" fill="#0f172a"/>`;
        }
      }
    }

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${gridSize} ${gridSize}" width="${size}" height="${size}" shape-rendering="crispEdges" class="rounded-xl border border-slate-200 p-1.5 bg-white">
        <rect width="${gridSize}" height="${gridSize}" fill="#ffffff"/>
        ${rects}
      </svg>
    `;
  },

  /**
   * Busca y verifica públicamente un certificado por código de mascota (OCA-PET-001),
   * microchip (COL-OCA-98102), sello de firma digital (SIG-VET01-...) o documento del propietario.
   */
  verifyPublicRecord(rawQuery, dbInstance = null) {
    const db = dbInstance || this.getData();
    const q = (rawQuery || '').trim().toUpperCase();
    if (!q) return null;

    // 1. Buscar por ID de mascota o Microchip o Nombre
    let pet = db.pets.find(
      p => p.id.toUpperCase() === q ||
           (p.microchipOrTag && p.microchipOrTag.toUpperCase() === q) ||
           p.name.toUpperCase() === q
    );

    let matchedSignatureRecord = null;

    // 2. Si no es mascota directa, buscar por Sello de Firma Digital (SIG-...) o Lote
    if (!pet) {
      matchedSignatureRecord = db.vaccinations.find(
        v => (v.digitalSignatureHash && v.digitalSignatureHash.toUpperCase() === q) ||
             v.id.toUpperCase() === q
      );
      if (matchedSignatureRecord) {
        pet = db.pets.find(p => p.id === matchedSignatureRecord.petId);
      }
    }

    // 3. Si tampoco, buscar por Documento de Identidad del Propietario
    if (!pet) {
      const ownerMatch = db.users.find(u => u.document.toUpperCase() === q);
      if (ownerMatch) {
        pet = db.pets.find(p => p.ownerId === ownerMatch.id);
      }
    }

    if (!pet) return null;

    const owner = db.users.find(u => u.id === pet.ownerId);
    const records = db.vaccinations.filter(v => v.petId === pet.id);
    const hasOverdue = records.some(r => this.getAlertStatus(r.nextBoosterDate).code === 'OVERDUE');
    const hasRabies = records.some(r => r.vaccineName.toLowerCase().includes('antirrábica') || r.vaccineName.toLowerCase().includes('rabisin') || r.vaccineName.toLowerCase().includes('defensor'));

    return {
      verified: true,
      verificationTimestamp: new Date().toISOString(),
      municipality: 'Municipio de Ocaña, Norte de Santander',
      authority: 'Red Municipal EsquemaVet Ocaña • UFPSO',
      matchedSignatureRecord,
      pet,
      owner: owner ? {
        name: owner.name,
        documentMasked: owner.document.slice(0, 4) + '****' + owner.document.slice(-2),
        documentFull: owner.document,
        phone: owner.phone,
        address: owner.address
      } : null,
      immunizationSummary: {
        totalRecords: records.length,
        rabiesProtected: hasRabies,
        statusLabel: records.length === 0 ? 'SIN ESQUEMA REGISTRADO' : hasOverdue ? 'REFUERZO PENDIENTE' : 'ESQUEMA SANITARIO AL DÍA',
        isCompliant: records.length > 0 && !hasOverdue
      },
      records
    };
  }
};

window.OcanaGeoPoints = OcanaGeoPoints;
window.DataStore = DataStore;
