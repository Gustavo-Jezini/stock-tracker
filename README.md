# USA Stock Market

A project built to monitor the main assets of the U.S. stock market.  
It generates automated emails with the latest financial news provided by the [Finnhub.io](https://finnhub.io/) API.

The project integrates with [Inngest](https://www.inngest.com/) to handle automated workflows, such as generating and sending personalized emails powered by AI.

The combination of Finnhub + Inngest + Gemini results in a powerful tool for market news analysis and automated reporting.

---

## 🚀 Demo

### 🔐 Login Page
<img width="1724" height="967" alt="Login Page" src="https://github.com/user-attachments/assets/8b9e8e25-ba16-47dc-b1e3-29f46c59beda" />

### 📊 Main Dashboard
<img width="1397" height="1027" alt="Main Dashboard" src="https://github.com/user-attachments/assets/97a2fc19-49d1-42ca-863e-8885b37d421e" />

---

## 🛠 Tech Stack

- **Next.js** – Fullstack React framework with file-based routing and API routes
- **MongoDB + Mongoose** – Database and ODM
- **Better Auth** – Authentication (email/password)
- **Finnhub API** – Financial market news data
- **Inngest** – Background job orchestration and workflow automation
- **Gemini API** – AI-generated email content
- **Nodemailer** – Email delivery

### ⚙️ Inngest Handling Email Workflows
<img width="1387" height="575" alt="Inngest Workflow" src="https://github.com/user-attachments/assets/904baf25-158c-43b4-85fe-2091d2e6403b" />

### 📩 Email Example
<img width="476" height="716" alt="Email Example" src="https://github.com/user-attachments/assets/7af4c0b2-d9ab-45d2-962f-6156cf1555c0" />

Additional demo:
https://github.com/user-attachments/assets/bca4b2ca-57be-402b-819b-7e843a27970c

---

## 🏗 Architecture & Technical Decisions

### Why Next.js?

I chose **Next.js** because:

- It provides a clear file-based routing system.
- It supports both frontend and backend logic in the same project.
- It allows building API routes alongside UI pages.
- It simplifies project organization and scalability.

This approach enables a clean separation between UI components, API routes, and server-side logic.

### Architectural Approach

The project follows the default **Next.js App Router structure**, with a clear separation of responsibilities:

- UI pages inside `/app`
- API and workflow logic separated from presentation
- Database logic isolated in a dedicated folder
- External service integrations centralized in `/lib`

While it does not strictly implement a formal pattern like Clean Architecture, the folder structure enforces modularity and separation of concerns.

### Authentication

Authentication is handled using **Better Auth**.

- Email and password login
- Secure session handling
- Secret-based configuration
- Authentication routes integrated with Next.js

Better Auth abstracts complex authentication flows while keeping configuration simple.

### Error Handling

- Authentication errors are displayed using toast notifications on the UI.
- Backend errors are handled within API routes to prevent application crashes.
- External API failures (Finnhub, Gemini) are managed inside workflow logic.

---

## ✨ Features

- User registration and login (Better Auth)
- Financial news integration via Finnhub API
- Automated background workflows with Inngest
- AI-powered email generation using Gemini
- Email delivery using Nodemailer
- Market dashboard visualization

---

## 📦 Installation

After forking the repository, configure the following:

### 1️⃣ MongoDB

Create a MongoDB cluster and connect it to the application.

```env
MONGO_USER=
MONGO_PASSWORD=
MONGODB_URI="mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@cluster-stock-market.mongodb.net"
```

### 2️⃣ Better Auth

Create a Better Auth account and generate a secret token:
https://www.better-auth.com/docs/installation

```env
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
```
### 3️⃣ Gemini API

Create an API key (or use any AI provider of your choice).
```env
GEMINI_API_KEY=
```

Run

```
npm run dev
npm run inngest
```
And then you are ready to go!

## 📂 Project Structure

The project follows the standard **Next.js App Router** structure with clear responsibility separation.

---

### `/app`

Contains the main application routes:

- **auth** – Sign in / Sign up pages  
- **root** – Main dashboard  
- **api/inngest** – Inngest configuration and integration with Next.js  

---

### `/database`

- MongoDB connection setup  
- Mongoose models  

---

### `/hooks`

- Custom React hooks used across the application  

---

### `/lib`

External service configurations:

- Better Auth  
- Nodemailer  
- Inngest  
- Other integrations  

---

### `/middleware`

- Application middlewares  
