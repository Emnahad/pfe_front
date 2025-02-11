import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "antd/dist/reset.css"; // Ant Design styles
import Login from "./components/Auth/Login";
import Dashboard from "./components/Dashboard/Dashboard";
import Workflow from "./components/Workflow/Workflow";
import ConfigForm from "./components/ConfigForm/ConfigForm";

const App = () => {
  return (
    <Router>
      <div>
        {/* Navigation bar (optional, can use Ant Design's Menu) */}
        <header style={{ padding: "1rem", background: "#4A90E2", color: "#fff" }}>
          <h1>Stargate Data Lakehouse</h1>
        </header>

        {/* Define Routes */}
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/workflow" element={<Workflow />} />
          <Route path="/config" element={<ConfigForm />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
