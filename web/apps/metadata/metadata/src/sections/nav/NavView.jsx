import React from "react";
import { NavLink } from "react-router-dom";
import { Box, styled } from "@mui/material";

const defaultItems = [
  { label: "Submit", path: "/" },
  // { label: "History", path: "/history" },
];

const NavContainer = styled('div')({
  display: 'flex',
  paddingLeft: '260px', // increased from 30px → 60px
  boxShadow: 'inset 1px -3px 10px 1px #c2bcc288',
});

const NavView = (tabItems = defaultItems) => (
  <NavContainer>
    {tabItems?.map((item) => (
      <NavLink
        key={item.path}
        to={item.path}
        end
        style={({ isActive }) => ({
          height: 50,
          padding: "6px 30px",
          overflow: "hidden",
          position: "relative",
          fontSize: 18,
          maxWidth: 264,
          minWidth: 130,
          boxShadow: isActive ? '-1px -7px 10px 1px #c2bcc288' : '',
          background: isActive
            ? "#f8f9fa"
            : "#e7e5e5",
          color: isActive ? "#5d5a5aff" : "#5785a1",
          borderTop: "0.9px solid #C4C4C4",
          borderLeft: "0.9px solid #C4C4C4",
          borderRight: "0.9px solid #C4C4C4",
          borderTopLeftRadius: 5,
          borderTopRightRadius: 5,
          marginTop: 20,
          marginLeft: 10,
          marginRight: 10,
          minHeight: 48,
          textAlign: "center",
          flexShrink: 0,
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          fontWeight: 500,
          lineHeight: 1.75,
          letterSpacing: "0.02857em",
          textTransform: "uppercase",
          textDecoration: "none",
        })}
      > 
        {item.label}
      </NavLink>
    ))}
  </NavContainer>
);

export default NavView;