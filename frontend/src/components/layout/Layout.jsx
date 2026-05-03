// Location: ConcertHub/frontend/src/components/layout/Layout.jsx
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => (
  <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
    <Navbar />
    <main style={{ flex: 1 }}>{children}</main>
    <Footer />
  </div>
);

export default Layout;