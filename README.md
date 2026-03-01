# Persons Management App

This is a minimal Express + SQL Server application for maintaining a list of persons. The repository includes a simple front-end served from the `public` folder.

## Features

- List persons from a SQL Server database (falls back to in-memory store if the database is unreachable)
- Add, edit and delete records
- Connection pooling and parameterized queries
- CORS enabled for local development

## Quick start

```bash
# install dependencies
npm install

# set up configuration
cp .env.example .env           # copy the sample env file
# edit .env and fill real database credentials

# start the server
npm start
```

Visit http://localhost:3000/ in your browser to open the UI.

## GitHub

This project is ready to be pushed to a GitHub repository. The `.gitignore` file excludes `node_modules` and environment files.

```bash
git init
 git add .
 git commit -m "Initial commit"
 git remote add origin <your-github-url>
 git push -u origin main
```
