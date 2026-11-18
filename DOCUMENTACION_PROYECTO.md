# 🐾 EsquemaVet Ocaña — Documentación Técnica del Aplicativo Web (Versión Entregable — Fase 2)

**Título del Proyecto:** Desarrollo de un aplicativo web para la gestión de historiales sanitarios y control de vacunación de mascotas en el municipio de Ocaña  
**Autores:**  
- Franklin Mauricio Hernández Galvis (Código: `0192326`)  
- Andrés Felipe Carrascal Gómez (Código: `0192321`)  

**Docente:** MSc. Yegny Karina Amaya Torrado  
**Asignatura:** Proyecto Integrador I — Ingeniería de Sistemas  
**Institución:** Universidad Francisco de Paula Santander Seccional Ocaña (UFPSO) — II Semestre 2026  

---

## 1. Evolución a Versión Entregable Profesional (Fase 2)

En esta fase se transformó el prototipo inicial en una **aplicación web de producción limpia, ejecutiva y entregable**, eliminando de las interfaces cualquier etiqueta técnica o académica (`RF`, `RNF`, `PRO 01`, etc.) y adoptando una experiencia de usuario (UX/UI) propia de un software clínico e institucional moderno.

### Principales Mejoras Implementadas

1. **Interfaz Limpia y Profesional (Sin etiquetas de RF en pantalla):**
   - Rediseño integral con tipografía ejecutiva (**Plus Jakarta Sans** + **Inter**) e iconografía vectorial médica mediante **Lucide Icons**.
   - Terminología natural orientada al usuario final (*Panel de Control*, *Carnet Sanitario Digital*, *Directorio de Mascotas*, *Acto Médico Veterinario*, *Vigilancia Epidemiológica Municipal*, *Infraestructura Cloud*).

2. **Sistema de Registro con Credenciales Almacenables, Cifradas y Comprobables (`SecurityEngine`):**
   - **Cifrado Determinista (`sha256v2$...`):** Todas las contraseñas creadas en el apartado **Crear Cuenta** (o asignadas por el veterinario en consulta presencial) se transforman mediante una función de resumen criptográfico con *salt* (`ESQUEMAVET_OCANA_2026`) antes de almacenarse en la base de datos.
   - **Medidor de Fortaleza en Tiempo Real:** Durante el registro, el usuario visualiza una barra dinámica que evalúa la complejidad de su contraseña (*Básica*, *Buena*, *Alta Seguridad*) junto con validación de confirmación de clave.
   - **Inicio de Sesión Comprobable por Correo o Documento:** Cualquier cuenta registrada queda almacenada de forma persistente y puede iniciar sesión en cualquier momento ingresando su **correo electrónico** o su **número de documento (Cédula / NIT)** junto con su contraseña, con opción de *Mantener sesión iniciada*.
   - **Módulo de Verificación y Cambio de Contraseña:** Dentro de **Mi Cuenta y Usuarios**, cada usuario puede visualizar la firma criptográfica activa de su credencial y comprobar/actualizar su contraseña validando primero su clave vigente.
   - **Habilitación de Cuentas en Consulta Presencial:** Cuando el Médico Veterinario registra un nuevo propietario desde el consultorio, el sistema genera automáticamente su credencial cifrada (por defecto su número de cédula o la clave indicada) para que el propietario pueda ingresar de inmediato desde su celular o computador.

3. **Criterios Adicionales de Visualización e Imagen Institucional:**
   - **Código QR Vectorial Único en el Carnet Digital:** Cada mascota cuenta con un código QR vectorial (`SVG`) generado dinámicamente en su **Carnet Sanitario Digital** (`DataStore.generateQRCodeSVG()`), codificando su identificador sanitario (`OCA-PET-XXX`), nombre y documento del propietario.
   - **Analítica Visual con Gráficas Interactivas (`Chart.js`):**
     - Gráfica de anillo (*Doughnut*) en el **Panel de Control** que muestra la proporción de esquemas vigentes, próximos a vencer (`≤ 30 días`) y vencidos.
     - Gráfica de barras comparativa en **Vigilancia Epidemiológica** con el balance del censo canino, censo felino, vacunas certificadas y controles antiparasitarios en el municipio de Ocaña.
   - **Filtros Inteligentes de Alertas Preventivas:** Clasificación instantánea del calendario preventivo en *Todos*, *Vencidos*, *Próximos 30 días* y *Al día*.

4. **Conexión con Google Cloud Firestore y Gestión Completa de Respaldos (Exportación e Importación):**
   - Panel interactivo para configurar el `Project ID`, `Web API Key` y `Región` de **Google Cloud Firestore**, sincronizando las colecciones (`usuarios_sistema`, `mascotas_censo`, `historial_biologicos`) mediante la API REST de Firestore y registrando cada operación en la **Bitácora de Transacciones y Sincronización Cloud**.
   - **Exportación e Importación de Copias de Seguridad (`.JSON`):** Permite descargar la base de datos completa en un archivo `.json` y restaurarla seleccionando el archivo desde el equipo.

---

## 2. Recursos, Lenguajes Base y Frameworks Utilizados

| Categoría | Tecnología / Recurso | Propósito en el Aplicativo |
| :--- | :--- | :--- |
| **Lenguajes Base** | **HTML5, CSS3, JavaScript (ES6+)** | Estructura semántica SPA, estilos de impresión `@media print` para el Carnet Digital y lógica modular orientada a objetos. |
| **Framework CSS** | **Tailwind CSS (v3.4 CDN)** | Diseño adaptable (*Responsive Design*), tarjetas clínicas de alto contraste y componentes modernos. |
| **Visualización de Datos** | **Chart.js (v4.4.1)** | Gráficas estadísticas interactivas para el estado de esquemas preventivos y el censo epidemiológico municipal. |
| **Iconografía** | **Lucide Icons** | Iconos vectoriales limpios para navegación médica, seguridad y certificaciones. |
| **Tipografías** | **Plus Jakarta Sans, Inter & Dancing Script** | Legibilidad ejecutiva en tableros de datos y representación caligráfica de la firma electrónica del médico veterinario. |
| **Seguridad y Datos** | **SecurityEngine + Web Storage + Firestore REST** | Cifrado y verificación de contraseñas, persistencia local inmediata, generador QR SVG y sincronización con Google Cloud. |

---

## 3. Estructura de Archivos del Proyecto

```text
esquemaVet/
├── index.html                  # Aplicación web principal (Versión entregable sin etiquetas de RF)
├── DOCUMENTACION_PROYECTO.md   # Documentación técnica precisa de lo realizado y recursos utilizados
├── css/
│   └── styles.css              # Estilos corporativos, sello sanitario y formato de impresión PDF
└── js/
    ├── cloud-config.js         # Motor criptográfico (SecurityEngine) y conector Google Cloud Firestore
    ├── data.js                 # Persistencia de datos, semilla Ocaña y generador de códigos QR SVG
    └── app.js                  # Controlador de autenticación, registro verificable, gráficas y módulos
```

---

## 4. Cuentas Institucionales Precargadas y Prueba de Registro

Además de poder **registrar cualquier cuenta nueva** en la pestaña **Crear Cuenta** y comprobar inmediatamente su ingreso con el documento o correo y contraseña creados, el sistema incluye las siguientes cuentas institucionales verificadas:

| Perfil | Titular | Usuario (Correo o Documento) | Contraseña |
| :--- | :--- | :--- | :--- |
| **Médico Veterinario** | Dr. Carlos Eduardo Quintero | `dr.quintero@vetocana.com` o `88245910` | `VetOcana2026*` *(o `123456`)* |
| **Médico Veterinario** | Dra. Valentina Coronel Bayona | `dra.coronel@vetocana.com` o `1091667112` | `VetOcana2026*` *(o `123456`)* |
| **Propietario** | Franklin Mauricio Hernández | `fmhernandezg@ufpso.edu.co` o `1091678234` | `Ocanavet2026*` *(o `123456`)* |
| **Propietario** | Andrés Felipe Carrascal | `afcarrascalg@ufpso.edu.co` o `1091681920` | `Ocanavet2026*` *(o `123456`)* |
| **Salud Pública** | Secretaría de Salud de Ocaña | `saludpublica@ocana-nortedesantander.gov.co` | `SaludOcana2026*` *(o `123456`)* |
