import { motion } from 'motion/react';

export function Hero() {
  return (
    <div className="relative bg-brand-blue overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#F4A261 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
      </div>
      
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 bg-brand-blue sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32 pt-20">
          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
              >
                <img 
                  src="/logo-banner.png" 
                  alt="The Daiquiri Depot - Frozen 2 Go" 
                  className="w-full max-w-xl mx-auto lg:mx-0 drop-shadow-xl"
                />
              </motion.div>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-3 text-base text-gray-300 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0"
              >
                Serving New Braunfels and surrounding areas. All of our products are made from real sugar cane, real fruit purée, and a vinous citrus neutral alcohol.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start"
              >
                <div className="rounded-md shadow">
                  <a
                    href="#menu"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-bold rounded-full text-brand-blue bg-brand-yellow hover:bg-yellow-400 md:py-4 md:text-lg transition-transform hover:scale-105"
                  >
                    View Menu
                  </a>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <a
                    href="tel:8306325888"
                    className="w-full flex items-center justify-center px-8 py-3 border-2 border-brand-red text-base font-bold rounded-full text-brand-light hover:bg-brand-red md:py-4 md:text-lg transition-colors"
                  >
                    Call to Order
                  </a>
                </div>
              </motion.div>
            </div>
          </main>
        </div>
      </div>
      <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
        <img
          className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
          src="https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
          alt="Colorful frozen drinks"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-blue to-transparent lg:via-brand-blue/20"></div>
      </div>
    </div>
  );
}
