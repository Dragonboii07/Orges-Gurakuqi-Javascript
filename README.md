# Persons Management App

This is a minimal Express + SQL Server application for maintaining a list of persons. The repository includes a simple front-end served from the `public` folder.

## Features

- List persons from a SQL Server database
- Add, edit and delete records
- Connection pooling and parameterized queries
- CORS enabled for local development

## Quick start

```bash
# install dependencies
npm install

# configure environment variables (optional)
# create a .env file with DB_USER, DB_PASS, DB_SERVER, DB_PORT, DB_NAME

# start the server
npm start
```

Visit http://localhost:3000/ in your browser to open the UI.

## GitHub

This project is ready to be committed to a GitHub repository. The `.gitignore` file excludes `node_modules` and environment files. Add a remote and push:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-url>
git push -u origin main
```
