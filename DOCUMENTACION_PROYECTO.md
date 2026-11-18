# 🐾 EsquemaVet Ocaña — Documentación Técnica del Aplicativo Web (Versión Feria de Proyectos UFPSO)

**Título del Proyecto:** Desarrollo de un aplicativo web para la gestión de historiales sanitarios, verificación pública QR y control de vacunación de mascotas en el municipio de Ocaña  
**Autores:**  
- Franklin Mauricio Hernández Galvis (Código: `0192326`)  
- Andrés Felipe Carrascal Gómez (Código: `0192321`)  

**Docente:** MSc. Yegny Karina Amaya Torrado  
**Asignatura:** Proyecto Integrador I — Ingeniería de Sistemas  
**Institución:** Universidad Francisco de Paula Santander Seccional Ocaña (UFPSO) — II Semestre 2026  

---

## 1. Arquitectura de Producción y Novedades para la Feria de Proyectos

En esta versión ejecutiva para la **Feria de Proyectos de Ingeniería de Sistemas (UFPSO)**, el aplicativo **EsquemaVet Ocaña** fue potenciado con **integraciones a APIs públicas en tiempo real**, **generación de códigos QR reales bajo estándar ISO/IEC 18004 escaneables con teléfonos móviles**, **cartografía epidemiológica interactiva del municipio de Ocaña** y una **consola OpenAPI REST en vivo**.

### Principales Innovaciones Implementadas

1. **Validador Público de Certificados y Códigos QR Reales (`ISO/IEC 18004` + Deep Linking `?verify=`):**
   - Cada **Carnet Sanitario Digital** genera dinámicamente un código QR vectorial real que codifica la URL pública de verificación del paciente (`?verify=OCA-PET-001`).
   - Al escanear el código QR con la cámara de cualquier teléfono celular (o usar el **Buscador de Verificación Pública** desde la portada sin necesidad de iniciar sesión), se despliega el **Certificado Oficial de Validación Sanitaria**, permitiendo comprobar la vigencia antirrábica, los lotes aplicados y la autenticidad del sello criptográfico (`SIG-VET...`) del médico veterinario.

2. **Integración en Tiempo Real con API Biometeorológica Pública (`Open-Meteo REST API`):**
   - Conectado en vivo a las coordenadas oficiales de **Ocaña, Norte de Santander (`8.2377° N, 73.3560° O`, 1.202 m s. n. m.)** mediante `https://api.open-meteo.com/v1/forecast`.
   - Evalúa automáticamente la temperatura, humedad relativa y precipitación actuales en Ocaña para calcular el **Índice de Riesgo Epidemiológico de Vectores y Ectoparásitos** (proliferación de garrapatas *Rhipicephalus sanguineus* transmisoras de Ehrlichiosis y pulgas), emitiendo recomendaciones preventivas en el Panel de Control.

3. **Cartografía Epidemiológica Georreferenciada de Ocaña (`OpenStreetMap` + `Leaflet API`):**
   - En el módulo de **Vigilancia Epidemiológica**, la Secretaría de Salud y los veterinarios visualizan un mapa interactivo real del municipio de Ocaña con:
     - Ubicación de las clínicas veterinarias acreditadas, la Secretaría de Salud (Parque 29 de Mayo) y el campus de la **UFPSO (Sede El Algodonal / Vía Acolsure)**.
     - Georreferenciación de cada mascota censada por sectores/barrios de Ocaña (*La Primavera*, *El Carmen*, *Santa Clara*, *Centro*, *Ciudadela Norte*, *Juan XXIII*, *Agua de la Virgen*) con código cromático según su estado inmunológico y cálculo de la meta de cobertura antirrábica de la OMS/OPS (≥ 80%, ODS 3).

4. **Despacho Directo de Alertas Preventivas vía WhatsApp Oficial (`wa.me` API):**
   - El calendario preventivo formatea automáticamente el recordatorio sanitario oficial con los datos del paciente, lote, clínica certificadora y enlace público de verificación QR, permitiendo enviarlo directamente al WhatsApp del propietario (`+57 ...`) con un solo clic.

5. **Asistente Clínico de Autocompletado de Protocolos Biológicos:**
   - En el módulo **Aplicar Biológico**, el médico veterinario cuenta con botones de protocolo rápido (*Antirrábica Oficial*, *Polivalente Séxtuple*, *Triple Felina CRP*, *Desparasitación Oral Total*, *Control de Garrapatas/Pulgas*) que calculan automáticamente la dosis sugerida según el peso en kilogramos del paciente y programan la fecha exacta del próximo refuerzo (+365 días o +90 días).

6. **Consola Interactiva de API Pública REST (`OpenAPI v1 Explorer`) + Google Cloud Firestore REST:**
   - Incluye un explorador interactivo de endpoints REST (`GET /api/v1/ocana/censo`, `GET /api/v1/ocana/verify/OCA-PET-001`, `GET /api/v1/ocana/biometeo`, `POST /api/v1/cloud/sync-all`) con medición de latencia en milisegundos, exportación de matriz epidemiológica a **Microsoft Excel (`.CSV`)** y respaldos completos en `.JSON`.

---

## 2. Recursos, Lenguajes Base, Frameworks y APIs Utilizadas

| Categoría | Tecnología / Recurso | Propósito en el Aplicativo |
| :--- | :--- | :--- |
| **Lenguajes Base** | **HTML5, CSS3, JavaScript (ES6+)** | Arquitectura SPA modular, reglas `@media print` para exportación PDF del Carnet Digital. |
| **Framework CSS** | **Tailwind CSS (v3.4 CDN)** | Diseño adaptable (*Responsive Design*), tarjetas clínicas de alto contraste y modales ejecutivos. |
| **APIs Públicas Conectadas** | **Open-Meteo API, OpenStreetMap API, WhatsApp API & Firestore REST** | Telemetría climática y riesgo vectorial en Ocaña, cartografía municipal, notificaciones preventivas y sincronización Cloud. |
| **Estándar QR Real** | **QRCode-Generator (ISO/IEC 18004)** | Generación de códigos QR vectoriales reales escaneables desde cualquier cámara móvil hacia la URL pública del carnet. |
| **Visualización y Mapas** | **Chart.js (v4.4.1) & Leaflet.js (v1.9.4)** | Gráficas estadísticas interactivas y mapa epidemiológico georreferenciado por barrios de Ocaña. |
| **Seguridad Criptográfica** | **SecurityEngine (`sha256v2$...`)** | Cifrado determinista con *salt* para credenciales de usuario y sellos digitales de certificación veterinaria (`SIG-VET...`). |

---

## 3. Cuentas Institucionales Precargadas para Demostración en Feria

| Perfil | Titular | Usuario (Correo o Documento) | Contraseña |
| :--- | :--- | :--- | :--- |
| **Médico Veterinario** | Dr. Carlos Eduardo Quintero | `dr.quintero@vetocana.com` o `88245910` | `VetOcana2026*` *(o `123456`)* |
| **Médico Veterinario** | Dra. Valentina Coronel Bayona | `dra.coronel@vetocana.com` o `1091667112` | `VetOcana2026*` *(o `123456`)* |
| **Propietario** | Franklin Mauricio Hernández | `fmhernandezg@ufpso.edu.co` o `1091678234` | `Ocanavet2026*` *(o `123456`)* |
| **Propietario** | Andrés Felipe Carrascal | `afcarrascalg@ufpso.edu.co` o `1091681920` | `Ocanavet2026*` *(o `123456`)* |
| **Salud Pública** | Secretaría de Salud de Ocaña | `saludpublica@ocana-nortedesantander.gov.co` | `SaludOcana2026*` *(o `123456`)* |
