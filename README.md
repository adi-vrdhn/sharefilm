# Film Share

Full-stack app for sharing movie recommendations with friends.

## Tech Stack
- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Supabase)
- **Auth**: JWT with HTTP-only cookies
- **API**: TMDB for movie search

## Local Development

### Server
```bash
cd server
npm install
cp .env.example .env
# Fill in .env values
npm run dev
```

### Client
```bash
cd client
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

### Server
- `DATABASE_URL` - Supabase Postgres connection string
- `JWT_SECRET` - Random secret for JWT
- `TMDB_API_KEY` - TMDB API key
- `CLIENT_ORIGIN` - Frontend URL
- `NODE_ENV` - production/development

### Client
- `VITE_API_URL` - Backend API URL
