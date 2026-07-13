# NullSpace AI Server

Servidor cloud y PWA multiplataforma para chat con IA, memoria, notas, tareas, dispositivos y un futuro agente de computadora.

## Qué sí hace

- Node.js + Express 5, REST y WebSocket.
- PostgreSQL compatible con Supabase, Railway Postgres o Render Postgres.
- Registro, login, JWT, bcrypt y sesiones por dispositivo.
- Conversaciones persistentes y ruta `POST /api/chat`.
- CRUD de memoria, notas y tareas.
- Dashboard real con métricas consultadas en PostgreSQL.
- Proveedor intercambiable: OpenAI o un Ollama remoto accesible por HTTPS.
- PWA instalable, caché del shell y página offline honesta.
- Cola segura para un agente de escritorio futuro. El servidor no afirma que una acción se ejecutó hasta recibir resultado del agente.

## Límites importantes

1. La nube funciona con la computadora apagada, pero no puede controlar una computadora apagada.
2. `pending_actions` es una cola. Debes desarrollar e instalar un agente local que consulte esa cola y reporte resultados.
3. Las tareas y `reminder_at` se guardan, pero para enviar recordatorios con la app cerrada necesitas un worker programado y Web Push/APNs/FCM. No se simula esa entrega.
4. El frontend no contiene claves secretas.

## Instalación local

```bash
cp .env.example .env
npm install
psql "$DATABASE_URL" -f database/schema.sql
npm run dev
```

Abre `http://localhost:3000`. Usa Node.js 20 o posterior. Genera `JWT_SECRET` con al menos 32 caracteres aleatorios.

## Supabase

1. Crea un proyecto y abre SQL Editor.
2. Ejecuta `database/schema.sql`.
3. Copia la cadena PostgreSQL de conexión en `DATABASE_URL`.
4. Este backend usa una conexión de servidor y aplica propiedad mediante `user_id` en cada consulta. No expongas `SUPABASE_SERVICE_ROLE_KEY` al navegador.

## OpenAI

Configura `AI_PROVIDER=openai`, `OPENAI_API_KEY` y `OPENAI_MODEL`. El código usa tool calling mediante el SDK oficial de Node.js y limita la ejecución a herramientas registradas en el servidor. Para Ollama remoto usa `AI_PROVIDER=ollama`, `OLLAMA_BASE_URL=https://...` y `OLLAMA_MODEL`. `localhost` en un hosting apunta al hosting, no a tu laptop.

## GitHub

```bash
git init
git add .
git commit -m "Initial NullSpace AI Server"
git branch -M main
git remote add origin TU_REPOSITORIO
git push -u origin main
```

Nunca subas `.env`.

## Railway

1. Crea un proyecto desde el repositorio de GitHub.
2. Añade PostgreSQL o usa Supabase externo.
3. Agrega las variables de `.env.example` en Variables.
4. Genera un dominio público en Settings > Networking.
5. Ejecuta el SQL una vez contra la base. Railway detectará `npm start` o el Dockerfile.

## Render

1. Conecta GitHub y crea un Blueprint usando `render.yaml`, o un Web Service Docker.
2. Define `DATABASE_URL`, `OPENAI_API_KEY`, `APP_URL` y `ALLOWED_ORIGINS`.
3. Ejecuta `database/schema.sql` en PostgreSQL/Supabase.
4. Usa `/api/health` como health check. Los planes gratuitos pueden suspenderse y no son apropiados para disponibilidad seria.

## Google Cloud Run

```bash
gcloud run deploy nullspace-ai-server --source . --region us-central1 --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,APP_URL=https://TU_URL,ALLOWED_ORIGINS=https://TU_URL \
  --set-secrets DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest
```

Cloud Run puede escalar a cero. Para WebSockets con actividad prolongada o recordatorios usa configuración de instancias mínimas y un servicio de colas/worker.

## Docker

```bash
docker build -t nullspace-ai-server .
docker run --env-file .env -p 3000:3000 nullspace-ai-server
```

## Instalar PWA

- Android/Chrome: menú del navegador > Instalar aplicación.
- iPhone/Safari: Compartir > Añadir a pantalla de inicio.
- Escritorio: icono Instalar de Chrome/Edge.

La instalación exige HTTPS fuera de localhost.

## API principal

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- `POST /api/chat`
- CRUD `/api/memory`, `/api/notes`, `/api/tasks`
- `GET /api/conversations`, `GET/DELETE /api/conversations/:id`
- `GET /api/devices`
- `/api/agent/connect`, `/status`, `/action`, `/pending-actions`
- `GET /api/admin/overview`, `GET /api/health`

Incluye `Authorization: Bearer TOKEN` en rutas protegidas. El agente usa `X-Device-Token`.

## Seguridad aplicada

Helmet/CSP, CORS restringido, rate limiting, límites de cuerpo, validación Zod, consultas parametrizadas, bcrypt, JWT con expiración, aislamiento por `user_id`, lista blanca de acciones y confirmación para acciones críticas. Para producción añade rotación/revocación de tokens, MFA, recuperación de contraseña por correo, cifrado de campos sensibles, gestión de secretos, backups, alertas, pruebas automatizadas y un WAF.

## Actualizaciones y registros

Haz push a `main` para activar despliegues automáticos cuando la plataforma esté conectada a GitHub. Consulta logs en Railway Deployments, Render Logs o Cloud Logging. Prueba primero `/api/health`, después la conexión PostgreSQL y finalmente la configuración del proveedor de IA.
