import { createContext, useContext, useState, useEffect } from "react";
import { io } from "socket.io-client"; // socket budeme vytvárať dynamicky

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [socket, setSocket] = useState(null);

  const loadUser = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoaded(true);
      return null;
    }

    try {
      const res = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Neautorizovaný");

      const data = await res.json();

      console.log(data);
      setUser(data);

      if (data && !data.requiresVerification) {
        const newSocket = io("http://localhost:5000", {
          auth: { token },
          autoConnect: true,
        });
        setSocket(newSocket);
      }

      setLoaded(true);
      return data;
    } catch (err) {
      localStorage.removeItem("token");
      setUser(null);
      setLoaded(true);
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    if (socket) {
      socket.disconnect(); // bezpečne ukonči socket
      setSocket(null);
    }
    window.location.href = "/login";
  };

  const needsReverification = () => {
    return user?.requiresVerification === true;
  };

  useEffect(() => {
    loadUser();
    // Cleanup pri odchode zo stránky alebo zmene usera
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        socket, // ➡️ socket bude dostupný cez useAuth()
        isAuthenticated: !!user,
        logout,
        loadUser,
        needsReverification,
      }}
    >
      {loaded ? children : null}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
