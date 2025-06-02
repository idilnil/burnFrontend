import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const PatientEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null); // Başlangıçta null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialPatient, setInitialPatient] = useState(null);


  const genderOptions = ["Erkek", "Kadın", "Diğer", "Belirtmek İstemiyor"];
  const burnCauses = [
    "Isı ile", "Işın ile", "Elektrik nedeniyle", "Sürtünmeye bağlı",
    "Donma sonucu oluşan", "Asit ve alkali madde teması", "Diğer"
  ];
  const burnAreas = [ 
    "Baş", "Boyun", "Göğüs", "Karın", "Sırt", "Kalça", "Genital Bölge",
    "Sağ Kol", "Sol Kol", "Sağ El", "Sol El", "Sağ Bacak", "Sol Bacak",
    "Sağ Ayak", "Sol Ayak", "Birden Fazla Bölge", "Diğer"
  ];


  useEffect(() => {
    const fetchPatient = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://localhost:5005/api/Patient/${id}`);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Hasta bilgileri alınamadı: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        
        const formattedData = { ...data };
        if (formattedData.hospitalArrivalDate) {
          formattedData.hospitalArrivalDate = new Date(formattedData.hospitalArrivalDate).toISOString().split('T')[0];
        }
        if (formattedData.burnOccurrenceDate) {
          formattedData.burnOccurrenceDate = new Date(formattedData.burnOccurrenceDate).toISOString().split('T')[0];
        }
        // State'e atarken backend modelindeki property adlarını (PascalCase) kullanalım
        // veya handleChange'de kullandığımız camelCase anahtarları kullanalım ve payload'da dönüştürelim.
        // Şimdilik handleChange'deki gibi camelCase ile devam edelim, payload'da dönüştüreceğiz.
        setPatient(formattedData); 
        setInitialPatient(JSON.parse(JSON.stringify(formattedData)));
      } catch (err) {
        console.error("Hasta bilgisi alınırken hata:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPatient();
    } else {
      navigate("/patient-search"); 
    }
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target; // type ve checked'e şimdilik gerek yok
    setPatient(prevPatient => ({
      ...prevPatient,
      [name]: value // Input name'leri state anahtarlarıyla (name, gender vb.) eşleşmeli
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!patient) return;

    // Frontend validasyonu
    if (!patient.name || patient.name.trim() === "") {
        alert("Hasta adı boş bırakılamaz.");
        return;
    }
    if (!patient.gender || patient.gender.trim() === "") {
        alert("Cinsiyet seçimi zorunludur.");
        return;
    }
    if (!patient.age || parseInt(patient.age, 10) < 0 || parseInt(patient.age, 10) > 120) {
        alert("Geçerli bir yaş giriniz (0-120).");
        return;
    }


    // Backend modelindeki property adlarıyla (PascalCase) eşleşen bir payload oluştur.
    const payload = {
        PatientID: parseInt(id, 10),
        Name: patient.name,
        Email: patient.email,
        Age: patient.age ? parseInt(patient.age, 10) : 0,
        Gender: patient.gender,
        MedicalHistory: patient.medicalHistory,
        BurnCause: patient.burnCause,
        BurnArea: patient.burnArea,
        HospitalArrivalDate: patient.hospitalArrivalDate ? new Date(patient.hospitalArrivalDate).toISOString() : null,
        BurnOccurrenceDate: patient.burnOccurrenceDate ? new Date(patient.burnOccurrenceDate).toISOString() : null,
        PhotoPath: patient.photoPath, // Bu endpoint fotoğraf güncellemiyor, mevcut path'i gönderiyoruz
        BurnDepth: patient.burnDepth,
        BurnPercentage: patient.burnPercentage ? parseFloat(patient.burnPercentage) : null,
        BurnSizeCm2: patient.burnSizeCm2 ? parseFloat(patient.burnSizeCm2) : null,
        AudioPath: patient.audioPath, // Bu endpoint ses güncellemiyor
        ReminderSent: patient.reminderSent, // Bu alanlar formda yoksa backend'deki değeri korur
        Verified: patient.verified,         // veya backend'den gelen son değeri gönderir.
        Trained: patient.trained,           // Formda inputları yoksa, bu değerler değişmez.
        HeightCm: patient.heightCm ? parseFloat(patient.heightCm) : null,
        WeightKg: patient.weightKg ? parseFloat(patient.weightKg) : null,
    };
    
    console.log("Kaydedilecek hasta verisi (payload):", JSON.stringify(payload));

    try {
      const response = await fetch(`http://localhost:5005/api/Patient/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(async () => ({ message: await response.text() || "Bilinmeyen sunucu hatası" }));
        console.error("Güncelleme hatası response:", errorData);
        let errorMessage = "Hasta bilgileri güncellenemedi.";
        if (errorData.errors) { // ASP.NET Core ModelState hataları
            errorMessage += ":\n" + Object.entries(errorData.errors).map(([key, messages]) => `${key}: ${messages.join(", ")}`).join("\n");
        } else if (errorData.title) { // ASP.NET Core ProblemDetails
            errorMessage = `${errorData.title}${errorData.detail ? ` (${errorData.detail})` : ''}`;
        } else if (errorData.message) {
            errorMessage = errorData.message;
        } else if (typeof errorData === 'string') {
            errorMessage = errorData;
        }
        throw new Error(errorMessage);
      }
      alert("Hasta bilgileri başarıyla güncellendi.");
      navigate("/patient-search"); 
    } catch (err) {
      console.error("Hasta bilgilerini kaydederken hata:", err);
      alert(`Bir hata oluştu: ${err.message}`);
    }
  };

  // ... (handleCancel ve JSX aynı, inputların name'leri state ile uyumlu olmalı: name, email, age, gender vb.)
  const handleCancel = () => {
    const patientString = JSON.stringify(patient);
    const initialPatientString = JSON.stringify(initialPatient);

    if (patientString !== initialPatientString) {
      if (window.confirm("Kaydedilmemiş değişiklikleriniz var. Yine de çıkmak istiyor musunuz?")) {
        navigate("/doctor-dashboard");
      }
    } else {
      navigate("/doctor-dashboard");
    }
};

  if (loading) return <div style={styles.centered}>Yükleniyor...</div>;
  if (error) return <div style={{ ...styles.centered, color: 'red' }}>Hata: {error}</div>;
  if (!patient) return <div style={styles.centered}>Hasta bulunamadı veya yüklenemedi.</div>;

  return (
    <div style={styles.container}>
      <h2>Hasta Bilgilerini Düzenle - ID: {patient.patientID}</h2>
      <form onSubmit={handleSave} style={styles.form}>
        <label htmlFor="name" style={styles.label}>Ad Soyad:</label>
        <input id="name" name="name" type="text" value={patient.name || ""} onChange={handleChange} style={styles.input} required />

        <label htmlFor="email" style={styles.label}>E-posta:</label>
        <input id="email" name="email" type="email" value={patient.email || ""} onChange={handleChange} style={styles.input} />

        <label htmlFor="age" style={styles.label}>Yaş:</label>
        <input id="age" name="age" type="number" value={patient.age || ""} onChange={handleChange} style={styles.input} required min="0" max="120" />

        <label htmlFor="gender" style={styles.label}>Cinsiyet:</label>
        <select id="gender" name="gender" value={patient.gender || ""} onChange={handleChange} style={styles.input} required>
          <option value="">Seçiniz...</option>
          {genderOptions.map(option => <option key={option} value={option}>{option}</option>)}
        </select>

        <label htmlFor="heightCm" style={styles.label}>Boy (cm):</label>
        <input id="heightCm" name="heightCm" type="number" value={patient.heightCm || ""} onChange={handleChange} style={styles.input} step="0.1" min="10" max="250" />

        <label htmlFor="weightKg" style={styles.label}>Kilo (kg):</label>
        <input id="weightKg" name="weightKg" type="number" value={patient.weightKg || ""} onChange={handleChange} style={styles.input} step="0.1" min="1" max="300" />
        
        <label htmlFor="medicalHistory" style={styles.label}>Tıbbi Geçmiş:</label>
        <textarea id="medicalHistory" name="medicalHistory" value={patient.medicalHistory || ""} onChange={handleChange} style={styles.textarea} />

        <label htmlFor="burnCause" style={styles.label}>Yanık Nedeni:</label>
        <select id="burnCause" name="burnCause" value={patient.burnCause || ""} onChange={handleChange} style={styles.input}>
            <option value="">Seçiniz...</option>
            {burnCauses.map(cause => <option key={cause} value={cause}>{cause}</option>)}
        </select>

        <label htmlFor="burnArea" style={styles.label}>Yanık Bölgesi:</label>
         <select id="burnArea" name="burnArea" value={patient.burnArea || ""} onChange={handleChange} style={styles.input}>
            <option value="">Seçiniz...</option>
            {burnAreas.map(area => <option key={area} value={area}>{area}</option>)}
        </select>

        <label htmlFor="hospitalArrivalDate" style={styles.label}>Hastaneye Geliş Tarihi:</label>
        <input id="hospitalArrivalDate" name="hospitalArrivalDate" type="date" value={patient.hospitalArrivalDate || ""} onChange={handleChange} style={styles.input} />

        <label htmlFor="burnOccurrenceDate" style={styles.label}>Yanık Oluşma Tarihi:</label>
        <input id="burnOccurrenceDate" name="burnOccurrenceDate" type="date" value={patient.burnOccurrenceDate || ""} onChange={handleChange} style={styles.input} />
        
        <label htmlFor="burnDepth" style={styles.label}>Yanık Derinliği:</label>
        <input id="burnDepth" name="burnDepth" type="text" value={patient.burnDepth || ""} onChange={handleChange} style={styles.input} />
        
        <label htmlFor="burnPercentage" style={styles.label}>Yanık Yüzdesi (%):</label>
        <input id="burnPercentage" name="burnPercentage" type="number" value={patient.burnPercentage || ""} onChange={handleChange} style={styles.input} step="0.1" min="0" max="100" />

        <label htmlFor="burnSizeCm2" style={styles.label}>Yanık Alanı (cm²):</label>
        <input id="burnSizeCm2" name="burnSizeCm2" type="number" value={patient.burnSizeCm2 || ""} onChange={handleChange} style={styles.input} step="0.1" min="0" /> {/* Max kaldırıldı */}

        <div style={styles.buttonContainer}>
          <button type="submit" style={styles.saveButton}>
            Değişiklikleri Kaydet
          </button>
          <button type="button" onClick={handleCancel} style={styles.cancelButton}>
            İptal
          </button>
        </div>
      </form>
    </div>
  );
};

// ... (styles objesi aynı kalacak) ...
const styles = {
  container: { display: "flex", flexDirection: "column", alignItems: "center", padding: "20px", backgroundColor: "#f4f7f6", minHeight: "calc(100vh - 40px)" },
  centered: { textAlign: "center", fontSize: "16px", marginTop: "40px"  },
  form: { display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "550px", backgroundColor: "white", padding: "25px", borderRadius: "8px", boxShadow: "0 3px 6px rgba(0,0,0,0.1)" },
  label: { fontSize: "13px", fontWeight: "600", color: "#454545", marginBottom: "2px"  },
  input: { padding: "8px 10px", fontSize: "13px",    borderRadius: "4px", border: "1px solid #ced4da", boxSizing: "border-box", width: "100%" },
  textarea: { padding: "8px 10px",    fontSize: "13px",       borderRadius: "4px", border: "1px solid #ced4da", minHeight: "80px",     width: "100%", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical" },
  checkboxContainer: { display: "flex", alignItems: "center", gap: "6px", margin: "4px 0" },
  checkboxLabel: { fontSize: "13px", fontWeight: "normal", color: "#454545"},
  buttonContainer: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "15px", paddingTop: "12px", borderTop: "1px solid #eee" },
  saveButton: { backgroundColor: "#28a745", color: "white", padding: "8px 18px", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px",    fontWeight: "500" },
  cancelButton: { backgroundColor: "#6c757d", color: "white", padding: "8px 18px", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px",    fontWeight: "500" },
};
export default PatientEdit;