import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

function Footer() {
  return (
    <footer className="glass border-t border-white/5 mt-16 shadow-2xl">
      <div className="container mx-auto px-6 md:px-12 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Info */}
        <div className="flex flex-col gap-4">
          <span className="text-xl font-black bg-gradient-to-r from-violet-400 to-pink-500 bg-clip-text text-transparent">
            E-SPHERE
          </span>
          <p className="text-gray-400 text-xs leading-relaxed">
            Your destination for premium electronics, fashion, and lifestyle items. Experience safe shopping and fast shipping globally.
          </p>
          <div className="flex items-center gap-4 text-gray-400">
            <a href="#" className="hover:text-white transition"><Facebook className="w-4.5 h-4.5" /></a>
            <a href="#" className="hover:text-white transition"><Twitter className="w-4.5 h-4.5" /></a>
            <a href="#" className="hover:text-white transition"><Instagram className="w-4.5 h-4.5" /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-sm font-bold text-gray-200 mb-4 tracking-wider uppercase">Shop Categories</h4>
          <ul className="flex flex-col gap-2 text-xs text-gray-400">
            <li><Link to="/catalog?category=smartphones" className="hover:text-white transition">Smartphones</Link></li>
            <li><Link to="/catalog?category=audio-headphones" className="hover:text-white transition">Audio & Headsets</Link></li>
            <li><Link to="/catalog?category=shoes" className="hover:text-white transition">Athletic Shoes</Link></li>
            <li><Link to="/catalog" className="hover:text-white transition">Browse Catalog</Link></li>
          </ul>
        </div>

        {/* Customer Service */}
        <div>
          <h4 className="text-sm font-bold text-gray-200 mb-4 tracking-wider uppercase">Customer Support</h4>
          <ul className="flex flex-col gap-2 text-xs text-gray-400">
            <li><a href="#" className="hover:text-white transition">Contact Support</a></li>
            <li><a href="#" className="hover:text-white transition">Shipping Policy</a></li>
            <li><a href="#" className="hover:text-white transition">Returns & Refunds</a></li>
            <li><a href="#" className="hover:text-white transition">FAQs</a></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-bold text-gray-200 mb-4 tracking-wider uppercase">Get in Touch</h4>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <MapPin className="w-4 h-4 text-violet-400 shrink-0" />
            <span>123 Commerce Avenue, New York, NY</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Phone className="w-4 h-4 text-violet-400 shrink-0" />
            <span>+1 (234) 567-890</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Mail className="w-4 h-4 text-violet-400 shrink-0" />
            <span>support@esphere.com</span>
          </div>
        </div>
      </div>
      
      <div className="border-t border-white/5 py-6 text-center text-gray-500 text-xs">
        &copy; {new Date().getFullYear()} E-Sphere Inc. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
