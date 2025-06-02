import React, { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
//import "./BurnForm.css"; // CSS dosyanızın var olduğundan emin olun

const BurnForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Backend'deki PatientInfo modelinin property adlarıyla eşleşecek şekilde güncellendi
    Name: "",                   // patientName -> Name
    Email: "",
    Age: "",
    Gender: "",
    BurnCause: "",
    BurnArea: "",
    HospitalArrivalDate: "",
    BurnOccurrenceDate: "",
    // BurnOccurrenceTime: "", // Bu alan modelde ayrı değil, handleSubmit'te birleştirilecekse orada işlenir
    HeightCm: "",
    WeightKg: "",
  });
  const [photoFile, setPhotoFile] = useState(null); // photo -> photoFile
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const burnCauses = [
    "Isı ile", "Işın ile", "Elektrik nedeniyle", "Sürtünmeye bağlı",
    "Donma sonucu oluşan", "Asit ve alkali madde teması", "Diğer"
  ];

  const burnAreas = [
    "Baş", "Boyun", "Göğüs", "Sırt", "Karın", "Kalça",
    "Genital Bölge", "Sağ Kol", "Sol Kol", "Sağ El", "Sol El",
    "Sağ Bacak", "Sol Bacak", "Sağ Ayak", "Sol Ayak", "Diğer"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file); // photoFile state'ini güncelle
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoFile(null);
      setPhotoPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    const submissionData = new FormData(); // FormData nesnesinin adı submissionData olarak değiştirildi (isteğe bağlı)

    // PatientInfo modelindeki property adlarıyla eşleştir
    submissionData.append("Name", formData.Name);
    if (formData.Email) submissionData.append("Email", formData.Email);
    submissionData.append("Age", formData.Age);
    submissionData.append("Gender", formData.Gender);
    submissionData.append("BurnCause", formData.BurnCause);
    submissionData.append("BurnArea", formData.BurnArea);

    if (formData.HospitalArrivalDate) {
      submissionData.append("HospitalArrivalDate", new Date(formData.HospitalArrivalDate).toISOString());
    }

    // BurnOccurrenceDate ve BurnOccurrenceTime'ı birleştirme (eğer backend tek bir DateTime bekliyorsa)
    // VEYA sadece tarihi gönderme. Modelinizde ayrı bir Time alanı yok.
    if (formData.BurnOccurrenceDate) {
        let occurrenceDateTime = new Date(formData.BurnOccurrenceDate);
        // Eğer formda burnOccurrenceTime alanı varsa ve kullanılıyorsa:
        // if (formData.burnOccurrenceTime) { 
        //   const [hours, minutes] = formData.burnOccurrenceTime.split(':');
        //   occurrenceDateTime.setHours(parseInt(hours, 10));
        //   occurrenceDateTime.setMinutes(parseInt(minutes, 10));
        // }
        submissionData.append("BurnOccurrenceDate", occurrenceDateTime.toISOString());
    }
    // Eğer BurnOccurrenceTime'ı ayrı bir alan olarak göndermek istiyorsanız ve backend bunu işliyorsa:
    // if (formData.burnOccurrenceTime) {
    //   submissionData.append("BurnOccurrenceTime", formData.burnOccurrenceTime);
    // }


    if (formData.HeightCm) {
      submissionData.append("HeightCm", formData.HeightCm);
    }
    if (formData.WeightKg) {
      submissionData.append("WeightKg", formData.WeightKg);
    }

    if (photoFile) {
      submissionData.append("photoFile", photoFile); // Backend'deki AddPatient parametresi: photoFile
    }

    try {
      // Backend endpoint'i: /api/Patient
      const response = await axios.post("http://localhost:5005/api/Patient", submissionData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage({ type: "success", text: `Kayıt başarılı! Hasta ID: ${response.data.patientID}` });

      // Formu sıfırla
      setFormData({
        Name: "", Email: "", Age: "", Gender: "", BurnCause: "", BurnArea: "",
        HospitalArrivalDate: "", BurnOccurrenceDate: "", // burnOccurrenceTime: "",
        HeightCm: "", WeightKg: "",
      });
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (error) {
      console.error("Form gönderimi sırasında hata:", error);
      let errorMessage = "Form gönderimi başarısız oldu. Lütfen tekrar deneyin.";
      if (error.response) {
        console.error("Hata Detayları:", error.response.data);
        const data = error.response.data;
        if (data) {
          if (data.errors) {
            errorMessage = Object.values(data.errors).flat().join(" \n");
          } else if (typeof data === 'string') {
            errorMessage = data;
          } else if (data.title) {
            errorMessage = data.title + (data.detail ? ` (${data.detail})` : "");
          } else if (data.message) {
             errorMessage = data.message;
          }
        }
      } else if (error.request) {
        errorMessage = "Sunucudan yanıt alınamadı. Bağlantınızı ve sunucu durumunu kontrol edin.";
      } else {
        errorMessage = error.message || "Bilinmeyen bir hata oluştu.";
      }
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ CSS stilleri useEffect içinde ekleniyor
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .page-wrapper {
        padding: 20px;
        font-family: sans-serif;
      }
      .burn-form-container {
        max-width: 900px;
        margin: 40px auto;
        background-color: #ecf0f1;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
        padding: 30px;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      form {
        background-color: #ecf0f1;
        width: 100%;
      }
      h2 {
        text-align: center;
        margin-bottom: 30px;
      }
      .form-row {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 20px;
      }
      .form-group {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      .form-group label {
        font-weight: bold;
        margin-bottom: 5px;
      }
      #admissionDateLabel {
        font-size: 1rem;
        margin-bottom: 0px;
        line-height: 0.81;
      }
      .form-group input,
      .form-group select {
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 6px;
        font-size: 14px;
        background-color: #fff;
        width: 100%;
        box-sizing: border-box;
      }
      button[type="submit"] {
        background-color: #7ba9db;
        color: white;
        padding: 12px 25px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        display: block;
        margin: 20px auto 0;
      }
      .photo-preview img {
        max-width: 300px;
        max-height: 300px;
        object-fit: cover;
        margin-top: 10px;
      }
      .message {
        padding: 10px;
        border-radius: 5px;
        margin-bottom: 15px;
        text-align: center;
      }
      .message.success {
        background-color: #d4edda;
        color: #155724;
      }
      .message.error {
        background-color: #f8d7da;
        color: #721c24;
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
    `; document.head.appendChild(style);

      return () => {
      document.head.removeChild(style); // Temizlik
      };
      }, []);
    

  return (
    <div className="page-wrapper">
    <button className="back-button" onClick={() => navigate("/menu-page")}>
      ← Geri
    </button>
    <div className="burn-form-container">
      <h2>Hasta Yanık Formu</h2>
      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
      <form onSubmit={handleSubmit}>
  <div className="form-row">
    <div className="form-group">
      <label htmlFor="Name">Hastanın Adı:</label>
      <input type="text" id="Name" name="Name" value={formData.Name} onChange={handleChange} required />
    </div>
    <div className="form-group">
      <label htmlFor="Email">E-posta Adresi:</label>
      <input type="email" id="Email" name="Email" value={formData.Email} onChange={handleChange} />
    </div>
  </div>

  <div className="form-row">
    <div className="form-group">
      <label htmlFor="Age">Yaş</label>
    <input
      type="number"
      id="Age"
      name="Age"
      value={formData.Age}
      onChange={handleChange}
    />

    <label htmlFor="Gender" style={{ marginTop: '10px' }}>Cinsiyet</label>
    <select
      id="Gender"
      name="Gender"
      value={formData.Gender}
      onChange={handleChange}
    >
      <option value="">Seçiniz</option>
      <option value="Erkek">Erkek</option>
      <option value="Kadın">Kadın</option>
      <option value="Diğer">Diğer</option>
    </select>
  </div>
  </div>

  <div className="form-row">
    <div className="form-group">
      <label htmlFor="HeightCm">Boy (cm):</label>
      <input type="number" id="HeightCm" name="HeightCm" value={formData.HeightCm} onChange={handleChange} />
    </div>
    <div className="form-group">
      <label htmlFor="WeightKg">Kilo (kg):</label>
      <input type="number" id="WeightKg" name="WeightKg" value={formData.WeightKg} onChange={handleChange} />
    </div>
  </div>

  <div className="form-row">
    <div className="form-group">
      <label htmlFor="BurnCause">Yanık Nedeni:</label>
      <select id="BurnCause" name="BurnCause" value={formData.BurnCause} onChange={handleChange} required>
        <option value="">Seçiniz</option>
        {burnCauses.map((cause, index) => (
          <option key={index} value={cause}>{cause}</option>
        ))}
      </select>
    </div>
    <div className="form-group">
      <label htmlFor="BurnArea">Yanık Bölgesi:</label>
      <select id="BurnArea" name="BurnArea" value={formData.BurnArea} onChange={handleChange} required>
        <option value="">Seçiniz</option>
        {burnAreas.map((area, index) => (
          <option key={index} value={area}>{area}</option>
        ))}
      </select>
    </div>
  </div>

  <div className="form-row">
    <div className="form-group">
      <label id="admissionDateLabel" htmlFor="admissionDate">Hastaneye Geliş Tarihi:</label>
      <input type="date" id="HospitalArrivalDate" name="HospitalArrivalDate" value={formData.HospitalArrivalDate} onChange={handleChange} />
    </div>
    <div className="form-group">
      <label htmlFor="BurnOccurrenceDate">Yanık Oluşma Tarihi:</label>
      <input type="date" id="BurnOccurrenceDate" name="BurnOccurrenceDate" value={formData.BurnOccurrenceDate} onChange={handleChange} />
    </div>
  </div>

  <div className="form-group">
    <label htmlFor="photoFile">Yanık Fotoğrafı:</label>
    <input type="file" id="photoFile" name="photoFile" accept="image/*" onChange={handlePhotoChange} />
  </div>

  {photoPreview && (
    <div className="photo-preview">
      <img src={photoPreview} alt="Önizleme" />
    </div>
  )}

  <button type="submit" disabled={isSubmitting}>
    {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
  </button>
</form>

    </div> 
    </div>
  );
};

export default BurnForm;