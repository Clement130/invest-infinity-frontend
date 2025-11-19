// TradingAccountCard.tsx
import React, { useState } from 'react';
import Step1OpenAccount from './Step1OpenAccount';
import Step2JoinDiscord from './Step2JoinDiscord';

const totalSteps = 2;

const TradingAccountCard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const goNext = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  const goBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const renderProgress = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
            i < currentStep ? 'bg-green-500' : 'bg-gray-300'
          }`}
          style={{ maxWidth: '50px' }}
        />
      ))}
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1OpenAccount onNext={goNext} />;
      case 2:
        return <Step2JoinDiscord onBack={goBack} onNext={goNext} />;
      default:
        return null;
    }
  };

  return (
    // On reprend le même container que ta page LeadForm
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl mx-auto">
        {/* On lui donne exactement le même ID et les mêmes classes que LeadForm */}
        <div id="lead-form" className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8 flex flex-col">
          {renderProgress()}
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default TradingAccountCard;
