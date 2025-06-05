import React, { useState, useEffect } from "react"; // useEffect eklendi
import { FaEdit, FaTrash, FaArrowLeft } from "react-icons/fa"; // FaArrowLeft eklendi
import { useNavigate } from 'react-router-dom'; // Geri butonu için

export function PatientList({ patients, onEdit, onDelete }) {
  const [editingPatient, setEditingPatient] = useState(null);
  const navigate = useNavigate(); // useNavigate hook'u

  // Stil tanımlamaları için useEffect
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      /* Genel Sayfa ve Container Stilleri */
      .patient-list-page-wrapper { /* PatientSearch'teki .page-wrapper gibi */
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        background-color: #ecf0f1; /* Sayfa arkaplanı */
        min-height: 100vh;
      }
      .patient-list-container { /* PatientSearch'teki .patient-search-container gibi */
        padding: 20px;
        background-color: #fff; /* Kart arkaplanı */
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        width: 100%;
        max-width: 900px; /* Tablo için uygun bir genişlik */
        margin-top: 20px; /* Başlık veya geri butonu sonrası boşluk */
      }
      .patient-list-container h1 {
        text-align: center;
        color: #333;
        margin-bottom: 25px;
        font-size: 1.8em;
      }
      .patient-list-back-button { /* PatientSearch'teki .back-button gibi */
        align-self: flex-start; /* Sayfanın soluna yasla */
        background-color: #7ba9db;
        color: white;
        border: none;
        padding: 10px 15px;
        font-size: 1em;
        border-radius: 6px;
        cursor: pointer;
        margin-bottom: 20px; /* Container ile arasında boşluk */
        display: inline-flex;
        align-items: center;
        gap: 5px;
        width: 20%;
      }
      .patient-list-back-button:hover {
        background-color: #5e8bb4;
      }

      /* Düzenleme Formu Stilleri */
      .edit-patient-form-overlay { /* Form için overlay */
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }
      .edit-patient-form {
        background-color: #fff;
        padding: 25px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        width: 100%;
        max-width: 450px; /* Form genişliği */
      }
      .edit-patient-form h2 {
        text-align: center;
        margin-bottom: 20px;
        font-size: 1.5em;
        color: #333;
      }
      .edit-patient-form .form-group {
        margin-bottom: 15px;
      }
      .edit-patient-form .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: #555;
      }
      .edit-patient-form .form-group input,
      .edit-patient-form .form-group select {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 0.95em;
      }
      .edit-patient-form .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
      }
      .edit-patient-form .form-actions button {
        padding: 8px 15px;
        border: none;
        border-radius: 4px;
        color: white;
        cursor: pointer;
        font-weight: 500;
      }
      .edit-patient-form .save-button { background-color: #28a745; }
      .edit-patient-form .cancel-button { background-color: #dc3545; }

      /* Tablo Stilleri (PatientSearch'e benzer) */
      .patients-table-wrapper { /* Mobil için kaydırma sarmalayıcısı */
        overflow-x: auto;
        width: 100%;
      }
      .patients-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
        background-color: #fff;
        /* box-shadow: 0 1px 3px rgba(0,0,0,0.1); */ /* Container'da zaten var */
      }
      .patients-table th, .patients-table td {
        border: 1px solid #e0e0e0;
        padding: 10px 12px; /* Padding'i biraz azalttık */
        text-align: left;
        font-size: 0.9em; /* Fontu biraz küçülttük */
        vertical-align: middle;
      }
      .patients-table th {
        background-color: #7ba9db; /* PatientSearch'teki gibi */
        color: white;
        font-weight: 600;
        white-space: nowrap;
      }
      .patients-table tbody tr:nth-child(even) {
        background-color: #f9f9f9;
      }
      .patients-table tbody tr:hover {
        background-color: #e9ecef;
      }
      .patients-table .action-buttons {
        display: flex;
        justify-content: center; /* Butonları ortala */
        gap: 8px;
      }
      .patients-table .action-button {
        padding: 5px 8px; /* Buton boyutunu küçülttük */
        border: none;
        border-radius: 4px;
        color: white;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .patients-table .edit-btn { background-color: #5bc0de; } /* Görüntüle rengi */
      .patients-table .delete-btn { background-color: #d9534f; } /* Sil rengi */
      .no-patients-message {
        text-align: center;
        padding: 20px;
        font-size: 1.1em;
        color: #777;
      }

      /* Mobil Uyum */
      @media (max-width: 768px) {
        .patient-list-container {
          padding: 15px;
          margin-top: 15px;
        }
        .patient-list-container h1 {
          font-size: 1.5em;
          margin-bottom: 20px;
        }
        .patient-list-back-button {
          padding: 8px 12px;
          font-size: 0.9em;
          margin-bottom: 15px;
        }
        .edit-patient-form {
            max-width: 90%;
            padding: 20px;
        }
        .patients-table th, .patients-table td {
          padding: 8px 10px;
          font-size: 0.85em;
          white-space: nowrap; /* Mobil için önemli */
        }
        .patients-table .action-button {
          padding: 4px 6px; /* Mobil için butonları daha da küçült */
        }
      }
       @media (max-width: 700px) {
          .edit-patient-form .form-group label {
            font-size: 0.9em;
          }
          .edit-patient-form .form-group input,
          .edit-patient-form .form-group select {
            font-size: 0.9em;
            padding: 6px 8px;
          }
          .edit-patient-form .form-actions button {
            padding: 6px 10px;
            font-size: 0.9em;
          }
       }
    `;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);


  const startEdit = (patient) => {
    if (!patient || !patient.patientID) {
      console.error("Hasta bilgisi eksik:", patient);
      alert("Düzenlenecek bir hasta seçilemedi.");
      return;
    }
    setEditingPatient({ ...patient });
    // window.scrollTo({ top: 0, behavior: "smooth" }); // Overlay varken bu gereksiz
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Tarih alanları için özel kontrol (boş gelirse null yapabilir veya olduğu gibi bırakabiliriz)
    // const val = type === 'date' && value === '' ? null : value;
    setEditingPatient((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveEdit = async () => {
    if (!editingPatient || !editingPatient.patientID) {
      alert("Geçerli bir hasta seçilmedi.");
      return;
    }
    try {
      await onEdit(editingPatient.patientID, editingPatient);
      setEditingPatient(null);
    } catch (error) {
      console.error("Error updating patient:", error);
      alert("Hasta güncellenirken bir hata oluştu.");
    }
  };

  const cancelEdit = () => {
    setEditingPatient(null);
  };

  const handleDelete = (id, name) => { // Hasta adını da alalım
    const isConfirmed = window.confirm(`"${name}" adlı hastayı silmek istediğinize emin misiniz?`);
    if (isConfirmed) {
      onDelete(id);
    }
  };

  // Tarih formatını YYYY-MM-DD'ye çevir
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (e) {
      return "";
    }
  };


  return (
    <div className="patient-list-page-wrapper">
      <button onClick={() => navigate(-1)} className="patient-list-back-button">
        <FaArrowLeft /> Geri Dön
      </button>
      <div className="patient-list-container">
        <h1>Hasta Yönetimi</h1>

        {/* Düzenleme Formu (Modal/Overlay içinde) */}
        {editingPatient && (
          <div className="edit-patient-form-overlay" onClick={cancelEdit}> {/* Overlay'a tıklayınca kapat */}
            <div className="edit-patient-form" onClick={(e) => e.stopPropagation()}> {/* Formun içine tıklayınca kapanmasın */}
              <h2>Hastayı Düzenle</h2>
              <div className="form-group">
                <label htmlFor="name">Adı Soyadı</label>
                <input type="text" id="name" name="name" value={editingPatient.name || ""} onChange={handleInputChange} placeholder="Adı Soyadı" />
              </div>
              <div className="form-group">
                <label htmlFor="age">Yaş</label>
                <input type="number" id="age" name="age" value={editingPatient.age || ""} onChange={handleInputChange} placeholder="Yaşı" />
              </div>
              <div className="form-group">
                <label htmlFor="gender">Cinsiyet</label>
                <select id="gender" name="gender" value={editingPatient.gender || ""} onChange={handleInputChange}>
                  <option value="">Seçiniz...</option>
                  <option value="Erkek">Erkek</option>
                  <option value="Kadın">Kadın</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="medicalHistory">Tıbbi Geçmiş</label>
                <input type="text" id="medicalHistory" name="medicalHistory" value={editingPatient.medicalHistory || ""} onChange={handleInputChange} placeholder="Tıbbi Geçmiş" />
              </div>
              <div className="form-group">
                <label htmlFor="burnCause">Yanık Nedeni</label>
                <input type="text" id="burnCause" name="burnCause" value={editingPatient.burnCause || ""} onChange={handleInputChange} placeholder="Yanık Nedeni" />
              </div>
              <div className="form-group">
                <label htmlFor="hospitalArrivalDate">Hastaneye Geliş</label>
                <input type="date" id="hospitalArrivalDate" name="hospitalArrivalDate" value={formatDateForInput(editingPatient.hospitalArrivalDate)} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label htmlFor="burnOccurrenceDate">Yanık Oluşma</label>
                <input type="date" id="burnOccurrenceDate" name="burnOccurrenceDate" value={formatDateForInput(editingPatient.burnOccurrenceDate)} onChange={handleInputChange} />
              </div>
              {/* photoPath ve burnDepth için şimdilik input bıraktım, ileride dosya yükleme vs. eklenebilir */}
              <div className="form-group">
                <label htmlFor="photoPath">Fotoğraf Yolu (URL)</label>
                <input type="text" id="photoPath" name="photoPath" value={editingPatient.photoPath || ""} onChange={handleInputChange} placeholder="Fotoğraf Adresi" />
              </div>
               <div className="form-group">
                <label htmlFor="burnDepth">Yanık Derinliği</label>
                <input type="text" id="burnDepth" name="burnDepth" value={editingPatient.burnDepth || ""} onChange={handleInputChange} placeholder="Yanık Derinliği" />
              </div>

              <div className="form-actions">
                <button onClick={saveEdit} className="save-button">Kaydet</button>
                <button onClick={cancelEdit} className="cancel-button">İptal</button>
              </div>
            </div>
          </div>
        )}

        {/* Hasta Listesi Tablosu */}
        <div className="patients-table-wrapper">
          <table className="patients-table">
            <thead>
              <tr>
                <th>Adı Soyadı</th>
                <th>Yaş</th>
                <th>Cinsiyet</th>
                <th>Aksiyonlar</th>
              </tr>
            </thead>
            <tbody>
              {patients.length > 0 ? (
                patients.map((patient) => (
                  <tr key={patient.patientID}>
                    <td>{patient.name}</td>
                    <td>{patient.age}</td>
                    <td>{patient.gender}</td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={() => startEdit(patient)} className="action-button edit-btn" title="Düzenle"><FaEdit /></button>
                        <button onClick={() => handleDelete(patient.patientID, patient.name)} className="action-button delete-btn" title="Sil"><FaTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-patients-message">Hiç hasta bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}