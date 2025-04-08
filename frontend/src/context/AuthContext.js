import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const loadUser = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoaded(true);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Neautorizovaný");

      const data = await res.json();

      setUser(data);
    } catch (err) {
      localStorage.removeItem("token");
      setUser(null);
    }

    setLoaded(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/login";
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, logout, loadUser }}
    >
      {loaded ? children : null}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
