import { createContext, useContext, useState } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [doctor, setDoctor] = useState(() => {
    const raw = localStorage.getItem("hope_gate_doctor");
    return raw ? JSON.parse(raw) : null;
  });

  const persist = (token, doctorOut) => {
    localStorage.setItem("hope_gate_token", token);
    localStorage.setItem("hope_gate_doctor", JSON.stringify(doctorOut));
    setDoctor(doctorOut);
  };

  const login = async (email, password) => {
    const { data } = await client.post("/auth/login", { email, password });
    persist(data.access_token, data.doctor);
    return data.doctor;
  };

  const register = async (name, email, password) => {
    const { data } = await client.post("/auth/register", { name, email, password });
    persist(data.access_token, data.doctor);
    return data.doctor;
  };

  const logout = () => {
    localStorage.removeItem("hope_gate_token");
    localStorage.removeItem("hope_gate_doctor");
    setDoctor(null);
  };

  return (
    <AuthContext.Provider value={{ doctor, login, register, logout, isAuthenticated: !!doctor }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
