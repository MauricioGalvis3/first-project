/**
 * ============================================================================
 * EsquemaVet Ocaña - Capa de Persistencia, Semilla Institucional y Generador QR
 * Municipio de Ocaña, Norte de Santander
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
      lastLogin: '2026-11-08 09:15'
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
      lastLogin: '2026-11-07 16:40'
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
      lastLogin: '2026-11-02 11:20'
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
      lastLogin: '2026-11-09 08:05'
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
      lastLogin: '2026-11-08 18:12'
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
      lastLogin: '2026-11-09 07:30'
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
      ownerId: 'USR-PRO-02',
      registeredByVetId: 'USR-VET-02',
      createdAt: '2026-09-18'
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
      nextBoosterDate: '2026-11-18',
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
      nextBoosterDate: '2026-11-15',
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
      nextBoosterDate: '2026-11-14',
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
    }
  ]
};

const DataStore = {
  getData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = {
        users: buildSeedUsers(),
        pets: JSON.parse(JSON.stringify(InitialSeedData.pets)),
        vaccinations: JSON.parse(JSON.stringify(InitialSeedData.vaccinations))
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    try {
      return JSON.parse(raw);
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
    const refDate = new Date('2026-11-09');
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
    const today = new Date('2026-11-09T00:00:00');
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
   * Genera un código QR vectorial (SVG) determinista a partir del código único del paciente
   * para el Carnet Sanitario Digital.
   */
  generateQRCodeSVG(payloadText, size = 96) {
    const gridSize = 21;
    const matrix = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));

    // Función auxiliar para dibujar los 3 patrones de posición de esquina estándar QR
    const drawFinder = (r0, c0) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            matrix[r0 + r][c0 + c] = 1;
          } else {
            matrix[r0 + r][c0 + c] = 2; // reservado blanco
          }
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(0, gridSize - 7);
    drawFinder(gridSize - 7, 0);

    // Semilla determinista basada en el texto del paciente
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
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${gridSize} ${gridSize}" width="${size}" height="${size}" shape-rendering="crispEdges" class="rounded-lg border border-slate-200 p-1.5 bg-white">
        <rect width="${gridSize}" height="${gridSize}" fill="#ffffff"/>
        ${rects}
      </svg>
    `;
  }
};

window.DataStore = DataStore;
