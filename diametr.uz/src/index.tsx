import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import './i18n/config'
// import 'dotenv/config'

// dotenv.config({ path: __dirname+'/.env' });

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(

  <App />

);


