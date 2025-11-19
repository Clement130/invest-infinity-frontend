import React from 'react';
import { Header } from './Header';
import { Hero } from './Hero';
import { Features } from './Features';
import { FaqAccordion } from './FaqAccordion';
export const LandingForm: React.FC = () => {
  return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-4">
      <Header />
      <Hero />
      <Features />
      <FaqAccordion />

    </div>
  );
}