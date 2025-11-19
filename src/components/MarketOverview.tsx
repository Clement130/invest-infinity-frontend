import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import AnimatedSection from './AnimatedSection';

export default function MarketOverview() {
  const markets = [
    {
      name: 'Bitcoin',
      symbol: 'BTC',
      price: '45,879.23',
      change: '+5.67%',
      isPositive: true,
      volume: '32.5B'
    },
    {
      name: 'Ethereum',
      symbol: 'ETH',
      price: '3,245.89',
      change: '+3.21%',
      isPositive: true,
      volume: '15.8B'
    },
    {
      name: 'Solana',
      symbol: 'SOL',
      price: '89.45',
      change: '-2.34%',
      isPositive: false,
      volume: '4.2B'
    },
    {
      name: 'Cardano',
      symbol: 'ADA',
      price: '1.23',
      change: '+1.56%',
      isPositive: true,
      volume: '2.1B'
    }
  ];

  return (
    <section className="py-24 bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-pink-900/10 via-black to-black" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <AnimatedSection>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Market Overview
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Real-time cryptocurrency market data and trends
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 gap-6">
          {markets.map((market, index) => (
            <AnimatedSection key={index}>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-pink-800 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                <div className="relative bg-black p-6 rounded-lg border border-pink-800/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{market.name}</h3>
                      <span className="text-sm text-gray-400">{market.symbol}/USD</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">${market.price}</div>
                      <div className={`text-sm flex items-center ${market.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {market.isPositive ? (
                          <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        {market.change}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-pink-800/30">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">24h Volume</span>
                      <span className="text-white">${market.volume}</span>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}