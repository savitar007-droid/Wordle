🧠 Wordle – Enhanced Backend Edition












A production-ready Wordle-inspired web application built with Spring Boot, PostgreSQL (Neon Cloud), and Docker, deployed on Render.

This is not just a clone — it extends the original Wordle with additional game modes and a fully backend-driven architecture.

🚀 Live Demo

🔗 Live Application:
https://wordle-db-n9b5.onrender.com/

💻 GitHub Repository:
https://github.com/savitar007-droid/Wordle

⚠️ Note: The app is deployed on Render’s free tier and may take 1–2 minutes to wake up after inactivity (cold start).

🎮 Game Modes

Unlike the original Wordle, this version includes:

🎯 Normal Mode – Classic daily challenge
⏱ 60 Seconds Mode – Solve within 60 seconds
💀 Sudden Death Mode – One wrong guess ends the game

All logic is enforced at the backend level to prevent manipulation.

🏗 System Architecture

RESTful API architecture

Spring Boot backend

PostgreSQL database (Neon Cloud)

Secure authentication & session management

Persistent leaderboard & player statistics

Server-side validation

Docker containerization

Cloud deployment on Render

🛠 Tech Stack
Backend

Java 17

Spring Boot

REST APIs

Database

PostgreSQL

Neon (Serverless Cloud PostgreSQL)

Frontend

HTML

CSS

JavaScript

DevOps & Deployment

Docker

Git & GitHub

Render (Cloud Hosting)

☁️ Cloud & Infrastructure Learnings

This project provided hands-on experience with real-world deployment challenges:

🔹 Cold Starts (Render Free Tier)

The application goes to sleep after inactivity and takes 1–2 minutes to wake up — helping me understand infrastructure trade-offs in serverless hosting.

📊 Core Features

Daily word enforcement (backend controlled)

Multiple gameplay modes

Secure login system

Leaderboard with persistent statistics

Database-driven word tracking

Responsive UI

Dockerized production build

🧩 Running Locally
1️⃣ Clone Repository
git clone https://github.com/savitar007-droid/Wordle.git
cd Wordle
2️⃣ Configure Environment Variables

Set the following:

DATABASE_URL=your_neon_database_url
SPRING_DATASOURCE_USERNAME=your_username
SPRING_DATASOURCE_PASSWORD=your_password
3️⃣ Run Application

Using Maven:

./mvnw spring-boot:run

Or via Docker:

docker build -t wordle-app .
docker run -p 8080:8080 wordle-app
📈 What This Project Demonstrates

This project reflects:

Backend system design

API architecture

Database modeling

Cloud deployment strategy

Containerization

Production debugging

Infrastructure cost awareness

It represents the transition from:

“I can build features”

to

“I can architect, deploy, and maintain backend systems.”

🔮 Future Improvements

Caching layer for faster response time

Redis integration

CI/CD pipeline

Analytics dashboard

Performance optimization for cold starts

👨‍💻 Author

Aditya Agrawal
B-Tech IT | Backend & Full-Stack Developer
