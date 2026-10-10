import { MotionConfig } from 'motion/react';
import { About } from './components/About';
import { Compare } from './components/Compare';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { Locations } from './components/Locations';
import { Menu } from './components/Menu';
import { Navbar } from './components/Navbar';
import { OrderBand } from './components/OrderBand';
import { Quiz } from './components/Quiz';
import { SipBar } from './components/SipBar';
import { Visit } from './components/Visit';

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell">
        <Navbar />
        <main>
          <Hero />
          <Locations />
          <Quiz />
          <Compare />
          <Menu />
          <SipBar />
          <OrderBand />
          <About />
          <Visit />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  );
}
