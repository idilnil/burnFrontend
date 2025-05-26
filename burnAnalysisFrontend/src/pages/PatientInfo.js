import React, { useState, useRef } from "react";
import axios from "axios";
import "./BurnForm.css"; // CSS dosyanızın var olduğundan emin olun

const BurnForm = () => {
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
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

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
      submissionData.append("photo", photoFile); // Backend'deki AddPatient parametresi: photoFile diyodu ama photo!! photo olarak değiştirdim!
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

  return (
    <div className="burn-form-container">
      <h2>Yanık Formu</h2>
      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="Name">Hastanın Adı:</label>
          <input type="text" id="Name" name="Name" value={formData.Name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="Email">Hastanın E-posta Adresi:</label>
          <input type="email" id="Email" name="Email" value={formData.Email} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="Age">Yaşı:</label>
          <input type="number" id="Age" name="Age" value={formData.Age} onChange={handleChange} required min="0" max="120" />
        </div>
        <div className="form-group">
          <label htmlFor="HeightCm">Boy (cm):</label>
          <input
            type="number"
            id="HeightCm"
            name="HeightCm"
            value={formData.HeightCm}
            onChange={handleChange}
            min="10"
            max="230" // Modelinizdeki Range(10, 230) ile uyumlu
            step="0.1"
          />
        </div>
        <div className="form-group">
          <label htmlFor="WeightKg">Kilo (kg):</label>
          <input
            type="number"
            id="WeightKg"
            name="WeightKg"
            value={formData.WeightKg}
            onChange={handleChange}
            min="1"
            max="200" // Modelinizdeki Range(1, 200) ile uyumlu
            step="0.1"
          />
        </div>
        <div className="form-group">
          <label htmlFor="Gender">Cinsiyeti:</label>
          <select id="Gender" name="Gender" value={formData.Gender} onChange={handleChange} required>
            <option value="">Seçiniz</option>
            <option value="Erkek">Erkek</option>
            <option value="Kadın">Kadın</option>
            <option value="Diğer">Diğer</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="BurnCause">Yanık Nedeni:</label>
          <select id="BurnCause" name="BurnCause" value={formData.BurnCause} onChange={handleChange} required>
            <option value="">Seçiniz</option>
            {burnCauses.map((cause, index) => (
              <option key={`cause-${index}`} value={cause}>{cause}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="BurnArea">Yanık Bölgesi:</label>
          <select id="BurnArea" name="BurnArea" value={formData.BurnArea} onChange={handleChange} required>
            <option value="">Seçiniz</option>
            {burnAreas.map((area, index) => (
              <option key={`area-${index}`} value={area}>{area}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="HospitalArrivalDate">Hastaneye Gelme Tarihi:</label>
          <input type="date" id="HospitalArrivalDate" name="HospitalArrivalDate" value={formData.HospitalArrivalDate} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="BurnOccurrenceDate">Yanık Oluşma Tarihi:</label>
          <input type="date" id="BurnOccurrenceDate" name="BurnOccurrenceDate" value={formData.BurnOccurrenceDate} onChange={handleChange} />
        </div>
        {/* Eğer backend ayrı bir BurnOccurrenceTime işlemiyorsa bu inputa gerek yok.
            Modelinizde BurnOccurrenceDate (DateTime?) var. Saat bilgisi girilirse
            ve backend bunu anlarsa, tarihle birleştirilebilir. Şimdilik gizli.
        <div className="form-group">
          <label htmlFor="burnOccurrenceTime">Yanık Oluşma Saati:</label>
          <input type="time" id="burnOccurrenceTime" name="burnOccurrenceTime" value={formData.burnOccurrenceTime} onChange={handleChange} />
        </div>
        */}
        <div className="form-group">
          <div className="form-group">
  <label htmlFor="photoFile">Yanık Fotoğrafı:</label>
  
  {/* Normal dosya seçme */}
  <input
    type="file"
    id="photoFile"
    name="photoFile"
    accept="image/*"
    onChange={handlePhotoChange}
    style={{ display: "none" }}
    ref={(ref) => (fileInputRef.current = ref)}
  />

  {/* Kamera ile çekme */}
  <input
    type="file"
    id="photoFile" //bu dosya yüklemede vardı buraya da ben yazdım foto çekilince dosya olarak kaydetsin diye???
    accept="image/*"
    capture="environment"
    onChange={handlePhotoChange}
    style={{ display: "none" }}
    ref={(ref) => (cameraInputRef.current = ref)}
  />

  <div style={{ display: "flex", gap: "10px" }}>
    <button
      type="button"
      onClick={() => fileInputRef.current.click()}
      className="photoupload-button"
    >
      📁 Dosya Seç
    </button>
    <button
      type="button"
      onClick={() => cameraInputRef.current.click()}
      className="photoupload-button"
    >
      📷 Fotoğraf Çek
    </button>
  </div>
</div>

        </div>
        {photoPreview && <div className="photo-preview"><img src={photoPreview} alt="Önizleme" /></div>}
        <div className="form-group">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Gönderiliyor..." : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BurnForm;