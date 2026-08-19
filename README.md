# Docker Learning with React.js + Vite

এই README-তে React + Vite অ্যাপকে Docker দিয়ে কীভাবে build, run, এবং development mode-এ চালাতে হয় তা step-by-step দেখানো হয়েছে।

---

## Table of Contents

1. [React + Vite Application তৈরি](#1-react--vite-application-তৈরি)
2. [Project Structure](#2-project-structure)
3. [Dockerfile তৈরি](#3-dockerfile-তৈরি)
4. [Docker Image Build](#4-docker-image-build)
5. [Docker Image Check](#5-docker-image-check)
6. [প্রথমবার Container Run](#6-প্রথমবার-container-run)
7. [Container Check](#7-container-check)
8. [Container Stop](#8-container-stop)
9. [Container Remove](#9-container-remove)
10. [Code Change করলে Image Update](#10-code-change-করলে-image-update)
11. [Development-এর Problem](#11-development-এর-problem)
12. [Bind Mount কী](#12-bind-mount-কী)
13. [Bind Mount + Volume দিয়ে React Run](#13-bind-mount--volume-দিয়ে-react-run)
14. [Development Workflow](#14-development-workflow)
15. [Recommended Command](#15-recommended-command)
16. [দুইটা Approach মনে রাখবে](#16-দুইটা-approach-মনে-রাখবে)
17. [Important Commands Cheatsheet](#17-important-commands-cheatsheet)
18. [Node.js বনাম React Docker Practice](#18-nodejs-বনাম-react-docker-practice)
19. [Next Step](#19-next-step)
20. [Prerequisites Checklist](#20-prerequisites-checklist)
21. [Common Errors and Fix](#21-common-errors-and-fix)
22. [.dockerignore (Recommended)](#22-dockerignore-recommended)
23. [Optional: Docker Compose for Dev](#23-optional-docker-compose-for-dev)
24. [Quick Reset Commands](#24-quick-reset-commands)

---

## 1. React + Vite Application তৈরি

প্রথমে Vite দিয়ে React project তৈরি করো:

~~~bash
npm create vite@latest react-docker
~~~

তারপর project folder-এ গিয়ে dependencies install করো:

~~~bash
cd react-docker
npm install
~~~

লোকালি project run করে check করো:

~~~bash
npm run dev
~~~

সাধারণত Vite server চলবে:

~~~text
http://localhost:5173
~~~

---

## 2. Project Structure

~~~text
react-docker/
|
|-- node_modules/
|-- public/
|-- src/
|   |-- App.jsx
|   |-- main.jsx
|   |-- ...
|
|-- index.html
|-- package.json
|-- package-lock.json
|-- Dockerfile
~~~

---

## 3. Dockerfile তৈরি

Project root-এ Dockerfile তৈরি করো:

~~~dockerfile
FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
~~~

### এখানে কী হচ্ছে

| Dockerfile Instruction | কাজ |
|---|---|
| FROM node:20 | Node.js 20 image ব্যবহার |
| WORKDIR /app | Container-এর working directory set করে |
| COPY package*.json ./ | Package files copy করে |
| RUN npm install | Dependencies install করে |
| COPY . . | Source code copy করে |
| EXPOSE 5173 | Vite dev server port expose করে |
| --host 0.0.0.0 | Container-এর বাইরে থেকে access allow করে |

Note:
Docker environment-এ --host 0.0.0.0 খুব গুরুত্বপূর্ণ।
শুধু npm run dev দিলে server internal localhost-এ bind হতে পারে, তখন browser থেকে access করা যায় না।

---

## 4. Docker Image Build

~~~bash
docker build -t react_i .
~~~

| Part | অর্থ |
|---|---|
| docker build | Image তৈরি করবে |
| -t react_i | Image-এর নাম react_i |
| . | Current directory থেকে Dockerfile ও project files নেবে |

---

## 5. Docker Image Check

~~~bash
docker images
# অথবা
docker image ls
~~~

Sample output:

~~~text
REPOSITORY   TAG       IMAGE ID
react_i      latest    xxxxx
~~~

---

## 6. প্রথমবার Container Run

~~~bash
docker run -p 5173:5173 --name react-c react_i
~~~

এখানে port mapping:

~~~text
Host Port : Container Port
   5173   :      5173
~~~

তারপর browser-এ open করো:

~~~text
http://localhost:5173
~~~

---

## 7. Container Check

~~~bash
docker ps      # Running containers
docker ps -a   # সব containers
~~~

---

## 8. Container Stop

~~~bash
docker stop react-c
~~~

---

## 9. Container Remove

~~~bash
docker rm react-c
~~~

---

## 10. Code Change করলে Image Update

যদি src/App.jsx-এ পরিবর্তন করো, image-based workflow-এ rebuild লাগবে:

~~~bash
# Step 1
docker stop react-c

# Step 2
docker rm react-c

# Step 3
docker build -t react_i .

# Step 4
docker run -p 5173:5173 --name react-c react_i
~~~

---

## 11. Development-এর Problem

প্রতিবার code change-এর পরে:

~~~text
App.jsx change -> docker stop -> docker rm -> docker build -> docker run
~~~

এই flow development-এর জন্য inconvenient।
এটা solve করতে Bind Mount + Volume use করা হয়।

---

## 12. Bind Mount কী

Bind Mount করলে host machine-এর project folder container-এর /app-এর সাথে connect হয়।

~~~text
Windows Project
	|
	| Bind Mount
	v
Container /app
	|
	v
React/Vite
~~~

তাই host-এর src/App.jsx change করলে container-এর ফাইলও সাথে সাথে update হয়।

---

## 13. Bind Mount + Volume দিয়ে React Run

Windows PowerShell command:

~~~powershell
docker run -p 5173:5173 --name react-c -v "${PWD}:/app" -v /app/node_modules --rm react_i
~~~

### তিনটি গুরুত্বপূর্ণ অংশ

1. -p 5173:5173
Port mapping।

2. -v "${PWD}:/app"
এটা Bind Mount।

- ${PWD} = তোমার current project path
- /app = container path

3. -v /app/node_modules
Container-এর node_modules আলাদা volume হিসেবে রাখে, যাতে host আর container dependency conflict না হয়।

4. --rm
Container stop করলে auto remove হয়ে যায়।

---

## 14. Development Workflow

~~~mermaid
flowchart TD
    A[Host: src/App.jsx edit] --> B[Bind Mount sync to Container /app]
    B --> C[Vite detects change]
    C --> D[HMR trigger]
    D --> E[Browser auto update]
~~~

অর্থাৎ development mode-এ প্রতিবার rebuild/run করা লাগে না।

---

## 15. Recommended Command

Development-এর জন্য recommended:

~~~bash
docker run -p 5173:5173 --name react-c -v "${PWD}:/app" -v /app/node_modules --rm react_i
~~~

তারপর src/App.jsx modify করে browser-এ live change দেখো।

---

## 16. দুইটা Approach মনে রাখবে

### Approach 1: Normal Docker Container

~~~bash
docker build -t react_i .
docker run -p 5173:5173 --name react-c react_i
~~~

Code change করলে:

~~~bash
docker stop react-c
docker rm react-c
docker build -t react_i .
docker run -p 5173:5173 --name react-c react_i
~~~

Best for image-based workflow শেখার জন্য।

### Approach 2: Development + Bind Mount

~~~bash
docker run -p 5173:5173 --name react-c -v "${PWD}:/app" -v /app/node_modules --rm react_i
~~~

Code change flow:

~~~text
App.jsx change -> Bind Mount -> Container file update -> Vite HMR -> Browser update
~~~

Best for daily development।

---

## 17. Important Commands Cheatsheet

| কাজ | Command |
|---|---|
| Build | docker build -t react_i . |
| Build with version | docker build -t react_i:v1 . |
| List images | docker images |
| Run | docker run -p 5173:5173 react_i |
| Run with name | docker run -p 5173:5173 --name react-c react_i |
| Stop | docker stop react-c |
| Remove | docker rm react-c |
| Running containers | docker ps |
| All containers | docker ps -a |
| Auto remove on stop | docker run -p 5173:5173 --name react-c --rm react_i |
| Dev (Bind Mount + Volume) | docker run -p 5173:5173 --name react-c -v "${PWD}:/app" -v /app/node_modules --rm react_i |

---

## 18. Node.js বনাম React Docker Practice

| বিষয় | Node.js | React + Vite |
|---|---|---|
| App runtime | Node server | Vite dev server |
| Common port | 3000 | 5173 |
| Change detection | Nodemon | Vite HMR |
| Dev mounting style | Volume/Bind Mount | Bind Mount + node_modules volume |
| Build/Run concept | Same Docker basics | Same Docker basics |

---

## 19. Next Step

এখন তুমি চাইলে next level-এ যেতে পারো:

1. docker-compose দিয়ে multi-service setup
2. React production build serve করা (Nginx দিয়ে)
3. .dockerignore optimize করা
4. Development এবং Production-এর জন্য আলাদা Dockerfile রাখা

Happy Docker Learning.

---

## 20. Prerequisites Checklist

শুরু করার আগে এগুলো check করো:

1. Docker Desktop running আছে
2. WSL2 backend enabled আছে (Windows হলে)
3. `docker --version` এবং `docker compose version` কাজ করছে
4. Project root-এ Dockerfile আছে
5. Port `5173` free আছে

Quick check command:

~~~powershell
docker --version
docker compose version
docker ps
~~~

---

## 21. Common Errors and Fix

### 1) Container name already in use

Error idea:

~~~text
Conflict. The container name "react-c" is already in use
~~~

Fix:

~~~bash
docker stop react-c
docker rm react-c
~~~

### 2) Port 5173 already allocated

Fix option 1: অন্য host port use করো

~~~bash
docker run -p 5174:5173 --name react-c react_i
~~~

Fix option 2: যে process/container port use করছে সেটা stop করো

~~~bash
docker ps
~~~

### 3) Code change browser-এ reflect হচ্ছে না

Check list:

1. Bind mount command use করছো কি না
2. Container logs-এ Vite running আছে কি না
3. `--host 0.0.0.0` আছে কি না

Logs check:

~~~bash
docker logs react-c
~~~

### 4) node_modules issue with bind mount

Fix:

~~~bash
docker run -p 5173:5173 --name react-c -v "${PWD}:/app" -v /app/node_modules --rm react_i
~~~

---

## 22. .dockerignore (Recommended)

Image build faster করতে এবং unnecessary file copy বন্ধ করতে `.dockerignore` ব্যবহার করো:

~~~dockerignore
node_modules
dist
.git
.github
README.md
.vscode
npm-debug.log*
~~~

Note:
`.dockerignore` এ Dockerfile include করো না, তাহলে image build fail করতে পারে।

---

## 23. Optional: Docker Compose for Dev

বারবার long command না লিখে compose use করতে পারো।

Example `compose.yaml`:

~~~yaml
services:
	react-app:
		build: .
		container_name: react-c
		ports:
			- "5173:5173"
		volumes:
			- .:/app
			- /app/node_modules
		command: npm run dev -- --host 0.0.0.0
		stdin_open: true
		tty: true
~~~

Run command:

~~~bash
docker compose up --build
~~~

Stop command:

~~~bash
docker compose down
~~~

---

## 24. Quick Reset Commands

Practice environment clean reset করার জন্য:

~~~bash
docker stop react-c
docker rm react-c
docker rmi react_i
docker build -t react_i .
docker run -p 5173:5173 --name react-c react_i
~~~

যদি remove করার সময় error আসে, ignore করে next command চালাতে পারো অথবা আগে list check করো:

~~~bash
docker ps -a
docker images
~~~
