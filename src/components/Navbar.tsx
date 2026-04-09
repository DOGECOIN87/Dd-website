import { Menu, X, MapPin, Phone, Clock } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-brand-blue text-brand-light sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <a href="#" className="flex-shrink-0 flex items-center gap-3">
              <img src="/logo-square.png" alt="The Daiquiri Depot Logo" className="w-12 h-12 rounded-full object-contain bg-brand-red border-2 border-brand-light" />
              <span className="font-display text-2xl tracking-wide uppercase mt-1">The Daiquiri Depot</span>
            </a>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#menu" className="font-semibold hover:text-brand-yellow transition-colors">Menu</a>
            <a href="#about" className="font-semibold hover:text-brand-yellow transition-colors">About</a>
            <a href="#location" className="font-semibold hover:text-brand-yellow transition-colors">Location</a>
            <a 
              href="tel:8306325888" 
              className="bg-brand-red hover:bg-red-600 text-white px-6 py-2 rounded-full font-bold transition-transform hover:scale-105 active:scale-95"
            >
              Order Now
            </a>
          </div>
          <div className="flex items-center md:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-brand-light hover:text-brand-yellow"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-brand-blue border-t border-blue-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a href="#menu" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800">Menu</a>
            <a href="#about" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800">About</a>
            <a href="#location" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800">Location</a>
            <a 
              href="tel:8306325888" 
              className="block w-full text-center mt-4 bg-brand-red text-white px-6 py-3 rounded-md font-bold"
            >
              Order Now: (830) 632-5888
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
