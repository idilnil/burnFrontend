import React, { useState,useEffect } from "react";
import { Link } from "react-router-dom";
import { loginDoctor } from "../api/axiosConfig";
//import "./Home.css";

const Home = () => {
  //css
  useEffect(() => {
  if (!document.getElementById("home-style")) {
    const style = document.createElement("style");
    style.id = "home-style";
    style.innerHTML = `
      :root {
        --primary-color: #3498db;
        --primary-hover: #2980b9;
        --text-color: black;
        --background-color: #ecf0f1;
        --button-text-color: #fff;
        --link-color: #3498db;
        --link-hover-color: #1f618d;
        --box-bg-color: #ffffff;
      }

      body {
        margin: 0;
        padding: 0;
        font-family: 'Arial', sans-serif;
        background-color: var(--background-color);
        color: var(--text-color);
      }

      .home-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }

      .home-box {
        background-color: var(--box-bg-color);
        padding: 40px;
        border-radius: 1px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
        text-align: center;
        width: 100%;
        max-width: 300px;
      }

      .home-box h1 {
        font-size: 2rem;
        margin-bottom: 10px;
      }

      .divider {
        width: 260px;
        height: 4px;
        background-color: #95a5a6;
        margin: 0 auto 20px;
        border-radius: px;
      }

      .home-box p {
        font-size: 1.1rem;
        margin-bottom: 20px;
      }

      .button-group {
        display: flex;
        gap: 20px;
        justify-content: center;
        margin-bottom: 20px;
      }

      .button-group button {
        flex: 1;
        min-width: 150px;
        max-width: 200px;
        padding: 12px 20px;
        font-size: 1rem;
        border: none;
        border-radius: 0px;
        background-color: var(--primary-color);
        color: var(--button-text-color);
        cursor: pointer;
        transition: 0.3s ease all;
      }

      .button-group button:hover {
        background-color: var(--primary-hover);
        transform: translateY(-2px);
      }

      a {
        color: var(--link-color);
        text-decoration: none;
        font-weight: bold;
      }

      a:hover {
        color: var(--link-hover-color);
        text-decoration: underline;
      }

    `;
    document.head.appendChild(style);
  }
}, []);



//admin css 
useEffect(() => {
  if (!document.getElementById("admin-button-style")) {
    const style = document.createElement("style");
    style.id = "admin-button-style";
    style.innerHTML = `
      .admin-login-button {
        position: absolute;
        top: 10px;
        right: 20px;
        padding: 5px 10px;
        font-size: 1rem;
        background-color: var(--primary-color, #3498db);
        color: var(--button-text-color, #fff);
        border: none;
        border-radius: 0px;
        cursor: pointer;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 1000;
        line-height: 1;
        height: auto;
        width: auto;
        display: inline-block;
        white-space: nowrap;
      }

      .admin-login-button:hover {
        background-color: var(--primary-hover, #2980b9);
        transform: scale(1.05);
      }
    `;
    document.head.appendChild(style);
  }
}, []);


  return (
    <div className="home-container">
        <button className="admin-login-button" onClick={() => window.location.href = "/login/admin"}>
            Admin Girişi
        </button>
      <div className="home-box">
        <h1>Yanık Ön Tanı ve Karar Destek Platformu</h1>
        <div className="divider"></div>
        <p>Giriş yapın</p>
        <div className="button-group">
          <button onClick={() => window.location.href = "/login/doctor"}>
            Doktor Girişi
          </button> </div>
        <p>
          Hesabınız yok mu? <Link to="/register">Kayıt olun</Link>
        </p>
     
      </div>
      </div>
    
  );
};

export default Home;
