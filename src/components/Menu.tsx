import { motion } from 'motion/react';

const originals = [
  "Margarita", "Octane", "Strawberry", "Hypnotic", "Pina Colada", "Hurricane", "Peach", "Flavor of the Week"
];

const signatures = [
  { name: "Texas Twist", ingredients: "Strawberry, Margarita" },
  { name: "Gruene Rapids", ingredients: "Hypnotic, Octane" },
  { name: "Sweet Magnolia", ingredients: "Pina Colada, Peach" },
  { name: "Cactus Juice", ingredients: "Margarita, Peach" },
  { name: "Superman", ingredients: "Hypnotic, Hurricane" },
  { name: "Dreamsicle", ingredients: "Pina Colada, Octane" },
  { name: "Miami Vice", ingredients: "Strawberry, Pina Colada" },
  { name: "Cyclone", ingredients: "Hurricane, Octane" },
  { name: "Lazy River", ingredients: "Pina Colada, Hypnotic" },
  { name: "All American", ingredients: "Strawberry, Pina Colada, Hypnotic" },
  { name: "New Braunfels Sunset", ingredients: "Peach, Octane, Strawberry" },
  { name: "Southern Classic", ingredients: "Hurricane, Octane, Margarita" },
  { name: "River Road", ingredients: "Strawberry, Hypnotic, Peach" },
  { name: "The Titan", ingredients: "Hypnotic, Hurricane, Octane" },
  { name: "Perfect Storm", ingredients: "Hurricane, Peach, Strawberry" }
];

export function Menu() {
  return (
    <section id="menu" className="py-20 bg-brand-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-base text-brand-red font-bold tracking-wide uppercase">Frozen 2 Go</h2>
          <p className="mt-2 text-4xl leading-8 font-display tracking-tight text-brand-blue sm:text-5xl uppercase">
            Signature Drinks
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
            Mix and match or try one of our famous combinations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Originals Column */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border-t-8 border-brand-red">
            <h3 className="text-3xl font-display text-brand-red mb-6 uppercase text-center">Originals</h3>
            <ul className="space-y-4">
              {originals.map((drink, idx) => (
                <li key={idx} className="flex items-center text-lg font-semibold text-brand-blue">
                  <span className="w-2 h-2 bg-brand-yellow rounded-full mr-3"></span>
                  {drink}
                </li>
              ))}
            </ul>
            <div className="mt-8 p-4 bg-brand-orange/20 rounded-xl text-center border-2 border-brand-orange border-dashed">
              <p className="font-bold text-brand-red text-xl">Add a Shot To Any Drink $1</p>
            </div>
          </div>

          {/* Signatures Column (Takes up 2 columns on large screens) */}
          <div className="lg:col-span-2 bg-brand-blue rounded-3xl p-8 shadow-xl text-brand-light">
            <h3 className="text-3xl font-display text-brand-yellow mb-8 uppercase text-center">Signature Combinations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {signatures.map((drink, idx) => (
                <div key={idx} className="border-b border-blue-800 pb-3">
                  <h4 className="text-xl font-bold text-white mb-1">{drink.name}</h4>
                  <p className="text-sm text-gray-300 italic">{drink.ingredients}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing & Sizes */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-6 shadow-md text-center border-2 border-brand-blue">
            <h4 className="text-2xl font-display text-brand-blue uppercase mb-4">Pick A Size</h4>
            <div className="flex justify-center items-end space-x-4 text-brand-blue font-bold">
              <div className="flex flex-col items-center"><div className="w-6 h-8 bg-white rounded-b-lg border-2 border-brand-blue mb-2 relative"><div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-red rounded-full -mt-1"></div></div>16 oz</div>
              <div className="flex flex-col items-center"><div className="w-8 h-10 bg-white rounded-b-lg border-2 border-brand-blue mb-2 relative"><div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-brand-red rounded-full -mt-1"></div></div>24 oz</div>
              <div className="flex flex-col items-center"><div className="w-10 h-12 bg-white rounded-b-lg border-2 border-brand-blue mb-2 relative"><div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-brand-red rounded-full -mt-1"></div></div>32 oz</div>
              <div className="flex flex-col items-center"><div className="w-12 h-16 bg-white rounded-b-lg border-2 border-brand-blue mb-2 relative"><div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-brand-red rounded-full -mt-1"></div></div>1/2 Gal</div>
              <div className="flex flex-col items-center"><div className="w-16 h-20 bg-white rounded-b-lg border-2 border-brand-blue mb-2 relative"><div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-brand-red rounded-full -mt-1"></div></div>Gallon</div>
            </div>
          </div>

          <div className="bg-brand-red rounded-2xl p-6 shadow-md text-center text-white">
            <h4 className="text-2xl font-display uppercase mb-4">River Jugs</h4>
            <div className="space-y-2 text-xl font-bold">
              <p>32 oz - $16</p>
              <p>1/2 Gallon - $27</p>
            </div>
            <p className="mt-4 text-sm uppercase tracking-wider font-semibold bg-white text-brand-red inline-block px-3 py-1 rounded-full">Approved!</p>
          </div>

          <div className="bg-brand-yellow rounded-2xl p-6 shadow-md text-center text-brand-blue">
            <h4 className="text-2xl font-display uppercase mb-4">Extras & More</h4>
            <ul className="space-y-2 font-bold text-lg">
              <li className="flex justify-between border-b border-yellow-500 pb-1"><span>Jell-O Shot</span><span>$2</span></li>
              <li className="flex justify-between border-b border-yellow-500 pb-1 text-sm text-brand-red"><span>(3 for $5)</span><span></span></li>
              <li className="flex justify-between border-b border-yellow-500 pb-1"><span>Tipsy Bears</span><span>$2</span></li>
              <li className="flex justify-between border-b border-yellow-500 pb-1"><span>Bottled Water</span><span>$1</span></li>
            </ul>
            <div className="mt-4 flex justify-between items-center bg-white rounded-lg p-2">
              <span className="font-bold">Beer (Coors, Bud, Miller)</span>
              <span className="font-bold text-brand-red">$4</span>
            </div>
            <div className="mt-2 flex justify-between items-center bg-brand-orange text-white rounded-lg p-2">
              <span className="font-bold">Kids Slushies (12oz)</span>
              <span className="font-bold">$3</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
