import React from 'react';
import { Dumbbell } from 'lucide-react';

export default function Placeholder({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 mt-32">
      <div className="w-24 h-24 rounded-full bg-navy-800 border-2 border-neon-cyan flex items-center justify-center neon-glow">
        <Dumbbell className="w-12 h-12 text-neon-cyan" />
      </div>
      <h1 className="text-4xl font-bold text-white tracking-wide">{title}</h1>
      <p className="text-gray-400 max-w-md text-lg">
        Este módulo está sendo refatorado e construído com os mais novos componentes visuais da plataforma.
      </p>
    </div>
  )
}
