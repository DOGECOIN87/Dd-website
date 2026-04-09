import { MapPin, Phone, Clock, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer id="location" className="bg-brand-blue text-brand-light pt-16 pb-8 border-t-8 border-brand-red">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          {/* Brand & About */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img src="/logo-square.png" alt="The Daiquiri Depot Logo" className="w-12 h-12 rounded-full object-contain bg-brand-red border-2 border-brand-light" />
              <span className="font-display text-2xl tracking-wide uppercase mt-1">The Daiquiri Depot</span>
            </div>
            <p className="text-gray-300 mb-6">
              Texas style Frozen Daiquiris To Go serving New Braunfels and surrounding areas. Curbside pickup available!
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/thedaiquiridepot/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-500 transition-colors">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-brand-yellow uppercase tracking-wider">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin className="w-6 h-6 text-brand-red mr-3 flex-shrink-0 mt-1" />
                <span>311 FM 306, Suite 1A<br />New Braunfels, TX 78130</span>
              </li>
              <li className="flex items-center">
                <Phone className="w-6 h-6 text-brand-red mr-3 flex-shrink-0" />
                <a href="tel:8306325888" className="hover:text-brand-yellow transition-colors">(830) 632-5888</a>
              </li>
              <li className="flex items-center">
                <Mail className="w-6 h-6 text-brand-red mr-3 flex-shrink-0" />
                <a href="mailto:daiquiridepotnb@yahoo.com" className="hover:text-brand-yellow transition-colors">daiquiridepotnb@yahoo.com</a>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-brand-yellow uppercase tracking-wider">Hours</h3>
            <ul className="space-y-3">
              <li className="flex items-center">
                <Clock className="w-6 h-6 text-brand-red mr-3 flex-shrink-0" />
                <span className="font-bold text-xl text-brand-red">Open Daily!</span>
              </li>
              <li className="text-gray-300">
                Call us or check our Facebook page for current operating hours and special holiday schedules.
              </li>
            </ul>
            <div className="mt-6">
              <a 
                href="https://maps.google.com/?q=311+FM+306,+Suite+1A,+New+Braunfels,+TX+78130" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block bg-brand-light text-brand-blue px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition-colors"
              >
                Get Directions
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-blue-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} The Daiquiri Depot. All rights reserved.
          </p>
          <p className="text-sm text-gray-400 mt-2 md:mt-0">
            Must be 21+ to purchase alcohol. Please drink responsibly.
          </p>
        </div>
      </div>
    </footer>
  );
}
