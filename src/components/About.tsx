import { motion } from 'motion/react';
import { Droplet, Leaf, Citrus } from 'lucide-react';

export function About() {
  return (
    <section id="about" className="py-20 bg-brand-orange text-brand-blue relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-4 bg-brand-yellow"></div>
      <div className="absolute bottom-0 left-0 w-full h-4 bg-brand-red"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-display uppercase tracking-tight sm:text-5xl mb-6 text-white drop-shadow-md">
            The Real Deal
          </h2>
          <p className="text-xl font-medium leading-relaxed bg-white/90 p-6 rounded-2xl shadow-lg">
            All of our products are made from <span className="text-brand-red font-bold">real sugar cane</span>, <span className="text-brand-red font-bold">real fruit purée</span>, and a vinous citrus neutral alcohol (the alcohol is derived and fermented from oranges and citrus fruits).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div 
            whileHover={{ y: -10 }}
            className="bg-white rounded-2xl p-8 text-center shadow-xl border-b-8 border-brand-yellow"
          >
            <div className="w-16 h-16 mx-auto bg-brand-yellow rounded-full flex items-center justify-center mb-6">
              <Leaf className="w-8 h-8 text-brand-blue" />
            </div>
            <h3 className="text-2xl font-display uppercase mb-3">Real Sugar Cane</h3>
            <p className="text-gray-600">No artificial sweeteners or high fructose corn syrup. Just pure, natural sweetness.</p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -10 }}
            className="bg-white rounded-2xl p-8 text-center shadow-xl border-b-8 border-brand-red"
          >
            <div className="w-16 h-16 mx-auto bg-brand-red rounded-full flex items-center justify-center mb-6">
              <Droplet className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-display uppercase mb-3">Real Fruit Purée</h3>
            <p className="text-gray-600">Authentic fruit flavor in every sip, blended to frozen perfection.</p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -10 }}
            className="bg-white rounded-2xl p-8 text-center shadow-xl border-b-8 border-brand-blue"
          >
            <div className="w-16 h-16 mx-auto bg-brand-blue rounded-full flex items-center justify-center mb-6">
              <Citrus className="w-8 h-8 text-brand-light" />
            </div>
            <h3 className="text-2xl font-display uppercase mb-3">Citrus Alcohol</h3>
            <p className="text-gray-600">A clean, vinous neutral alcohol derived and fermented from oranges and citrus fruits.</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
