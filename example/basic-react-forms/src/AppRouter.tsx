import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import BasicFormPage from './pages/BasicFormPage';
import ComplexFormPage from './pages/ComplexFormPage';
import NestedFormsPage from './pages/NestedFormsPage';
import LegacyDemoPage from './pages/LegacyDemoPage';
import Nav from './components/Nav';

export const AppRouter: React.FC = () => {
  return (
    <div style={{ padding: 16 }}>
      <h1>Radioactive Forms - Examples</h1>
      <Nav />
      <Routes>
        <Route
          path="/"
          element={
            <div style={{ display: 'grid', gap: 8 }}>
              <p>Select a demo:</p>
              <Link to="/basic">Basic</Link>
              <Link to="/complex">Complex</Link>
              <Link to="/nested">Nested</Link>
              <Link to="/legacy">Legacy Demo</Link>
            </div>
          }
        />
        <Route path="/basic" element={<BasicFormPage />} />
        <Route path="/complex" element={<ComplexFormPage />} />
        <Route path="/nested" element={<NestedFormsPage />} />
        <Route path="/legacy" element={<LegacyDemoPage />} />
      </Routes>
    </div>
  );
};

export default AppRouter;



