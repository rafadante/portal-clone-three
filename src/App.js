import './App.scss';
import './Main.js';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from '@vercel/speed-insights/react';

function App() {
  return (
    <div className="App">
      <Analytics />
      <SpeedInsights />
    </div>
    
  );
}

export default App;
