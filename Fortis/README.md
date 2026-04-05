# Fortis 2.0 — Asesor Financiero AI 🏠📊

Dashboard financiero con IA para el portfolio de empresas de Jorge y Paola.
Conectado a QuickBooks, con análisis automático de gastos y recomendaciones.

---

## ¿Qué hace?

- **Dashboard consolidado** — Ve ingresos vs gastos de todas las empresas o una por una
- **Drill-down de gastos** — Clic en cualquier categoría para ver cada transacción individual
- **Sincronización con QuickBooks** — Jala transacciones automáticamente
- **Asesor AI (Claude)** — Analiza gastos, detecta problemas y dice exactamente qué recortar
- **Chat financiero** — Pregunta lo que necesites sobre tus finanzas en lenguaje natural

---

## Empresas configuradas

| Empresa | Tipo | EIN |
|---------|------|-----|
| Real Legacy LLC | Real Estate (principal) | 88-3202623 |
| JP Legacy Media | Marketing / Referidos | — |
| Paola Diaz Lozada PA | Comisiones | 92-2296944 |
| VAU Nutrition LLC | Nutrition (por iniciar) | — |
| Reborn Houses LLC | Lote Comercial | — |
| Jorge Florez LLC | Personal (inactiva) | — |

---

## Instalación (30 minutos, una sola vez)

### Paso 1 — Requisitos previos

Necesitas tener instalado:
- **Node.js 18+** → https://nodejs.org
- **Git** (opcional) → https://git-scm.com

### Paso 2 — Instalar el proyecto

```bash
# Descomprimir el archivo descargado
unzip fortis-2.zip
cd fortis-2

# Instalar dependencias
npm install

# Crear archivo de configuración
cp .env.example .env.local
```

### Paso 3 — Obtener API Key de Claude

1. Ve a https://console.anthropic.com
2. Crea una cuenta o inicia sesión
3. Ve a **API Keys** → **Create Key**
4. Copia la key y pégala en `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-api03-tu-key-aqui...
```

### Paso 4 — Crear app en QuickBooks Developer (gratis)

1. Ve a https://developer.intuit.com
2. Inicia sesión con tu cuenta de QuickBooks
3. Clic en **"Create an app"**
4. Selecciona **"QuickBooks Online and Payments"**
5. Nombre: `Fortis 2.0`
6. En **Keys & OAuth**:
   - Copia el **Client ID** y **Client Secret**
7. En **Redirect URIs** agrega:
   - Desarrollo: `http://localhost:3000/api/qb/callback`
   - Producción: `https://tu-app.vercel.app/api/qb/callback`

8. Pega las credenciales en `.env.local`:

```
QB_CLIENT_ID=ABxxxxxxxxxxxxxxxxxxxxxxxx
QB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
QB_REDIRECT_URI=http://localhost:3000/api/qb/callback
QB_ENVIRONMENT=production
```

### Paso 5 — Arrancar la aplicación

```bash
npm run dev
```

Abre http://localhost:3000 en tu navegador.

### Paso 6 — Conectar cada empresa a QuickBooks

Para cada empresa, abre esta URL en tu navegador:

```
http://localhost:3000/api/qb/auth?company=real-legacy
http://localhost:3000/api/qb/auth?company=jp-media
http://localhost:3000/api/qb/auth?company=paola-pa
```

Esto te llevará a QuickBooks para autorizar cada empresa.
Una vez autorizada, el token se guarda automáticamente en la base de datos local.

### Paso 7 — Sincronizar transacciones

Haz clic en **"⟳ Sync QuickBooks"** en el sidebar, o usa la API:

```bash
curl -X POST http://localhost:3000/api/qb/sync -H "Content-Type: application/json" -d '{"year": 2025}'
```

---

## Despliegue en producción (Vercel)

### Opción A — Vercel (recomendado, gratis)

1. Sube el proyecto a GitHub
2. Ve a https://vercel.com y conecta tu repo
3. En **Environment Variables**, agrega todas las variables de `.env.local`
4. Cambia `APP_URL` a tu URL de Vercel
5. Actualiza `QB_REDIRECT_URI` en QuickBooks Developer

**Nota**: SQLite no funciona en Vercel serverless. Para producción necesitas:
- Cambiar a **Turso** (SQLite en la nube, gratis) → https://turso.tech
- O **PlanetScale** / **Supabase** (PostgreSQL)

### Opción B — VPS (DigitalOcean, $6/mes)

```bash
# En tu servidor
git clone tu-repo
cd fortis-2
npm install
npm run build
npm start
```

---

## Estructura del proyecto

```
fortis-2/
├── .env.example           # Template de variables de entorno
├── package.json           # Dependencias
├── next.config.js         # Config de Next.js
│
├── lib/
│   ├── companies.js       # Configuración de empresas
│   ├── db.js              # Base de datos SQLite (tokens, transacciones)
│   ├── quickbooks.js      # Cliente OAuth + API de QuickBooks
│   └── claude.js          # Motor de análisis AI con Claude
│
├── pages/
│   ├── _app.js            # Wrapper de Next.js
│   ├── index.js           # Dashboard principal (toda la UI)
│   │
│   └── api/
│       ├── dashboard.js   # GET  - Datos agregados del dashboard
│       ├── transactions.js# GET  - Transacciones por categoría
│       │
│       ├── qb/
│       │   ├── auth.js    # GET  - Inicia OAuth de QuickBooks
│       │   ├── callback.js# GET  - Recibe callback OAuth
│       │   ├── sync.js    # POST - Sincroniza transacciones
│       │   └── status.js  # GET  - Estado de conexión
│       │
│       └── ai/
│           ├── analyze.js # POST - Análisis AI de gastos
│           └── chat.js    # POST - Chat con asesor financiero
│
├── styles/
│   └── globals.css        # Estilos globales (tema oscuro)
│
└── data/
    └── finance.db         # Base de datos SQLite (se crea automáticamente)
```

---

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dashboard?company=all&year=2025` | Datos del dashboard |
| GET | `/api/transactions?category=Contract+Labor` | Transacciones por categoría |
| GET | `/api/qb/auth?company=real-legacy` | Iniciar OAuth |
| GET | `/api/qb/callback` | Callback OAuth (automático) |
| POST | `/api/qb/sync` | Sincronizar QuickBooks |
| GET | `/api/qb/status` | Estado de conexión |
| POST | `/api/ai/analyze` | Análisis AI de gastos |
| POST | `/api/ai/chat` | Chat con asesor |

---

## Costos mensuales

| Servicio | Costo |
|----------|-------|
| QuickBooks Developer App | **$0** (gratis) |
| Claude API (Sonnet) | **~$5-10/mes** (según uso) |
| Vercel hosting | **$0** (plan gratuito) |
| **Total** | **~$5-10/mes** |

vs. Bookkeeper anterior: **$200/mes** → Ahorro de **$190/mes** ($2,280/año)

---

## Soporte

Si tienes problemas:
1. Verifica que `.env.local` tiene todas las variables
2. Revisa la consola del navegador (F12) para errores
3. Revisa los logs del servidor en la terminal donde ejecutas `npm run dev`
4. Para reconectar QuickBooks, visita `/api/qb/auth?company=EMPRESA`
