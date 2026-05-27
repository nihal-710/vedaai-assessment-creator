# VedaAI Assessment Creator

AI-powered question paper generator for teachers.
No Docker required — uses cloud-hosted free services.

## Services Used (all free, no credit card)
| Service       | Purpose       | Free Tier Link                          |
|---------------|---------------|-----------------------------------------|
| MongoDB Atlas | Database      | https://cloud.mongodb.com               |
| Upstash Redis | Queue broker  | https://console.upstash.com             |
| Google Gemini | AI model      | https://aistudio.google.com/app/apikey  |

## Setup (one time)

### 1. Get your credentials
- MongoDB Atlas  ? create free cluster ? copy connection string
- Upstash Redis  ? create free database ? copy ioredis URL
- Gemini API Key ? create free key ? copy it

### 2. Install dependencies
npm install

### 3. Configure backend
cd backend
copy .env.example .env
# Open .env and paste your MONGODB_URI, REDIS_URL, GEMINI_API_KEY

### 4. Configure frontend
cd ../frontend
copy .env.local.example .env.local
# No changes needed for local dev

### 5. Run
cd ..
npm run dev

## URLs
- Frontend : http://localhost:3000
- Backend  : http://localhost:5000
- Health   : http://localhost:5000/api/health

## Demo Mode
No API key yet? Set DEMO_MODE=true in backend/.env
The app will generate mock papers without any AI calls.

