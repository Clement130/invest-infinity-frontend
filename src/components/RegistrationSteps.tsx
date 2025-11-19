import React from 'react';
import { ClipboardCheck, UserPlus, Rocket, BadgeCheck } from 'lucide-react';

interface RegistrationStepsProps {
  onOpenRegister: () => void;
}

export default function RegistrationSteps({ onOpenRegister }: RegistrationStepsProps) {
  return (
    <div className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Start Your Trading Journey
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Simple steps to begin your evolution as a trader
          </p>
        </div>

        <div className="relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-600 to-red-600 transform -translate-y-1/2 hidden md:block" />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                icon: ClipboardCheck,
                title: 'Register Account',
                description: 'Create your account with our trusted broker partner'
              },
              {
                icon: UserPlus,
                title: 'Join Community',
                description: 'Access our exclusive Discord trading community'
              },
              {
                icon: Rocket,
                title: 'Access Resources',
                description: 'Get instant access to all trading tools and education'
              },
              {
                icon: BadgeCheck,
                title: 'Start Trading',
                description: 'Begin your journey with expert guidance'
              }
            ].map((step, index) => (
              <button
                key={index}
                onClick={onOpenRegister}
                className="relative group text-left transition-transform hover:scale-105 duration-300"
              >
                <div className="bg-white p-6 rounded-lg relative z-10 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}