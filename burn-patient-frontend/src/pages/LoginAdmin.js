import React, { useState, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../api/axiosConfig"; // API call

const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

const LoginAdmin = () => {
  const [formData, setFormData] = useState({ Email: "", Password: "" });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("isAdminLoggedIn") === "true") {
      navigate("/admin-dashboard");
    }
  }, [navigate]);

  // Sayfa yüklendiğinde style ekle
  useEffect(() => {
    if (!document.getElementById("login-admin-style")) {
      const style = document.createElement("style");
      style.id = "login-admin-style";
      style.innerHTML = `
        .login-container-admin {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
          background-color: #ecf0f1;
          position: relative;
        }

        .login-container-admin__form {
          width: 100%;
          max-width: 400px;
          background: white;
          padding: 20px;
          border-radius: 0px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
          position: relative;
        }

        .login-container-admin__back-button {
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: black;
          position: absolute;
          top: -40px;
          left: 0;
          z-index: 10;
        }

        .login-container-admin__back-button:hover {
          color: #1976D2;
        }

        .login-container-admin__title {
          text-align: center;
          font-family: 'Arial', sans-serif;
          color: #333;
          margin-bottom: 20px;
        }

        .login-container-admin__input {
          width: 90%;
          padding: 8px;
          margin-bottom: 15px;
          border-radius: 8px;
          border: 1px solid #ccc;
          font-size: 14px;
          display: block;
          margin-left: auto;
          margin-right: auto;
        }

        .login-container-admin__button {
          width: 60%;
          padding: 8px;
          background-color: #1976D2;
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 16px;
          cursor: pointer;
          margin: auto;
          display: block;
        }

        .login-container-admin__button:hover {
          background-color: #1565C0;
        }

        .login-container-admin__error {
          color: red;
          margin-top: 10px;
          text-align: center;
        }

        .login-container-admin__success {
          color: green;
          margin-top: 10px;
          text-align: center;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!formData.Email || !formData.Password) {
      setError("Email ve Şifre alanları doldurulmalıdır.");
      return;
    }

    try {
      const hashedPassword = await hashPassword(formData.Password);
      const response = await loginAdmin("/api/admin/login", {
        Email: formData.Email,
        Password: hashedPassword,
      });

      if (response.data.success) {
        localStorage.setItem("isAdminLoggedIn", "true");
        localStorage.setItem("token", response.data.token);

        setSuccessMessage("Giriş başarılı! Admin paneline yönlendiriliyorsunuz.");
        setTimeout(() => {
          navigate("/admin-dashboard");
        }, 2000);
      } else {
        setError(response.data.message || "Geçersiz giriş bilgileri.");
      }
    } catch (error) {
      setError("Admin girişinde bir hata oluştu.");
    }
  };

  const handleGoBack = () => {
    navigate("/");
  };

  return (
    <div className="login-container-admin">
      <form className="login-container-admin__form" onSubmit={handleSubmit}>
        <div
          className="login-container-admin__back-button"
          onClick={handleGoBack}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => { if (e.key === 'Enter') handleGoBack(); }}
        >
          <FaArrowLeft size={24} /> Ana Sayfaya Dön
        </div>

        <h2 className="login-container-admin__title">Admin Girişi</h2>

        {error && <div className="login-container-admin__error">{error}</div>}
        {successMessage && (
          <div className="login-container-admin__success">{successMessage}</div>
        )}

        <input
          type="email"
          name="Email"
          placeholder="E-posta"
          value={formData.Email}
          onChange={handleInputChange}
          required
          className="login-container-admin__input"
        />
        <input
          type="password"
          name="Password"
          placeholder="Şifre"
          value={formData.Password}
          onChange={handleInputChange}
          required
          className="login-container-admin__input"
        />
        <button type="submit" className="login-container-admin__button">
          Giriş Yap
        </button>
      </form>
    </div>
  );
};

export default LoginAdmin;
