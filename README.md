# 🪢 Tug of War — Multiplayer Quiz Game

A real-time multiplayer **Tug of War quiz game** where players compete by answering mathematics, logical-thinking, and riddle questions.

Players can create or join a game room using a unique room code, choose a difficulty level, select the number of rounds, and compete to achieve the highest score. Correct and fast answers help players pull their way toward victory.

> **Think Fast. Answer Right. Pull Hard.** 🧠💪🏆

---

## 🌐 Live Demo

The game is deployed and available online:

**Live Application:**
https://tug-of-war-production-0b19.up.railway.app/

---

## 📂 GitHub Repository

Source code:

https://github.com/Shrawan-071/-Tug-of-War-

---

## 🎮 About the Game

**Tug of War** combines a traditional tug-of-war competition with an educational multiplayer quiz.

Instead of physically pulling a rope, players compete by answering questions correctly and quickly.

The game includes questions from:

* ➕ Mathematics
* 🧠 Logical Thinking
* 🧩 Brain Teasers
* ❓ Riddles / Paheli

The player with the best performance and highest score wins the game.

---

## ✨ Features

### 🌐 Online Multiplayer

* Create multiplayer game rooms
* Join rooms using a unique room code
* Play with multiple players
* Real-time player interaction
* Multiplayer game lobby
* Player list and score tracking

### 🏠 Room System

Players can:

* Create a new room
* Receive a unique room code
* Share the room code with friends
* Join an existing room
* Wait for other players in the lobby
* Start the game together

### 🎯 Difficulty Levels

The game contains three difficulty levels.

#### 🟢 Easy

Questions suitable for students up to **Class 10**.

Topics may include:

* Basic arithmetic
* Percentages
* Fractions
* Ratio and proportion
* Basic algebra
* Geometry
* Number patterns
* Simple logical reasoning
* Easy riddles and Paheli

#### 🟡 Medium

Questions suitable for students up to **Class 12**.

Topics may include:

* Advanced algebra
* Trigonometry
* Probability
* Permutation and combination
* Coordinate geometry
* Sequences and series
* Logical reasoning
* Mathematical puzzles
* Brain teasers

#### 🔴 Hard

Questions suitable for **Bachelor-level students**.

Topics may include:

* Calculus
* Discrete mathematics
* Probability and statistics
* Advanced mathematics
* Complex logical reasoning
* Algorithmic thinking
* Advanced mathematical puzzles
* Difficult riddles and Paheli

---

## 🔢 Question Categories

The game includes questions from different categories:

### Mathematics

Questions involving calculations, formulas, patterns, and mathematical problem-solving.

### Logical Thinking

Questions designed to test reasoning, deduction, sequences, and pattern recognition.

### Brain Teasers

Challenging questions that require creative and analytical thinking.

### Paheli / Riddles

Fun riddles and puzzle-based questions that test the player's ability to think differently.

---

## 🕹️ How to Play

### 1. Open the Game

Visit the live application.

### 2. Create or Join a Room

One player creates a game room and receives a unique room code.

Other players enter the same room code to join the game.

### 3. Configure the Game

Choose:

* Difficulty level
* Number of rounds
* Available game settings

### 4. Start the Game

Once the players are ready, start the game.

### 5. Answer Questions

Each round displays a question with multiple answer options.

Choose the correct answer as quickly as possible.

### 6. Earn Points

Players earn points based on their performance.

Correct and faster answers can provide a better score.

### 7. Compete

Continue answering questions throughout all selected rounds.

### 8. View the Winner

After the final round, the scores are compared and the winner is displayed.

---

## 🏆 Scoring

The game rewards:

* ✅ Correct answers
* ⚡ Fast responses
* 🧠 Strong overall performance

Wrong or unanswered questions do not provide the same advantage as correct answers.

The final leaderboard displays player scores and determines the winner.

---

## 🛠️ Tech Stack

### Frontend

* React
* TypeScript
* Vite
* HTML
* CSS

### Backend

* Node.js
* TypeScript

### AI Integration

* Google Gemini API

### Deployment

* Railway

### Version Control

* Git
* GitHub

---

## 📁 Project Structure

```text
-Tug-of-War-/
│
├── assets/
│   └── .aistudio/
│
├── src/
│   └── Application source files
│
├── .env.example
├── .gitignore
├── index.html
├── metadata.json
├── package.json
├── package-lock.json
├── server.ts
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## ⚙️ Installation and Local Setup

Follow these steps to run the project locally.

### Prerequisites

Make sure you have installed:

* Node.js
* npm
* Git

Check your installations:

```bash
node --version
npm --version
git --version
```

---

## 1. Clone the Repository

```bash
git clone https://github.com/Shrawan-071/-Tug-of-War-.git
```

Move into the project folder:

```bash
cd -Tug-of-War-
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create a `.env.local` file in the root directory.

Add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Replace:

```text
your_gemini_api_key_here
```

with your actual API key.

### Important Security Warning

Never upload your real API key to GitHub.

Make sure environment files containing real secrets are included in `.gitignore`.

Do not write API keys directly inside frontend source code.

---

## 4. Start the Development Server

Run:

```bash
npm run dev
```

The terminal will display the local development address.

Open that address in your browser.

---

## 📜 Available Scripts

Depending on the scripts configured in `package.json`, the project can be run using commands such as:

```bash
npm run dev
```

Starts the application in development mode.

```bash
npm run build
```

Creates a production build.

```bash
npm start
```

Starts the production server if configured in the project.

For the exact available commands, check the `scripts` section of `package.json`.

---

## 🌍 Deployment

The application is currently deployed using **Railway**.

### Railway Deployment Overview

1. Push the project to GitHub.
2. Connect the GitHub repository to Railway.
3. Create a Railway project.
4. Select the GitHub repository.
5. Configure the required environment variables.
6. Build and deploy the application.
7. Generate a public domain.

### Required Environment Variable

Add the following environment variable in the Railway project settings:

```env
GEMINI_API_KEY=your_actual_gemini_api_key
```

Never expose the real API key in the repository.

---

## 🔄 Updating the Deployed Application

After making changes locally:

```bash
git add .
```

```bash
git commit -m "Update Tug of War game"
```

```bash
git push origin main
```

If automatic deployment is enabled in Railway, Railway will automatically rebuild and redeploy the latest version.

---

## 🧪 Testing Multiplayer

To test the multiplayer functionality locally or online:

### Method 1: Two Browser Tabs

Open the game in two separate browser tabs.

### Method 2: Incognito Mode

Open:

* One normal browser window
* One incognito/private window

### Method 3: Different Browsers

For example:

* Google Chrome
* Microsoft Edge
* Firefox

### Method 4: Different Devices

Open the deployed application on:

* Laptop
* Mobile phone
* Another computer

Create a room on one device and join it using the room code from another device.

---

## 🔐 Security

The project should follow these security practices:

* Never commit API keys
* Store secrets in environment variables
* Validate user input
* Validate room codes
* Prevent duplicate answer submissions
* Keep sensitive logic on the server where possible
* Do not trust client-provided scores
* Keep dependencies updated

If an API key is accidentally pushed to GitHub, revoke it immediately and generate a new one.

---

## 🐛 Known Areas for Improvement

The project can continue to be improved with:

* Larger validated question database
* Better prevention of repeated questions
* Improved question and option validation
* More Nepali Paheli
* More mathematics questions
* More logical-thinking questions
* Player accounts
* Persistent game history
* Global leaderboard
* Team battle mode
* Spectator mode
* Player avatars
* Achievements
* Sound effects
* Background music
* Improved animations
* Better mobile optimization
* Reconnection support

---

## 🚀 Future Improvements

Possible future features include:

* 👥 Team vs Team mode
* 🌍 Global leaderboard
* 📊 Player statistics
* 🏅 Achievement system
* 🔥 Daily challenges
* 🎭 Custom avatars
* 💬 Emoji reactions
* 👀 Spectator mode
* 🔁 Rematch system
* 🇳🇵 Nepali language support
* 🤖 Improved AI-assisted question generation
* 📚 More question categories
* 🎵 Game sounds and music
* 📱 Progressive Web App support

---

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

To contribute:

1. Fork the repository.
2. Create a new branch.

```bash
git checkout -b feature/your-feature-name
```

3. Make your changes.
4. Commit the changes.

```bash
git commit -m "Add new feature"
```

5. Push the branch.

```bash
git push origin feature/your-feature-name
```

6. Open a Pull Request.

---

## 🐞 Reporting Issues

If you discover a bug or have a feature suggestion, create an issue in the GitHub repository.

When reporting a bug, include:

* Description of the problem
* Steps to reproduce it
* Expected behavior
* Actual behavior
* Browser or device used
* Screenshot if available

---

## 👨‍💻 Developer

**Shrawan Kumar Gupta**

BSc. CSIT Student interested in:

* Artificial Intelligence
* Full-Stack Development
* Web Development
* Software Development

GitHub:
https://github.com/Shrawan-071

---

## 📄 License

This project currently does not specify a license.

If you want others to freely use, modify, and distribute the project, consider adding an open-source license such as the **MIT License**.

---

## ⭐ Support

If you like this project, consider giving the repository a ⭐ on GitHub.

Feedback, suggestions, bug reports, and contributions are welcome.

---

## 🎯 Project Goal

The goal of **Tug of War** is to make learning and problem-solving more interactive, competitive, and enjoyable.

Instead of a traditional quiz experience, players compete with friends in a multiplayer environment where:

**Knowledge + Speed + Strategy = Victory**

🪢 **Think Fast. Answer Right. Pull Hard.** 🧠💪🏆
