import React from 'react';
import { NavLink } from 'react-router-dom';

export const Nav: React.FC = () => {
  const linkStyle: React.CSSProperties = { padding: '6px 10px', borderRadius: 6, textDecoration: 'none' };
  const activeStyle: React.CSSProperties = { backgroundColor: '#222', color: 'white' };
  return (
    <nav style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
      <NavLink to="/" end style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>
        Home
      </NavLink>
      <NavLink to="/basic" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>
        Basic
      </NavLink>
      <NavLink to="/complex" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>
        Complex
      </NavLink>
      <NavLink to="/nested" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>
        Nested
      </NavLink>
      <NavLink to="/legacy" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>
        Legacy Demo
      </NavLink>
    </nav>
  );
};

export default Nav;



