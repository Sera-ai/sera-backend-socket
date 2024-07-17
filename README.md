# Sera Backend Socket

This repository contains a Node.js server built with Fastify for HTTP/HTTPS endpoints and WebSocket support.

## Overview

This project provides a robust and scalable server setup using Fastify and WebSocket. It includes configuration for both HTTP endpoints and WebSocket events, making it suitable for real-time applications.

## Table of Contents

- [Overview](#overview)
- [Table of Contents](#table-of-contents)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Using Docker](#using-docker)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

- Fast and lightweight HTTP server using Fastify
- WebSocket server for real-time communication
- Easy configuration with environment variables
- Docker support for containerized deployment
- Nodemon for development with hot reloading

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 14.x or later)
- [npm](https://www.npmjs.com/) (version 6.x or later)
- [Docker](https://www.docker.com/) (optional, for containerized deployment)

### Setup

To get started, clone the repository and install the dependencies:

```bash
git clone https://github.com/Sera-ai/sera-backend-socket.git
cd sera-backend-socket
npm install
```
### Using Docker

To build and run the server using Docker, follow these steps:

1.  Build the Docker image:
    ```bash
    docker build -t sera-backend-socket .
    ``` 
2.  Run the Docker container:
    ```bash    
    docker run -d -p 3000:3000 -p 8080:8080 sera-backend-socket
    ``` 

## Project Structure

    sera-backend-socket/
    ├── .github/
    │   └── workflows/
    │       └── docker-build.yml
    ├── src/
    │   ├── handlers/
    │   │   ├── mongoHandler.js
    │   │   └── socketHandler.js
    │   └── socket/
    │       ├── socket.edge.js
    │       └── socket.node.js
    ├── .gitignore
    ├── Dockerfile
    ├── index.js
    ├── nodemon.json
    ├── package-lock.json
    ├── package.json
    └── README.md
