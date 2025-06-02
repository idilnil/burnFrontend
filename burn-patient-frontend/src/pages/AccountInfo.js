import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


const AccountInfo = () => {
  
  const navigate = useNavigate();
  const [doctorInfo, setDoctorInfo] = useState({
    name: "",
    email: "",
    password: "",  // Backend'den şifreyi boş alacağız
  });

  const [message, setMessage] = useState("");

    useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .account-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background-color: #f0f2f5;
      }

      .account-box {
        background-color: #ecf0f1;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
        width: 100%;
        max-width: 400px;
      }

      .account-box h2 {
        margin-bottom: 20px;
        text-align: center;
        color: #333;
      }

      .account-box form > div {
        margin-bottom: 15px;
      }

      .account-box label {
        display: block;
        margin-bottom: 5px;
        color: #555;
        font-weight: 500;
      }

      .account-box input {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid #ccc;
        border-radius: 6px;
        font-size: 14px;
      }

      .account-box button {
        width: 100%;
        padding: 10px;
        background-color: #7ba9db;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        margin-top: 10px;
      }

      .account-box button:hover {
        background-color: #0056b3;
      }

      .account-box p {
        text-align: center;
        color: green;
        margin-top: 10px;
      }
      .back-button {
      position: absolute;
      top: 10px;
      left: 30px;
      background-color: #7ba9db;
      color: white;
      border: none;
      padding: 12px 10px;
      width: 100px;
      font-size: 15px;
      border-radius: 6px;
      cursor: pointer;
      }
    `;
    style.id = "account-style";
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById("account-style");
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);

  useEffect(() => {
    const fetchDoctorInfo = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token bulunamadı! Kullanıcı giriş yapmamış olabilir.");
        return;
      }
      try {
        const response = await fetch("http://localhost:5005/api/doctor/info", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
  
        if (!response.ok) {
          throw new Error(`HTTP hata! Durum: ${response.status}`);
        }
  
        const data = await response.json();
        setDoctorInfo({
          doctorID: data.doctorID, // ID'yi alıp kaydet
          name: data.name,
          email: data.email,
          password: "", // Şifre backend'den gelmeyecek, kullanıcı yeni şifre girecek
        });
      } catch (error) {
        console.error("Doktor bilgileri alınamadı:", error);
      }
    };
  
    fetchDoctorInfo();
  }, []);
  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDoctorInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!doctorInfo.doctorID) {
      setMessage("Doktor kimliği bulunamadı.");
      return;
    }
  
    const updateData = {
      name: doctorInfo.name,
      email: doctorInfo.email,
    };
  
    if (doctorInfo.password.trim() !== "") {
      updateData.password = doctorInfo.password;
    }
  
    try {
      const response = await fetch(`http://localhost:5005/api/doctor/update/${doctorInfo.doctorID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updateData),
      });
  
      if (response.ok) {
        setMessage("Bilgileriniz başarıyla güncellendi.");
        setDoctorInfo((prev) => ({ ...prev, password: "" })); // Güncelleme sonrası şifreyi sıfırla
      } else {
        setMessage("Güncelleme başarısız.");
      }
    } catch (error) {
      console.error("Güncelleme hatası:", error);
      setMessage("Güncelleme sırasında bir hata oluştu.");
    }
  };
  
return (
    <div className="account-container">
      <button className="back-button" onClick={() => navigate("/menu-page")}>
        ← Geri
       </button>
      <div className="account-box">
        <h2>Hesap Bilgileri</h2>
        {message && <p>{message}</p>}
        <form onSubmit={handleSubmit}>
          <div>
            <label>Ad:</label>
            <input
              type="text"
              name="name"
              value={doctorInfo.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label>E-posta:</label>
            <input
              type="email"
              name="email"
              value={doctorInfo.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label>Yeni Şifre (isteğe bağlı):</label>
            <input
              type="password"
              name="password"
              value={doctorInfo.password}
              onChange={handleInputChange}
            />
          </div>
          <button type="submit">Bilgileri Güncelle</button>
        </form>
      </div>
    </div>
  );
};

export default AccountInfo;
