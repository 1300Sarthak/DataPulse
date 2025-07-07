# 🌊 DataPulse - Your All-in-One Information Dashboard

> **A personal weekend project** – A real-time, responsive dashboard that aggregates all your essential information in one beautiful, mobile-friendly interface. Perfect for your morning routine!

![DataPulse Dashboard](https://img.shields.io/badge/Status-Active-brightgreen)

![React](https://img.shields.io/badge/Frontend-React-blue)

![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green)

![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)

![Deployment](https://img.shields.io/badge/Deployment-Render-blue)

## 🚀 Live Demo

**[Deployed On]** – https://data-pulse-xvft.vercel.app/

## 📖 Overview

DataPulse was born from a simple need: **having all my daily information in one place**. As someone who checks crypto prices, stock markets, weather, and news every morning, I wanted a single, beautiful dashboard that could replace multiple browser tabs and apps.

This project represents **a focused weekend of development**. It's a testament to how much you can build when you combine modern tools, clear requirements, and focused development time.

### 🎯 What Makes DataPulse Special

- **🔄 Real-time Updates**: Live data feeds with auto-refresh capabilities

- **📱 Mobile-First Design**: Responsive interface that works perfectly on all devices

- **🌙 Dark Mode Support**: Beautiful dark/light theme switching

- **⚡ Fast Performance**: Optimized with caching and efficient API calls

- **🎨 Modern UI**: Clean, intuitive interface built with HeroUI and Tailwind CSS

- **🔧 Highly Configurable**: Customizable settings for all data sources

## ✨ Current Features

### 📊 **Dashboard Overview**

- **Crypto Tracking**: Real-time prices for BTC, ETH, and top cryptocurrencies

- **Stock Market**: Live stock prices and market movements

- **Weather Information**: Current conditions with detailed forecasts

- **News Feed**: Curated news from multiple categories

- **Exchange Rates**: Real-time currency conversion rates

### 🎛️ **Smart Features**

- **Auto-refresh**: Configurable intervals for live data updates

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

- **Error Handling**: Graceful fallbacks when APIs are unavailable

- **Caching System**: Optimized performance with Redis caching

- **Settings Management**: Persistent user preferences

### 🛠️ **Technical Stack**

**Frontend:**

- React 18 with Vite

- HeroUI (NextUI) for components

- Tailwind CSS for styling

- Chart.js for data visualization

- Responsive design with mobile-first approach

**Backend:**

- FastAPI (Python) for high-performance API

- Redis for caching and session management

- Supabase for database and authentication

- Multiple third-party APIs integration

**Deployment:**

- Docker containerization

- GitHub Actions CI/CD

- Render for hosting

- Supabase for database

## 🏗️ System Architecture

```

┌─────────────────────────────────────────────────────────────────┐

│ Frontend (React) │

├─────────────────────────────────────────────────────────────────┤

│ • Dashboard Component │

│ • TickerCard Component │

│ • ChartComponent │

│ • NewsFeed Component │

│ • RefreshButton Component │

│ • Settings Management │

│ • Dark Mode Toggle │

└─────────────────────────────────────────────────────────────────┘

│

│ REST API Calls

▼

┌─────────────────────────────────────────────────────────────────┐

│ Backend (FastAPI) │

├─────────────────────────────────────────────────────────────────┤

│ • /crypto - Cryptocurrency data │

│ • /stocks - Stock market data │

│ • /weather - Weather information │

│ • /news - News articles │

│ • /exchange-rate - Currency rates │

│ • /refresh - Data refresh endpoint │

│ • Fetcher Service (Background Jobs) │

│ • Caching Layer (Redis) │

└─────────────────────────────────────────────────────────────────┘

│

│ Database Operations

▼

┌─────────────────────────────────────────────────────────────────┐

│ Database (Supabase) │

├─────────────────────────────────────────────────────────────────┤

│ • price_logs - Historical price data │

│ • news_logs - News article storage │

│ • user_settings - User preferences │

│ • cache_data - Temporary data storage │

└─────────────────────────────────────────────────────────────────┘

│

│ Real-time Updates

▼

┌─────────────────────────────────────────────────────────────────┐

│ Real-Time System │

├─────────────────────────────────────────────────────────────────┤

│ • WebSocket connections │

│ • Polling mechanisms │

│ • Error handling & retry logic │

│ • Rate limiting & API quotas │

└─────────────────────────────────────────────────────────────────┘

│

│ CI/CD Pipeline

▼

┌─────────────────────────────────────────────────────────────────┐

│ CI/CD Pipeline │

├─────────────────────────────────────────────────────────────────┤

│ • GitHub Actions │

│ • Automated testing │

│ • Docker builds │

│ • Deployment automation │

└─────────────────────────────────────────────────────────────────┘

│

│ Deployment

▼

┌─────────────────────────────────────────────────────────────────┐

│ Deployment │

├─────────────────────────────────────────────────────────────────┤

│ • Render (Frontend & Backend) │

│ • Supabase (Database & Auth) │

│ • Redis Cloud (Caching) │

│ • Domain & SSL management │

└─────────────────────────────────────────────────────────────────┘

```

## 🚧 Roadmap & Future Features

### 🔥 **Phase 1: Core Improvements** (Next 2 weeks)

- [ ] **Fix Dark Mode UI**: Complete dark mode implementation across all components

- [ ] **Settings Functionality**: Make all settings actually work and persist

- [ ] **Page Optimizations**: Improve loading states and error handling

- [ ] **Mobile UI Polish**: Enhance mobile experience and touch interactions

### 🚀 **Phase 2: New Features** (Next month)

- [ ] **Free API Integrations**:

- [ ] **Quotes API**: Daily inspirational quotes

- [ ] **Holiday API**: Upcoming holidays and events

- [ ] **Sports API**: Live sports scores and schedules

- [ ] **Traffic API**: Real-time traffic conditions

- [ ] **Air Quality API**: Local air quality index

### 🤖 **Phase 3: AI & ML Features** (Next 2 months)

- [ ] **Smart News Recommendations**: ML-powered news suggestions based on user preferences

- [ ] **Personalized Dashboard**: AI-driven layout optimization

- [ ] **Predictive Analytics**: Simple price movement predictions

- [ ] **Smart Notifications**: Intelligent alert system

### 🔐 **Phase 4: User System** (Next month)

- [ ] **Login/Authentication**: User accounts with Supabase Auth

- [ ] **Personalized Settings**: User-specific configurations

- [ ] **Data Sync**: Cross-device synchronization

- [ ] **User Profiles**: Customizable dashboards

### 📱 **Phase 5: Advanced Features** (Future)

- [ ] **PWA Support**: Install as mobile app

- [ ] **Offline Mode**: Cached data when offline

- [ ] **Widget System**: Customizable dashboard widgets

- [ ] **API Integration**: Allow users to add their own data sources

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ and npm

- Python 3.9+

- Redis server

- Supabase account

### Quick Start

1. **Clone the repository**

```bash

git clone https://github.com/yourusername/DataPulse.git

cd DataPulse

```

2. **Set up environment variables**

```bash

# Backend

cp .env.example .env

# Add your API keys and configuration



# Frontend

cd frontend

cp .env.example .env

```

3. **Install dependencies**

```bash

# Backend

pip install -r requirements.txt



# Frontend

cd frontend

npm install

```

4. **Run the application**

```bash

# Backend

uvicorn app.main:app --reload



# Frontend (in another terminal)

cd frontend

npm run dev

```

### Docker Setup

```bash

# Build and run with Docker Compose

docker-compose up --build

```

## 🧪 Testing

```bash

# Backend tests

pytest



# Frontend tests

cd frontend

npm test



# E2E tests

npm run test:e2e

```

## 📊 API Documentation

Once running, visit:

- **Backend API**: `http://localhost:8000/docs`

- **Frontend**: `http://localhost:5173`

## 🤝 Contributing

This is a personal project, but I'm open to contributions! If you find bugs or have ideas for improvements:

1. Fork the repository

2. Create a feature branch

3. Make your changes

4. Add tests

5. Submit a pull request

## 📈 What I Learned

This personal project taught me invaluable lessons:

### 🚀 **Deployment & DevOps**

- **Render Deployment**: Learned the ins and outs of deploying full-stack applications

- **Docker Containerization**: Proper containerization for scalable deployment

- **CI/CD Pipelines**: Automated testing and deployment with GitHub Actions

- **Environment Management**: Proper handling of environment variables and secrets

### 🎨 **Frontend Development**

- **React 18 Features**: Leveraged new React features for better performance

- **Vite Build System**: Fast development and optimized production builds

- **Responsive Design**: Mobile-first approach with Tailwind CSS

- **Component Architecture**: Clean, reusable component design

### 🔧 **Backend Development**

- **FastAPI**: High-performance async API development

- **Redis Caching**: Optimized data fetching and caching strategies

- **API Integration**: Managing multiple third-party APIs efficiently

- **Error Handling**: Robust error handling and fallback mechanisms

### 📱 **User Experience**

- **Dark Mode Implementation**: Proper theme switching with CSS variables

- **Loading States**: Smooth loading experiences across all components

- **Error Boundaries**: Graceful error handling in React applications

- **Mobile Optimization**: Touch-friendly interfaces and responsive layouts

## 🎯 Perfect For

- **Morning Routines**: Check everything you need in one place

- **Traders & Investors**: Quick market overview and price tracking

- **News Enthusiasts**: Curated news from multiple sources

- **Weather Watchers**: Detailed weather information and forecasts

- **Mobile Users**: Responsive design that works on any device

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **HeroUI/NextUI** for beautiful React components

- **Tailwind CSS** for utility-first styling

- **FastAPI** for high-performance backend

- **Supabase** for database and authentication

- **Render** for reliable hosting

---

**Built with ❤️ as a personal weekend project**

<<<<<<< HEAD

_"The best projects are born from solving your own problems"_

=======

### Quick Deploy to Render

The application is ready for deployment on Render with a single click:

1. **Fork this repository** to your GitHub account

2. **Sign up for Render** at [render.com](https://render.com)

3. **Create a new Web Service** and connect your forked repository

4. **Set environment variables** (see DEPLOYMENT.md for details)

5. **Deploy!**

### Manual Deployment

```bash

# Build the production image

./build.sh



# Test locally

docker run -p 8000:80 datapulse



# Deploy to your preferred platform

```

### Environment Variables Required

- `FINNHUB_API_KEY` - For stocks data

- `OPENWEATHER_API_KEY` - For weather data

- `GNEWS_API_KEY` - For news data

- `EXCHANGE_API_KEY` - For currency data

- `SUPABASE_URL` - Your Supabase project URL

- `SUPABASE_KEY` - Your Supabase anon key

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

The application is containerized and ready for deployment. The GitHub Actions workflow automatically runs tests on push to the main branch.
