# Fortis — Asesor Financiero AI 🏠📊

Tu sistema financiero personal y empresarial, impulsado por Claude AI.  
**Reemplaza al bookkeeper de $200/mes. Meta: $20,000/mes de ingreso pasivo.**

---

## ¿Qué hace?

- Se conecta automáticamente a QuickBooks de cada empresa
- Jala transacciones semanalmente
- Claude AI categoriza gastos, detecta errores y genera entradas contables
- Analiza gastos personales de Jorge y Paola (CSV de banco/tarjetas)
- Genera reportes semanales y cierres mensuales listos para el contador

---

## Configuración (una sola vez, ~30 minutos)

### Paso 1 — Instalar

```bash
git clone <este-repo>
cd jp-legacy-finance
npm install
cp .env.example .env.local
```

### Paso 2 — Anthropic API Key

1. Ve a https://console.anthropic.com
2. API Keys → Create Key
3. Copia la key en `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

### Paso 3 — Crear app en QuickBooks Developer (gratis)

1. Ve a https://developer.intuit.com
2. Inicia sesión con tu cuenta de QuickBooks
3. Clic en **"Create an app"**
4. Selecciona **"QuickBooks Online and Payments"**
5. Nombre: `JP Legacy Finance`
6. En **"Redirect URIs"** agrega:
   - Desarrollo: `http://localhost:3000/api/qb/callback`
   - Producción: `https://tu-app.vercel.app/api/qb/callback`
7. Copia **Client ID** y **Client Secret** en `.env.local`

### Paso 4 — Realm IDs de cada empresa

El Realm ID está en QuickBooks de cada empresa:
- Abre QuickBooks de cada empresa
- Ve a ⚙️ Configuración → Sobre QuickBooks
- Busca el número de "Company ID" (ejemplo: `9341454972`)
- Cópialo en `.env.local` para cada empresa

```env
QB_REALM_REAL_LEGACY=9341454972
QB_REALM_JP_MEDIA=8834521903
QB_REALM_VAU_NUTRITION=
QB_REALM_PAOLA_PA=7712348901
QB_REALM_REBORN_HOUSES=
QB_REALM_JP_HOMES=
QB_REALM_JORGE_LLC=
```

### Paso 5 — Correr en desarrollo

```bash
npm run dev
```

Abre http://localhost:3000

### Paso 6 — Conectar cada empresa a QuickBooks

1. En el dashboard, ve a la pestaña **"Empresas"**
2. Haz clic en **"Conectar QB"** para cada empresa
3. Se abre una ventana de QuickBooks — autoriza el acceso
4. La empresa queda conectada (badge verde ✓)

---

## Deploy en Vercel (gratis, producción)

```bash
npm install -g vercel
vercel
```

Sigue las instrucciones. Después en el dashboard de Vercel:
1. Ve a tu proyecto → Settings → Environment Variables
2. Agrega todas las variables de `.env.local`
3. Redeploy

---

## Uso diario

### Sincronización semanal (2 minutos)
1. Abre la app
2. Clic en **"⟳ Sincronizar QB"**
3. Clic en **"📊 Reporte semanal"**
4. Claude te da el análisis completo

### Cierre mensual (5 minutos)
1. Selecciona el mes en el dropdown del header
2. Clic en **"Sincronizar QB"**
3. Clic en **"📋 Cierre mensual"**
4. Descarga el reporte para tu contador

### Gastos personales (mensual)
1. Descarga CSV de tus tarjetas Chase/Amex/etc.
2. Ve a pestaña **"Personal"**
3. Pega el contenido del CSV
4. Clic en **"🤖 Analizar con AI"**

---

## Arquitectura

```
jp-legacy-finance/
├── lib/
│   ├── quickbooks.js     — QB API: OAuth, transacciones, reportes
│   ├── claude.js         — Claude AI: análisis, reportes, chat
│   ├── companies.js      — Config de todas las empresas
│   └── tokenStore.js     — Almacenamiento de tokens OAuth
├── pages/
│   ├── index.js          — Dashboard principal (React)
│   └── api/
│       ├── qb/
│       │   ├── connect.js  — Inicia OAuth QB
│       │   ├── callback.js — Maneja redirect OAuth
│       │   ├── sync.js     — Sincroniza transacciones
│       │   └── status.js   — Estado de conexiones
│       └── analyze.js      — Análisis con Claude AI
└── .env.local            — Variables de entorno (NO subir a git)
```

---

## Preguntas frecuentes

**¿Cuánto cuesta?**
- Vercel: $0 (plan gratuito)
- QuickBooks Developer App: $0
- Anthropic API: ~$2-5/mes con uso normal (mucho menos que $200 del bookkeeper)

**¿Es seguro guardar los tokens de QB?**
En desarrollo se guardan en `.tokens.json` (archivo local). En producción usar Vercel KV (ver comentarios en `lib/tokenStore.js`). Los tokens nunca salen de tu servidor.

**¿Qué pasa si expira el token de QB?**
El sistema refresca los tokens automáticamente. Solo necesitas reconectar una vez cada 6 meses.

**¿Puedo conectar QuickBooks de todas las empresas con la misma app?**
Sí. Una sola app de QB Developer puede conectarse a múltiples empresas/cuentas.

---

## Soporte

El sistema fue configurado específicamente para:
- Real Legacy LLC (JP Legacy Group)
- JP Legacy Media and Consulting LLC  
- VAU Nutrition LLC
- Paola Alexandra Diaz Lozada PA
- Reborn Houses LLC
- JP Legacy Homes LLC
- Jorge Manuel Florez Gutierrez LLC
