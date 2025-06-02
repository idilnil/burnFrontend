import React, { useState,useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { loginDoctor } from "../api/axiosConfig";
//import "./LoginDoctor.module.css";

const LoginDoctor = ({ onLogin }) => {
  const [formData, setFormData] = useState({ Email: "", Password: "" });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  
  //css
  useEffect(() => {
    if (!document.getElementById("login-doctor-style")) {
      const style = document.createElement("style");
      style.id = "login-doctor-style";
      style.innerHTML = `
        .login-container-doctor {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
          background-color: #ecf0f1;
          position: relative;
        }

        .login-container-doctor__form {
          width: 100%;
          max-width: 400px;
          background: white;
          padding: 20px;
          border-radius: 0px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
          position: relative;
        }

        .login-container-doctor__back-button {
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

        .login-container-doctor__back-button:hover {
          color: #1976D2;
        }

        .login-container-doctor__title {
          text-align: center;
          font-family: 'Arial', sans-serif;
          color: #333;
          margin-bottom: 20px;
        }

        .login-container-doctor__input {
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

        .login-container-doctor__button {
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

        .login-container-doctor__button:hover {
          background-color: #1565C0;
        }

        .login-container-doctor__error {
          color: red;
          margin-top: 10px;
          text-align: center;
        }

        .login-container-doctor__success {
          color: green;
          margin-top: 10px;
          text-align: center;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);
  // Input alanındaki değişiklikleri handle eden fonksiyon
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  // Giriş işlemini handle eden fonksiyon
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
  
    if (!formData.Email || !formData.Password) {
      setError("Email ve Şifre alanları doldurulmalıdır.");
      return;
    }
  
    try {
      const response = await loginDoctor("/api/doctor/login", formData);
  
      if (response.data?.success) {
        const token = response.data?.token;
        localStorage.setItem("token", token);
        localStorage.setItem("isDoctorLoggedIn", "true");
  
        setSuccessMessage("Giriş başarılı! Doktor paneline yönlendiriliyorsunuz.");
        setTimeout(() => {
          navigate("/menu-page");
        }, 2000);
      } else {
        setError(response.data?.message || "Geçersiz giriş bilgileri.");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Bağlantı hatası oluştu.");
    }
  };
  

  // Geri dönme fonksiyonu
  const handleGoBack = () => {
    navigate("/"); // Home.js'ye yönlendirme
  };

  return (
   <div className="login-container-doctor">
  <div className="login-container-doctor__back-button" onClick={handleGoBack}>
    <FaArrowLeft size={24} color="#7ba9db" /> Geri Dön
  </div>



  {error && <div className="login-container-doctor__error">{error}</div>}
  {successMessage && <div className="login-container-doctor__success">{successMessage}</div>}

  <form className="login-container-doctor__form" onSubmit={handleSubmit}>
     <div
      className="login-container-doctor__back-button"
      onClick={handleGoBack}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => { if (e.key === 'Enter') handleGoBack(); }}>
       <FaArrowLeft size={24} /> Ana Sayfaya Dön
      </div>
  <h2 className="login-container-doctor__title">Doktor Girişi</h2>
    
    <input
      type="email"
      name="Email"
      placeholder="Email"
      value={formData.Email}
      onChange={handleInputChange}
      required
      className="login-container-doctor__input"
    />
    <input
      type="password"
      name="Password"
      placeholder="Şifre"
      value={formData.Password}
      onChange={handleInputChange}
      required
      className="login-container-doctor__input"
    />
    <button type="submit" className="login-container-doctor__button">
      Giriş Yap
    </button>
  </form>
</div>
  );
};

export default LoginDoctor;