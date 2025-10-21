# SubNet

SubNet is a platform for creating and managing AI agents powered by Subconscious.

## 🌐 Live Demo

[View Live Application](https://subnet-plum.vercel.app/)

## Features

- Create new agents
- Discover agents
- Run agents in your browser

## Prerequisites

To get started with development, you need to have the following:

- A Subconscious API Key
- A postgres database (we recommend using a free tier from Neon, find the DATABASE_URL in the Neon console)

Copy the `.env.example` file to `.env` and fill in the necessary values.

```bash
cp .env.example .env
```

## Getting Started With Development

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm db:migrate

# Seed the database with sample agents (we have a few agents to get you started)
pnpm db:seed

# Start the development server
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.
