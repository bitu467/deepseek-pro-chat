# 🚀 DeepSeek Pro Chat

A premium, glassmorphic AI chat application featuring **Multi-Model Comparison Mode**. Powered by NVIDIA NIM and hosted on Firebase.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Firebase](https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase)
![NVIDIA](https://img.shields.io/badge/NVIDIA-76B900?style=for-the-badge&logo=nvidia&logoColor=white)

## ✨ Features

- **Side-by-Side Comparison**: Compare results from up to 3 models (DeepSeek, Llama 3.3, etc.) simultaneously in a responsive grid.
- **Premium Glassmorphic UI**: Sleek, modern interface with real-time blur effects and smooth animations.
- **Dark & Light Mode**: Fully supported dynamic theme switching.
- **Streaming Responses**: Real-time word-by-word streaming for a natural conversation feel.
- **Mobile Optimized**: Responsive design specifically tuned for extra-small devices (like iPhone SE).
- **Secure Backend**: Firebase Cloud Functions (Cloud Run) proxy to protect API keys and handle CORS.

## 🤖 Supported Models (via NVIDIA NIM)

- **DeepSeek V4 Pro / Flash**
- **Meta Llama 3.3 70B**
- **Meta Llama 3.1 8B**
- **GPT-OSS 20B**

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Framer Motion, Lucide Icons, React Markdown.
- **Backend**: Firebase Functions v2 (Express), Google Cloud Run.
- **Hosting**: Firebase Hosting with CI/CD via GitHub Actions.
- **AI Infrastructure**: NVIDIA NIM API.

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Firebase CLI
- NVIDIA NIM API Key

### Installation

1. **Clone the repo**
   ```bash
   git clone https://github.com/bitu467/deepseek-pro-chat.git
   cd deepseek-pro-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

3. **Configure Environment**
   Create a `.env` file in the root:
   ```env
   NVIDIA_API_KEY=your_key_here
   ```

4. **Local Development**
   ```bash
   npm run dev
   ```

## 📦 Deployment

The project is configured with **GitHub Actions**. Any push to the `main` branch will automatically build and deploy to Firebase Hosting and Functions.

### Manual Deployment
```bash
firebase deploy
```

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
Built with ❤️ by [bitu467](https://github.com/bitu467)
