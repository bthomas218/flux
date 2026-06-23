# Task Master

An asynchronus media processing API built with Node.js, Fastify, and PostgreSQL.

---

## Features

Resize and Transcode Images

Get webhook upon completion

Magic Links

PostgreSQL database persistence

Input validation and error handling

Modern ES2022+ syntax with async/await and modular design

---

## Tech Stack

- Node.js
- JavaScript (ES2022+)
- Fastify
- PostgreSQL
- Redis
- BullMQ
- Prisma

---

## Installation

### Running on your machine

Installing files and dependencies

```bash
git clone https://github.com/bthomas218/flux
cd Task-Master
npm i
```

Next you will need a .env file with the keys

- `JWT_SECRET`: your jwt secret
- `DATABASE_URL`: connection string to a postgres database
- `ENCRPYTION_KEY`: for encrypting the webhook secrets
- `TOKEN_HASH_SECRET`: for hashing tokens
- `JWT_SECRET`: for signing and validating jwts

To set up the database

```bash
npm run migrate
```

To run the program

```bash
npm run dev
```

In another terminal

```bash
npm run dev:worker
```

Now you can hit the endpoints with your favorite http client

## ▶️ Usage

The API routes are mounted at the server root (there is no `/api` prefix).

### Health

- `GET /health` - Check the API and PostgreSQL connection.

### Authentication

- `POST /auth/magic-link` - Create a magic link.
  - JSON body: `email` (valid email address, required).
- `GET /auth/callback?token=<token>` - Exchange a magic-link token for a JWT.

Send the JWT as `Authorization: Bearer <token>` when calling the API key and
webhook endpoints.

### API keys

- `POST /api-keys` - Create an API key. JSON body: `name` (1–100 characters).
  The full key is returned only when it is created.
- `GET /api-keys` - List API keys.
- `GET /api-keys/:id` - Get an API key's metadata.
- `PATCH /api-keys/:id` - Rename an API key. JSON body: `name` (1–100
  characters).
- `DELETE /api-keys/:id` - Revoke an API key.

### Webhooks

- `POST /webhooks` - Create a webhook endpoint. JSON body: `url` (valid URL).
  The signing secret is returned only when the endpoint is created.
- `GET /webhooks` - List webhook endpoints.
- `GET /webhooks/:id` - Get a webhook endpoint.
- `PATCH /webhooks/:id` - Update a webhook endpoint. JSON body: `url` (valid
  URL).
- `DELETE /webhooks/:id` - Delete a webhook endpoint.

### Files

Send the API key as `X-API-Key: <key>` when calling file and job endpoints.

- `POST /files` - Upload one file as `multipart/form-data`.
- `GET /files` - List uploaded files.
- `GET /files/:id` - Get file metadata.
- `GET /files/:id/download` - Download a file.
- `DELETE /files/:id` - Delete a file.

### Jobs

- `POST /jobs` - Create an image-processing job. The JSON body must contain
  `type`, `fileId`, `webHookEndpointId`, and the corresponding `options`:
  - `image.resize`: optional `width`, `height`, and `fit` (`cover`, `contain`,
    `fill`, `inside`, or `outside`).
  - `image.transcode`: required `format` (`jpeg`, `png`, `webp`, or `avif`) and
    optional `quality`.
  - `image.alttext`: no options are required.
- `GET /jobs` - List jobs.
- `GET /jobs/:id` - Get a job.
