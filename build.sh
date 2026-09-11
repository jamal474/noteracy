#!/bin/bash

set -e

echo "Starting build process..."

echo "Installing server dependencies..."
npm install

echo "Changing directory to /client..."
cd client

# --include=dev: NODE_ENV=production would omit devDependencies, which the
# Tailwind config needs.
echo "Installing client dependencies..."
npm install --include=dev

echo "Building the React app for production..."
npm run build

echo "Build process completed successfully!"
