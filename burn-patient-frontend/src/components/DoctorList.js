import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getDoctors, updateDoctor } from '../services/doctorService'; // Varsayılan import yolu
import { FaEdit, FaTrash } from 'react-icons/fa';


const DoctorList = ({ onDelete, onEdit }) => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [isTableVisible, setIsTableVisible] = useState(false);

  const adminID = localStorage.getItem("adminID") || "defaultAdminID";

  // Stil tanımlamaları için useEffect
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      /* Genel Sayfa ve Container Stilleri */
      .patient-list-page-wrapper {
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        background-color: #ecf0f1;
        min-height: 100vh;
      }
      .patient-list-container {
        padding: 20px;
        background-color: #fff;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        width: 100%;
        max-width: 900px;
        margin-top: 20px;
        min-height: 250px; 
        display: flex; 
        flex-direction: column;
      }
      .patient-list-container h1 {
        text-align: center;
        color: #333;
        margin-bottom: 25px;
        font-size: 1.8em;
      }
      /* DoctorList'e özel Filtre Butonları Stilleri */
      .doctor-filter-button-container {
        display: flex;
        flex-direction: column;
        align-items: center; 
        gap: 15px; 
        margin-bottom: 20px;
        width: 100%;
        max-width: 400px;
      }
      .doctor-filter-button {
        display: block;
        width: 400px;
        margin: 0 auto 20px auto;
        padding: 10px 20px;
        background-color: #7ba9db; 
        color: white;
        font-weight: bold;
        border: none;
        border-radius: 8px;
        text-align: center;
        cursor: pointer;
        transition: background-color 0.3s ease;
      }
      .doctor-filter-button:hover {
        background-color: #5e8bb4;
      }

      /* Düzenleme Formu Stilleri */
      .edit-patient-form-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0, 0, 0, 0.5); display: flex;
        justify-content: center; align-items: center; z-index: 1000;
      }
      .edit-patient-form {
        background-color: #fff; padding: 25px; border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3); width: 100%; max-width: 450px;
      }
      .edit-patient-form h2 { text-align: center; margin-bottom: 20px; font-size: 1.5em; color: #333; }
      .edit-patient-form .form-group { margin-bottom: 15px; }
      .edit-patient-form .form-group label { display: block; margin-bottom: 5px; font-weight: 500; color: #555; }
      .edit-patient-form .form-group input,
      .edit-patient-form .form-group select {
        width: 100%; padding: 8px 10px; border: 1px solid #ccc;
        border-radius: 4px; font-size: 0.95em;
      }
      .edit-patient-form .form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
      .edit-patient-form .form-actions button {
        padding: 8px 15px; border: none; border-radius: 4px;
        color: white; cursor: pointer; font-weight: 500;
      }
      .edit-patient-form .save-button { background-color: #28a745; }
      .edit-patient-form .cancel-button { background-color: #dc3545; }

      /* Tablo Stilleri */
      .patients-table-wrapper {
        overflow-x: auto; /* Yatay kaydırma için */
        width: 100%;
      }
      .patients-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
        background-color: #fff;
      }
      .patients-table th, .patients-table td {
        border: 1px solid #e0e0e0;
        padding: 10px 12px;
        text-align: left;
        font-size: 0.9em;
        vertical-align: middle;
      }
      .patients-table th {
        background-color: #7ba9db;
        color: white;
        font-weight: 600;
        white-space: nowrap; /* Başlıkların tek satırda kalması genellikle tercih edilir */
      }
      .patients-table tbody tr:nth-child(even) {
        background-color: #f9f9f9;
      }
      .patients-table tbody tr:hover {
        background-color: #e9ecef;
      }
      .patients-table .action-buttons {
        display: flex;
        justify-content: center;
        gap: 8px;
      }
      .patients-table .action-button {
        padding: 5px 8px;
        border: none;
        border-radius: 4px;
        color: white;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .patients-table .edit-btn { background-color: #5bc0de; }
      .patients-table .delete-btn { background-color: #d9534f; }
      
      .no-patients-message {
        text-align: center;
        padding: 20px;
        font-size: 1.1em;
        color: #777;
        margin-top: auto; 
        margin-bottom: auto;
        width: 100%;
      }

      /* Mobil Uyum */
      @media (max-width: 700px) {
        .patient-list-container { padding: 15px; margin-top: 15px; min-height: 200px; }
        .patient-list-container h1 { font-size: 1.5em; margin-bottom: 20px; }
        .doctor-filter-button-container { max-width: 90%; }
        .doctor-filter-button { font-size: 0.9em; padding: 8px 15px; }
        .edit-patient-form { max-width: 90%; padding: 20px; }
        
        /* Aşağıdaki kuralı güncelledik */
        .patients-table th { /* Başlıklar için nowrap kalabilir veya normal yapılabilir, tercihe bağlı */
          padding: 8px 10px; 
          font-size: 0.85em; 
          white-space: nowrap; /* Başlıklar tek satırda kalsın */
        }
        .patients-table td { /* Veri hücreleri için metin kaydırmaya izin ver */
          padding: 8px 10px; 
          font-size: 0.85em; 
          white-space: normal; /* CHANGED: Metnin alt satıra kaymasına izin ver */
          word-break: break-word; /* Ekstra: Uzun kelimelerin taşmasını engellemek için eklenebilir */
        }

        .patients-table .action-button { padding: 4px 6px; }
      }
       @media (max-width: 700px) { /* Bu blok yukarıdaki ile birleştirilebilir, şimdilik ayrı tuttum */
          .edit-patient-form .form-group label { font-size: 0.9em; }
          .edit-patient-form .form-group input,
          .edit-patient-form .form-group select { font-size: 0.9em; padding: 6px 8px; }
          .edit-patient-form .form-actions button { padding: 6px 10px; font-size: 0.9em; }
       }
    `;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // ... (geri kalan component kodu aynı)
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await getDoctors(adminID);
        setDoctors(response.data);
      } catch (error) {
        console.error('Doktorlar alınırken hata oluştu:', error);
        // toast.error('Doktorlar alınırken bir hata oluştu.');
      }
    };

    if (adminID) {
        fetchDoctors();
    }
  }, [adminID]);

  const showApprovedDoctors = () => {
    setFilteredDoctors(doctors.filter(doctor => doctor.verified === true));
    setIsTableVisible(true);
  };

  const showPendingDoctors = () => {
    setFilteredDoctors(doctors.filter(doctor => doctor.verified === false));
    setIsTableVisible(true);
  };

  return (
    <div className="patient-list-page-wrapper">
      <div className="doctor-filter-button-container">
        <button
          className="doctor-filter-button"
          onClick={showApprovedDoctors}
        >
          Onaylı Doktorlar
        </button>
        <button
          className="doctor-filter-button"
          onClick={showPendingDoctors}
        >
          Onay Bekleyen Doktorlar
        </button>
      </div>

      <div className="patient-list-container">
        {isTableVisible && (
          <div className="patients-table-wrapper">
            <table className="patients-table">
              <thead>
                <tr>
                  <th>Adı</th>
                  <th>E-posta</th>
                  <th>Onay Durumu</th>
                  <th>Aksiyonlar</th>
                </tr>
              </thead>
              <tbody>
                {filteredDoctors.length > 0 ? (
                  filteredDoctors.map((doctor) => (
                    <tr key={doctor.doctorID}>
                      <td>{doctor.name}</td>
                      <td>{doctor.email}</td>
                      <td>{doctor.verified ? 'Onaylı' : 'Onay Bekliyor'}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => onEdit(doctor)}
                            className="action-button edit-btn"
                            title="Düzenle"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => onDelete(doctor.doctorID)}
                            className="action-button delete-btn"
                            title="Sil"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="no-patients-message"> 
                      {doctors.length > 0 ? "Seçili filtreye uygun doktor bulunamadı." : "Hiç doktor bulunamadı."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {!isTableVisible && doctors.length > 0 && (
            <p className="no-patients-message">Doktorları listelemek için lütfen bir filtre seçin.</p>
        )}
         {!isTableVisible && doctors.length === 0 && (
            <p className="no-patients-message">Sistemde kayıtlı doktor bulunmamaktadır.</p>
        )}
      </div>
    </div>
  );
};

export default DoctorList;