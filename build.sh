#!/bin/bash

set -e

echo "Starting build process..."

echo "Installing server dependencies..."
npm install

echo "Changing directory to /client..."
cd client

echo "Installing client dependencies..."
# --include=dev is required, not optional: the host sets NODE_ENV=production
# (needed at runtime so server.js serves the built client), and npm reads that
# as omit=dev. tailwind.config.js require()s @tailwindcss/typography, which is
# a devDependency, so a production-only install fails the build.
npm install --include=dev

echo "Building the React app for production..."
npm run build

echo "Build process completed successfully!"