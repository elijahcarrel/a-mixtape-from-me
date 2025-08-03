# a-mixtape-from-me

[![Build Status](https://img.shields.io/github/actions/workflow/status/elijahcarrel/a-mixtape-from-me/ci.yml?branch=main&label=build)](https://github.com/elijahcarrel/a-mixtape-from-me/actions)
[![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?logo=vercel)](https://amixtapefrom.me)
[![License](https://img.shields.io/github/license/elijahcarrel/a-mixtape-from-me)](./LICENSE)
[![Issues](https://img.shields.io/github/issues/elijahcarrel/a-mixtape-from-me)](https://github.com/elijahcarrel/a-mixtape-from-me/issues)

---

## What is "A Mixtape From Me"?

**A Mixtape From Me** is a web app for making and sharing digital mixtapes with your own personal notes—just like the mixtapes we used to make for friends and loved ones. Add tracks, write your thoughts and feelings for each song, and share a unique, heartfelt playlist. No ads, no fees, just pure nostalgia and connection.

- **Create and curate mixtapes** for anyone, with your own commentary and stories.
- **Share easily** with a simple link.
- **Completely free, ad-free, and open source.**

Live at: [https://amixtapefrom.me](https://amixtapefrom.me)

---

## Technologies Used

### Frontend
- **Next.js 14** (React, TypeScript, SSR)
- **Tailwind CSS** for styling (with SCSS modules when needed)
- **Stack Auth** for authentication
- **Spotify API** for track search and metadata
- **Auto-generated TypeScript types** from OpenAPI spec

### Backend
- **FastAPI** (Python 3.12+) with Pydantic V2
- **PostgreSQL** (via [Neon](https://neon.tech/) for cloud DB)
- **SQLModel** for database models and auto-generated schema
- **Auto-generated OpenAPI spec** from FastAPI

### DevOps & Hosting
- **Vercel** for frontend and serverless backend deployment
- **GitHub Actions** for CI/CD (build, lint, test)
- **Auto-generation workflow** for types, schemas, and API specs

---

## Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/elijahcarrel/a-mixtape-from-me.git
cd a-mixtape-from-me
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://... (from Neon)

# Spotify API
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Next.js
NEXT_PUBLIC_VERCEL_URL=http://localhost:3000
DEFAULT_NEXT_URI=/create

# Stack Auth
NEXT_PUBLIC_STACK_PROJECT_ID=your_stack_project_id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_stack_publishable_client_key
STACK_PROJECT_ID=your_stack_project_id
STACK_PUBLISHABLE_CLIENT_KEY=your_stack_publishable_client_key
STACK_SECRET_SERVER_KEY=your_stack_secret_server_key
```

> **Note:** Never commit your actual secret values. See `.env.example` for a template.

### 3. Install Dependencies

#### Frontend & Backend (Node.js, Python)

```bash
# Node dependencies
npm install

# Python dependencies (in a virtual environment)
python3 -m venv venv
source venv/bin/activate
pip3 install -r requirements.txt
```

### 4. Running the App Locally

#### Option 1: Run Both Frontend & Backend Together

```bash
# (Recommended) Start your Python virtual environment first
source venv/bin/activate
npm run dev
```
- This will start both the Next.js frontend and the FastAPI backend (on port 8000).

#### Option 2: Run Backend Manually

```bash
source venv/bin/activate
pip3 install -r requirements.txt
python3 -m uvicorn api.main:app --reload
```
- Then, in another terminal, run the frontend:

```bash
npm run dev
```

### 5. Open the App

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Development Workflow

### Auto-Generation System
This project uses an auto-generation system to maintain type safety across the full stack:

```bash
# Generate all artifacts (database schema, OpenAPI spec, TypeScript types)
npm run gen-all

# Individual generation commands
npm run gen-db-schema-from-sqlmodels    # SQLModel → Database schema
npm run gen-openapi-from-fastapi        # FastAPI → OpenAPI spec
npm run gen-ts-from-openapi             # OpenAPI → TypeScript types
```

### Code Generation Workflow
1. Update SQLModel models in `backend/db_models.py`
2. Update FastAPI routers and Pydantic models
3. Run `npm run gen-all` to regenerate all artifacts
4. Commit generated files (`schema.gen.sql`, `openapi.gen.json`, `app/client/`)

## Testing

- **Backend:** Uses `pytest` with dependency overrides for external services (see `backend/tests/`)
- **Frontend:** Uses `Jest` and `React Testing Library` (see `app/components/__tests__/`)

To run all tests:

```bash
# Backend
pytest backend/tests/

# Frontend
npm test
```

---

## Contributing

Contributions are welcome! Please:
- Fork the repo and create a feature branch.
- Submit PRs against `main`.
- Ensure your code passes linting and tests (CI will check automatically).
- Follow the project's coding conventions (see `.cursor/rules/` for detailed guidelines).
- Run `npm run gen-all` after making backend changes to regenerate artifacts.
- Be kind and constructive in code reviews.

---

## License

[AGPL3](./LICENSE)

---

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Spotify for Developers](https://developer.spotify.com/)
- [Neon](https://neon.tech/)
- [Stack Auth](https://www.stack-auth.com/)

---

> _"A mixtape is a love letter in song form. This app brings that magic to the digital age."_
