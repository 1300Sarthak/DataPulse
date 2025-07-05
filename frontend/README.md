# DataPulse Frontend

A modern React frontend for the DataPulse application built with Vite, HeroUI, and Tailwind CSS.

## Features

- 🚀 **Vite** - Fast build tool and dev server
- 🎨 **HeroUI** - Beautiful React components
- 🎯 **Tailwind CSS** - Utility-first CSS framework
- 🌙 **Dark Mode** - Toggle between light and dark themes
- 📱 **Responsive** - Mobile-first design
- 🔗 **API Integration** - Ready to connect with DataPulse backend

## Tech Stack

- React 19
- Vite
- HeroUI (formerly NextUI)
- Tailwind CSS
- Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
# Copy .env.local.example to .env.local and update the backend URL
cp .env.local.example .env.local
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.jsx      # Main layout wrapper
│   └── Navbar.jsx      # Navigation component
├── pages/              # Page components
│   └── Dashboard.jsx   # Main dashboard page
├── services/           # API services
│   └── api.js         # Backend API integration
├── App.jsx            # Main app component
└── index.css          # Global styles with Tailwind
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Backend Integration

The frontend is configured to connect to the DataPulse backend API. Make sure your backend is running on the URL specified in `VITE_API_BASE_URL`.

## Dark Mode

The application includes a dark mode toggle in the navbar. The theme preference is managed locally and persists during the session.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the DataPulse application.
