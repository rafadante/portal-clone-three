import logo from './logo.svg';
import './App.css';
import './App.scss';
import './Main.js';
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <div className="App">
      <Analytics />
    </div>
    
  );
}

export default App;
