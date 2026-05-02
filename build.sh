#!/bin/bash

set -e

echo "Starting build process..."

echo "Installing server dependencies..."
npm install

echo "Changing directory to /client..."
cd client

echo "Installing client dependencies..."
npm install

echo "Building the React app for production..."
npm run build

echo "Build process completed successfully!"