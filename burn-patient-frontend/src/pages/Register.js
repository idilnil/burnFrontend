import React, { useState ,useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
//import "./Register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

    useEffect(() => {
    if (!document.getElementById("register-style")) {
      const style = document.createElement("style");
      style.id = "register-style";
      style.innerHTML = `
        .register-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
          background-color: #ecf0f1;
          position: relative;
        }

        .register-form {
          width: 100%;
          max-width: 400px;
          background: white;
          padding: 20px;
          border-radius: 0px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
          position: relative;
        }


        .register__back-button {
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

        .register__back-button:hover {
          color: #1976D2;
        }

        .register-title {
          text-align: center;
          font-family: 'Arial', sans-serif;
          color: #333;
          margin-bottom: 20px;
        }

        .register-input {
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

        .register-button {
          width: 60%;
          padding: 8px;
          background-color: #7ba9db;
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 16px;
          cursor: pointer;
          margin: auto;
          display: block;
        }

        .register-button:hover {
          background-color: #1565C0;
        }

        .error-message {
          color: red;
          margin-top: 10px;
          text-align: center;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);
  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      setError("Ad, E-posta ve Şifre alanları zorunludur.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5005/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Kayıt başarısız.");
      }

      // Token'ı localStorage'a kaydet
      if (result.token) {
        localStorage.setItem("token", result.token);
      }

      alert("Kayıt başarılı! Admin onayını bekleyin.");
      navigate("/"); 
    } catch (error) {
      console.error("Kayıt işlemi sırasında bir hata oluştu:", error);
      setError(error.message);
    }
  };
    
  const handleGoBack = () => {
    navigate("/");
  };

  return (
      <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
         <div
           className="register__back-button"
           onClick={handleGoBack}
           role="button"
           tabIndex={0}
           onKeyPress={(e) => { if (e.key === 'Enter') handleGoBack(); }}
         >
           <FaArrowLeft size={24} /> Ana Sayfaya Dön
         </div>
        <h2 className="register-title">Kayıt Ol</h2>
        {error && <div className="error-message">{error}</div>}
        <input
          type="text"
          name="name"
          placeholder="Ad"
          value={formData.name}
          onChange={handleInputChange}
          required
          className="register-input"
        />
        <input
          type="email"
          name="email"
          placeholder="E-posta"
          value={formData.email}
          onChange={handleInputChange}
          required
          className="register-input"
        />
        <input
          type="password"
          name="password"
          placeholder="Şifre"
          value={formData.password}
          onChange={handleInputChange}
          required
          className="register-input"
        />
        <button type="submit" className="register-button">Kayıt Ol</button>
      </form>
    </div>
  );
};

export default Register;
