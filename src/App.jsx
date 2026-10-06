import { BrowserRouter } from 'react-router';
import Home from './pages/home/Home';

export default function App () {
  return (
    <BrowserRouter>
      <Home/>
    </BrowserRouter>
  )
}