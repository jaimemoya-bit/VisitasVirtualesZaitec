import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthProvider.jsx';
import { CenterProvider } from './context/CenterProvider.jsx';
import App from './App.jsx';
import './assets/App.css';

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<BrowserRouter>
			<AuthProvider>
				<CenterProvider>
					<App />
				</CenterProvider>
			</AuthProvider>
		</BrowserRouter>
	</StrictMode>,
);
