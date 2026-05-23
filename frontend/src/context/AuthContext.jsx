import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check auth status on load
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
          credentials: 'include' // Required to send HTTP cookies
        });
        const json = await response.json();

        if (json.success) {
          setUser(json.data);
          // Fetch projects
          await fetchProjects();
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Load selected project from localStorage when projects list is populated
  useEffect(() => {
    if (projects.length > 0) {
      const savedProjectId = localStorage.getItem('current_project_id');
      const selected = projects.find(p => p._id === savedProjectId) || projects[0];
      setCurrentProject(selected);
      if (selected) {
        localStorage.setItem('current_project_id', selected._id);
      }
    } else {
      setCurrentProject(null);
    }
  }, [projects]);

  // Helper to fetch projects
  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        credentials: 'include'
      });
      const json = await response.json();
      if (json.success) {
        setProjects(json.data);
        return json.data;
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
    return [];
  };

  // Sign up action
  const signup = async (name, email, password) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
        credentials: 'include'
      });
      const json = await response.json();

      if (json.success) {
        setUser({
          _id: json.data._id,
          name: json.data.name,
          email: json.data.email
        });
        await fetchProjects();
        return true;
      } else {
        setError(json.error || 'Signup failed');
        return false;
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
      return false;
    }
  };

  // Login action
  const login = async (email, password) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      const json = await response.json();

      if (json.success) {
        setUser({
          _id: json.data._id,
          name: json.data.name,
          email: json.data.email
        });
        await fetchProjects();
        return true;
      } else {
        setError(json.error || 'Login failed');
        return false;
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
      return false;
    }
  };

  // Logout action
  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error('Error during logout fetch:', err);
    }
    localStorage.removeItem('current_project_id');
    setUser(null);
    setProjects([]);
    setCurrentProject(null);
  };

  // Select project action
  const selectProject = (project) => {
    setCurrentProject(project);
    localStorage.setItem('current_project_id', project._id);
  };

  // Create new project helper
  const createProject = async (name, allowedOrigins) => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, allowedOrigins }),
        credentials: 'include'
      });
      const json = await response.json();
      if (json.success) {
        const updatedList = await fetchProjects();
        const newProj = updatedList.find(p => p._id === json.data._id);
        if (newProj) {
          selectProject(newProj);
        }
        return true;
      }
    } catch (err) {
      console.error('Error creating project:', err);
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        projects,
        currentProject,
        loading,
        error,
        signup,
        login,
        logout,
        selectProject,
        createProject,
        fetchProjects,
        API_BASE_URL
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
