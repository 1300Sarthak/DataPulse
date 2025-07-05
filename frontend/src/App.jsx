import React from 'react';
import { HeroUIProvider } from "@heroui/react";
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <HeroUIProvider>
      <Layout>
        <Dashboard />
      </Layout>
    </HeroUIProvider>
  );
}

export default App;
