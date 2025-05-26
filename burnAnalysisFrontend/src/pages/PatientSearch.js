// PatientSearch.js
import React, { useEffect, useState } from "react";
import {
 
  FaAngleDoubleLeft,
  FaAngleLeft,
  FaAngleRight,
  FaAngleDoubleRight,
  FaEye,
  FaTrashAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom"; // Eğer useLocation kullanılmıyorsa sadece useNavigate kalsın
import "./PatientSearch.css";

const PatientSearch = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const navigate = useNavigate();

  // ... (useEffect fetchPatients ve filterPatients aynı kalır) ...
  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("http://localhost:5005/api/Patient");
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Hastalar alınırken bir hata oluştu: ${response.status} - ${errorData || response.statusText}`);
        }
        const data = await response.json();
        const validPatients = Array.isArray(data) ? data : [];
        setPatients(validPatients);
        setFilteredPatients(validPatients);
      } catch (error) {
        console.error("Fetch patients error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = patients.filter((patient) =>
      patient.name?.toLowerCase().includes(lowerSearchTerm) ||
      patient.patientID?.toString().includes(searchTerm)
    );
    setFilteredPatients(filtered);
    setCurrentPage(1); // Arama yapıldığında ilk sayfaya dön
  }, [searchTerm, patients]);


  const indexOfLastPatient = currentPage * recordsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - recordsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);

  const handleView = (patientId) => navigate(`/view-patient/${patientId}`);

  const handleDelete = async (patientId) => {
    const patientToDelete = patients.find(p => p.patientID === patientId);
    if (window.confirm(`"${patientToDelete?.name || 'Bu hasta'}" adlı hastayı silmek istediğinize emin misiniz?`)) {
      try {
        const response = await fetch(`http://localhost:5005/api/Patient/${patientId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Hasta silinirken bir hata oluştu: ${response.status} - ${errorData || response.statusText}`);
        }
        // Silme sonrası filteredPatients'ı da güncellemek önemli
        const updatedPatients = patients.filter((patient) => patient.patientID !== patientId);
        setPatients(updatedPatients);
        // setFilteredPatients(updatedFilteredPatients); // Bu satır yerine, searchTerm ve patients useEffect'i zaten filteredPatients'ı güncelleyecektir.

        // Eğer silinen kayıt son sayfadaki tek kayıtsa ve sayfa sayısı azalıyorsa,
        // mevcut sayfayı bir azaltmak gerekebilir.
        const newTotalPages = Math.ceil((filteredPatients.length - 1) / recordsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(newTotalPages);
        } else if (newTotalPages === 0) {
            setCurrentPage(1); // Hiç kayıt kalmazsa
        }


        alert("Hasta başarıyla silindi.");
      } catch (error) {
        console.error("Delete patient error:", error);
        setError(error.message);
        alert(`Hata: ${error.message}`);
      }
    }
  };

  const totalPages = Math.ceil(filteredPatients.length / recordsPerPage);

  // Sayfa değiştirme fonksiyonları
  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToLastPage = () => setCurrentPage(totalPages);


  return (
    <div className="patient-search-container">
      <h2>Hasta Kayıtları</h2>
      <div className="controls-container">
        <input
          type="text"
          placeholder="Hasta adına veya ID'ye göre ara"
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
         <div className="records-per-page-selector">
          <label htmlFor="recordsPerPage">Sayfa Başına Kayıt: </label>
          <select
            id="recordsPerPage"
            value={recordsPerPage}
            onChange={(e) => {
              setRecordsPerPage(parseInt(e.target.value));
              setCurrentPage(1); // Sayfa başına kayıt değiştiğinde ilk sayfaya dön
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={50}>50</option> {/* Daha fazla seçenek eklenebilir */}
          </select>
        </div>
      </div>

      {loading && <p className="loading-text">Yükleniyor...</p>}
      {error && <p className="error-text">{error}</p>}
      
      {!loading && !error && (
        <>
          <table className="patients-table">
            {/* ... (thead ve tbody aynı kalır) ... */}
             <thead>
              <tr>
                <th>ID</th>
                <th>Hasta Adı</th>
                <th>Yaş</th>
                <th>Cinsiyet</th>
                <th>Yanık Nedeni</th>
                <th>Hastaneye Geliş</th>
                <th>Yanık Oluşma</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {currentPatients.length > 0 ? (
                currentPatients.map((patient) => (
                  <tr key={patient.patientID}>
                    <td>{patient.patientID}</td>
                    <td>{patient.name}</td>
                    <td>{patient.age}</td>
                    <td>{patient.gender}</td>
                    <td>{patient.burnCause || "N/A"}</td>
                    <td>{patient.hospitalArrivalDate ? new Date(patient.hospitalArrivalDate).toLocaleDateString('tr-TR') : "N/A"}</td>
                    <td>{patient.burnOccurrenceDate ? new Date(patient.burnOccurrenceDate).toLocaleDateString('tr-TR') : "N/A"}</td>
                    <td>
                      <div className="action-button-group">
                        <button 
                          className="action-button view-button"
                          onClick={() => handleView(patient.patientID)}
                          title="Görüntüle"
                        >
                          <FaEye /> <span className="button-text">Görüntüle</span>
                        </button>
                        <button 
                          className="action-button delete-button"
                          onClick={() => handleDelete(patient.patientID)}
                          title="Sil"
                        >
                          <FaTrashAlt /> <span className="button-text">Sil</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="no-records-text">
                    {searchTerm ? "Aramanızla eşleşen hasta bulunamadı." : "Gösterilecek hasta kaydı yok."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

       

          {/* GÜNCELLENMİŞ PAGINATION */}
          {filteredPatients.length > recordsPerPage && totalPages > 1 && ( // BU KOŞULU KONTROL EDİN!
            <div className="pagination">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                aria-label="İlk Sayfa"
                className="pagination-button"
              >
                <FaAngleDoubleLeft />
              </button>
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                aria-label="Önceki Sayfa"
                className="pagination-button"
              >
                <FaAngleLeft />
              </button>
              <span className="page-info">
                Sayfa {totalPages > 0 ? currentPage : 0} / {totalPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                aria-label="Sonraki Sayfa"
                className="pagination-button"
              >
                <FaAngleRight />
              </button>
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                aria-label="Son Sayfa"
                className="pagination-button"
              >
                <FaAngleDoubleRight />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PatientSearch;