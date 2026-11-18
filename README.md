# 🐾 EsquemaVet Ocaña

**Plataforma Web de Gestión de Historiales Sanitarios, Carnet Digital y Control de Vacunación de Mascotas en el Municipio de Ocaña**

> **Universidad Francisco de Paula Santander Seccional Ocaña (UFPSO)**  
> **Facultad de Ingenierías — Ingeniería de Sistemas — Proyecto Integrador I (2026)**  
> **Autores:** Franklin Mauricio Hernández Galvis (`0192326`) & Andrés Felipe Carrascal Gómez (`0192321`)  
> **Docente:** MSc. Yegny Karina Amaya Torrado

---

## 📋 Descripción General

**EsquemaVet Ocaña** es un aplicativo web estructurado mediante control de acceso por roles que sistematiza el registro, seguimiento e inmunización (vacunación y desparasitación) de animales de compañía en el municipio de Ocaña, Norte de Santander.

### Características Principales
- 🔐 **Registro y Autenticación con Cifrado Verificable (`SHA-256`):** Creación de cuentas almacenables y comprobables para Propietarios, Médicos Veterinarios (`COMVEZCOL`) y Autoridades de Salud Pública.
- 🪪 **Carnet Sanitario Digital con Código QR Vectorial:** Certificado digital interactivo e imprimible en PDF que reemplaza el carnet físico de cartulina e incluye firmas electrónicas de los médicos veterinarios.
- 🔔 **Calendario Preventivo y Alertas de Refuerzo:** Cálculo automático de vigencia de esquemas (*Al día*, *Próximos 30 días*, *Vencidos*) y envío de recordatorios.
- 📊 **Vigilancia Epidemiológica Municipal:** Tablero estadístico con gráficas interactivas (`Chart.js`) del censo canino y felino y matriz de trazabilidad de lotes biológicos (ODS 3: *Salud y Bienestar*).
- ☁️ **Sincronización Google Cloud Firestore y Copias de Seguridad:** Conector listo para Cloud Firestore e importación/exportación de respaldos en formato `.JSON`.

---

## 🚀 Ejecución Rápida

1. Clona este repositorio o descarga los archivos:
   ```bash
   git clone https://github.com/TU_USUARIO/esquemaVet.git
   ```
2. Abre el archivo [`index.html`](./index.html) directamente en cualquier navegador web moderno (Chrome, Edge, Firefox) o actívalo mediante **GitHub Pages**.
3. Consulta la documentación técnica completa en [`DOCUMENTACION_PROYECTO.md`](./DOCUMENTACION_PROYECTO.md).
