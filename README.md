# Persons Management (Express + SQL Server)

A small web app for keeping a list of persons (for example gym members). The
back end is an Express REST API that stores data in SQL Server; the front end
is a single Bootstrap page served from `public/`.

## Features

* List, add, edit and delete persons from the browser
* REST API under `/api/persons` with input validation (required fields,
  `M`/`F` gender, `YYYY-MM-DD` dates, email format) and proper status codes
* SQL Server storage with a connection pool and parameterized queries
* Runs without a database: if no database is configured or it can't be
  reached at startup, an in-memory store is used instead
* Database credentials come only from environment variables, never the code
* Automated API tests using Node's built-in test runner

## Project structure

```
├── server.js          # entry point: picks a store and starts the server
├── src/
│   ├── app.js         # Express routes and validation
│   └── stores.js      # SQL Server and in-memory storage
├── public/
│   ├── index.html     # the web page
│   └── script.js      # front-end logic
├── test/
│   └── api.test.js    # API tests
├── schema.sql         # CREATE TABLE for the Persons table
└── .env.example       # template for your local settings
```

## Getting started

Requires Node.js 18 or newer.

```bash
npm install
cp .env.example .env    # on Windows: copy .env.example .env
npm start
```

Open http://localhost:3000/ in your browser.

With the `DB_` settings in `.env` left empty the app uses the in-memory store,
which is handy for trying it out; the data is gone when the server stops.

### Using SQL Server

1. Create the table by running `schema.sql` against your database.
2. Fill in `DB_USER`, `DB_PASS`, `DB_SERVER`, `DB_PORT` and `DB_NAME` in `.env`.
   Set `DB_TRUST_SERVER_CERTIFICATE=true` only for a local server with a
   self-signed certificate.
3. Run `npm start`; the console says `Connected to SQL Server`.

`.env` is listed in `.gitignore`, so your password stays on your machine.

## API

| Method | URL                  | Body          | Response                     |
|--------|----------------------|---------------|------------------------------|
| GET    | `/api/persons`       |               | `200` list of persons        |
| GET    | `/api/persons/:id`   |               | `200` person, `404`          |
| POST   | `/api/persons`       | person (JSON) | `201` created person, `400`  |
| PUT    | `/api/persons/:id`   | person (JSON) | `200` updated person, `400`, `404` |
| DELETE | `/api/persons/:id`   |               | `204`, `404`                 |

A person has the fields `firstname`, `lastname`, `birthdate`, `gender`,
`firstRegistration`, `celular`, `email` and `phone`, all required.

## Running the tests

```bash
npm test
```

## Credits

Designed and built by Orges Gurakuqi: the Express API, the SQL Server
integration and the web interface.

I used an AI coding assistant (Claude) to review and polish the project. It
helped me move the database credentials out of the code, add input
validation, protect the page against HTML injection, split the server into
smaller modules and write the tests.

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for
details.
