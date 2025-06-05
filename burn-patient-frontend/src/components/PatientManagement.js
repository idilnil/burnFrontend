// PatientManagement.js dosyanızın SON ve DOĞRU hali

import React, { useEffect, useState } from "react";
import { PatientList } from "./PatientList";
import axios from "axios";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function PatientManagement() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5005/api/Patient");
      setPatients(response.data);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("Hastalar yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id, updatedData) => {
    if (!id) {
      toast.error("Güncellenecek hasta ID'si bulunamadı.");
      return;
    }

    const formData = new FormData();
    for (const key in updatedData) {
      const value = updatedData[key];
      if (value !== null && value !== undefined) {
        // FormData'ya eklerken backend'in beklediği PascalCase anahtarları kullanıyoruz.
        // Bu kısım doğru.
        formData.append(key, value);
      }
    }

    try {
      await axios.put(`http://localhost:5005/api/Patient/${id}`, formData);
      alert("Hasta başarıyla güncellendi.");

      // ARAYÜZ GÜNCELLEME DÜZELTMESİ:
      // API'den gelen verideki ID "patientID" (camelCase) olduğu için
      // karşılaştırmayı bu şekilde yapıyoruz.
      setPatients(prevPatients =>
        prevPatients.map(patient =>
          patient.patientID === id ? { ...patient, ...updatedData } : patient
        )
      );
    } catch (error) {
      console.error("Error updating patient:", error.response?.data || error.message);
      toast.error("Hasta güncellenirken bir hata oluştu.");
      throw error;
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5005/api/Patient/${id}`);
      toast.success("Hasta başarıyla silindi.");
      
      // ARAYÜZ GÜNCELLEME DÜZELTMESİ:
      // Silme sonrası listeyi filtrelerken doğru (camelCase) ID ismini kullanıyoruz.
      setPatients((prev) => prev.filter((patient) => patient.patientID !== id));

    } catch (error) {
      console.error("Error deleting patient:", error);
      alert("Hasta silinemez çünkü randevusu var.");
    }
  };

  if (loading) {
      return <div className="container mx-auto p-6 text-center">Hastalar Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <PatientList patients={patients} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  );
}