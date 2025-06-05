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
import { useNavigate } from "react-router-dom";

const PatientSearch = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const navigate = useNavigate();

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
    setCurrentPage(1);
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
        const updatedPatients = patients.filter((patient) => patient.patientID !== patientId);
        setPatients(updatedPatients);

        const newTotalPages = Math.ceil((filteredPatients.length - 1) / recordsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(newTotalPages);
        } else if (newTotalPages === 0) {
            setCurrentPage(1);
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

  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToLastPage = () => setCurrentPage(totalPages);

  useEffect(() => {
      const style = document.createElement("style");
      style.innerHTML = `
        html, body { /* Bu stiller genel olabilir, uygulamanızın yapısına göre düzenleyin */
          /* display: flex; */ /* Eğer sayfa içeriği body'nin %100'ünü kaplamıyorsa sorun yaratabilir */
          /* height: 100%; */
          margin: 0; /* Body margin'ini sıfırlamak iyi bir pratiktir */
          padding: 0; /* Body padding'ini sıfırlamak */
          background-color:  #ecf0f1;
          font-family: sans-serif;
          /* min-height: 100vh; */ /* İçeriğin az olduğu durumlarda bile ekranı kaplaması için */
        }

        .page-wrapper { /* Bu sınıfı component'in en dış sarmalayıcısı için kullanabilirsiniz */
          padding: 20px; /* Sayfa geneli için bir padding */
          display: flex;
          flex-direction: column;
          align-items: center; /* İçeriği ortalamak için */
          min-height: calc(100vh - 40px); /* Viewport yüksekliği eksi padding */
        }

        .patient-search-container {
          padding: 20px;
          background-color: #fff; /* Daha temiz bir görünüm için #ecf0f1 yerine #fff */
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); /* Daha yumuşak bir gölge */
          border-radius: 12px;
          width: 100%; /* Genişlik */
          max-width: 1200px; /* Maksimum genişlik */
          /* position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); */
          /* Yukarıdaki konumlandırma yerine .page-wrapper ile ortalama daha esnek olabilir */
          margin-top: 60px; /* Geri butonu için yer bırakabilir */
        }

        .patient-search-container h2 {
          text-align: center;
          color: #333;
          margin-top: 0; /* Container padding'i zaten var */
          margin-bottom: 25px;
          font-size: 1.8em;
        }

        .controls-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 10px 0; /* Sadece alt padding */
          /* background-color: #ecf0f1; */ /* Ana container ile aynı renk ise gereksiz */
          border-radius: 6px;
        }

        .search-input {
          padding: 10px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 1em;
          width: 40%; /* Masaüstü için */
          transition: border-color 0.2s ease-in-out;
          box-sizing: border-box;
        }

        .search-input:focus {
          border-color: #7ba9db; /* Tema rengiyle uyumlu */
          outline: none;
          box-shadow: 0 0 0 2px rgba(123, 169, 219, 0.25); /* Focus state için */
        }

        .records-per-page-selector {
          display: flex;
          align-items: center;
        }

        .records-per-page-selector label {
          margin-right: 8px;
          font-size: 0.9em;
          color: #555;
        }

        .records-per-page-selector select {
          padding: 9px 8px; /* Input ile aynı yükseklik için ince ayar */
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 0.9em;
          background-color: white;
        }

        /* TABLO İÇİN YATAY KAYDIRMA WRAPPER'I */
        .table-responsive-wrapper {
          /* Bu wrapper masaüstünde hiçbir etki yapmaz, sadece mobil için kullanılır */
        }

        .patients-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          background-color: #fff;
          /* box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); */ /* Wrapper'da zaten var */
          /* border-radius: 6px; */ /* Wrapper'a taşınabilir veya gerekmiyorsa kaldırılabilir */
          /* overflow: hidden; */ /* Bu artık .table-responsive-wrapper tarafından yönetilecek */
        }

        .patients-table th, .patients-table td {
          border: 1px solid #e0e0e0;
          padding: 12px 15px;
          text-align: left;
          font-size: 0.95em;
          vertical-align: middle; /* İçeriği dikeyde ortala */
        }

        .patients-table th {
          background-color: #7ba9db;
          color: white;
          font-weight: 600;
          white-space: nowrap; /* Başlıkların kırılmamasını sağlar */
        }

        .patients-table tbody tr:nth-child(even) {
          background-color: #f9f9f9;
        }

        .patients-table tbody tr:hover {
          background-color: #e9ecef;
        }

        .loading-text, .error-text, .no-records-text {
          text-align: center;
          padding: 20px;
          font-size: 1.1em;
        }

        .error-text {
          color: #d9534f;
          background-color: #f2dede;
          border: 1px solid #ebccd1;
          border-radius: 4px;
        }

        .no-records-text {
          color: #777;
        }

        .action-button-group {
          display: flex;
          gap: 8px;
          justify-content: flex-start;
          align-items: center;
        }
        .action-button .button-text {
          /* Mobil için gizlenecek metinler için ortak sınıf (opsiyonel) */
        }

        .action-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.85em;
          font-weight: 500;
          transition: background-color 0.2s ease-in-out, transform 0.1s ease;
          text-decoration: none;
          color: white;
        }

        .action-button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .action-button:active {
          transform: translateY(0px);
        }

        .view-button {
          background-color: #5bc0de;
        }

        .view-button:hover {
          background-color: #31b0d5;
        }

        .delete-button {
          background-color: #d9534f;
        }

        .delete-button:hover {
          background-color: #c9302c;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px 0;
          margin-top: 20px;
          flex-wrap: wrap; /* Küçük ekranlarda butonlar alt satıra geçebilir */
        }

        .pagination-button {
          background-color: #7ba9db;
          color: white;
          border: none;
          padding: 8px 12px;
          margin: 0 4px; /* Butonlar arası boşluk */
          font-size: 1em;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .pagination-button:hover:not(:disabled) {
          background-color: #5e8bb4;
        }
        .pagination-button:disabled {
          background-color: #ccc;
          color: #666;
          cursor: not-allowed;
        }

        .page-info {
          padding: 8px 12px;
          margin: 0 10px; /* Butonlarla arasında boşluk */
          color: #333;
          font-size: 1em;
          white-space: nowrap;
        }

        .back-button {
          position: fixed; /* Sayfa kaydırılsa bile sabit kalır */
          top: 20px;
          left: 20px;
          background-color: #7ba9db;
          color: white;
          border: none;
          padding: 10px 15px; /* Biraz daha büyük */
          font-size: 1em;
          border-radius: 6px;
          cursor: pointer;
          z-index: 1000; /* Diğer elementlerin üzerinde kalması için */
          transition: background-color 0.2s;
        }

        .back-button:hover,
        .back-button:focus { /* active durumuna gerek yok, :hover yeterli */
          background-color: #5e8bb4; /* Hover rengi */
          color: white;
          outline: none;
        }

        /* MOBİL UYUMLULUK STİLLERİ */
        @media (max-width: 768px) {
          .page-wrapper {
            padding: 10px; /* Mobil için daha az padding */
          }
          .patient-search-container {
            padding: 15px;
            margin-top: 70px; /* Geri butonu fixed olduğu için yer aç */
          }
          .patient-search-container h2 {
            font-size: 1.5em; /* Mobil için başlık küçültme */
            margin-bottom: 20px;
          }

          .controls-container {
            flex-direction: column;
            align-items: stretch;
            gap: 10px; /* Elemanlar arası boşluk */
          }

          .search-input {
            width: 100%;
          }

          .records-per-page-selector {
            width: 100%;
            justify-content: space-between; /* Label ve select'i ayır */
          }
          .records-per-page-selector label {
            font-size: 0.85em;
          }
           .records-per-page-selector select {
            font-size: 0.85em;
            padding: 8px 6px;
          }

          .table-responsive-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            width: 100%;
            /* İsteğe bağlı: Kaydırma çubuğu görünümü için */
            /* border: 1px solid #ddd; */
            /* border-radius: 6px; */
          }

          .patients-table th,
          .patients-table td {
            white-space: nowrap; /* Hücre içeriğinin alt satıra kaymasını engeller */
            font-size: 0.9em; /* Mobil için fontu biraz küçült */
            padding: 10px 8px; /* Mobil için padding'leri azalt */
          }
          
          .action-button {
            padding: 5px 8px;
            font-size: 0.8em;
          }
          /* İsteğe bağlı: mobilde buton yazılarını gizle, sadece ikon kalsın */
          /*
          .action-button .button-text {
            display: none;
          }
          .action-button {
            gap: 0;
            padding: 8px; 
          }
          */

          .pagination {
            padding: 15px 0;
            margin-top: 15px;
          }
          .pagination-button {
            padding: 7px 10px;
            font-size: 0.9em;
            margin: 0 3px;
          }
          .page-info {
            font-size: 0.9em;
            margin: 5px 8px; /* Alt satıra geçtiğinde dikey boşluk */
          }

          .back-button {
            top: 15px;
            left: 15px;
            padding: 8px 12px;
            font-size: 0.9em;
          }
        }

        @media (max-width: 700px) {
          .patient-search-container {
            padding: 10px;
            margin-top: 60px; /* Geri butonu için yer */
          }
           .patient-search-container h2 {
            font-size: 1.3em;
          }

          .patients-table th,
          .patients-table td {
            font-size: 0.75em;
            padding: 8px 5px;
          }
          
          .action-button {
            font-size: 0.7em;
            padding: 4px 6px;
            gap: 3px;
          }
          .action-button svg {
            width: 12px; /* ikon boyutu */
            height: 12px;
          }

          .pagination-button {
            padding: 6px 8px;
            font-size: 0.8em;
          }
          .page-info {
            font-size: 0.8em;
          }

          .back-button {
            top: 10px;
            left: 10px;
            padding: 6px 10px;
            font-size: 0.8em;
          }
        }
      `;
      document.head.appendChild(style);
      return () => document.head.removeChild(style);
    }, []); // Bağımlılık dizisi boş, sadece component mount/unmount olduğunda çalışır

  return (
     <div className="page-wrapper"> {/* Genel sayfa sarmalayıcısı */}
      <button className="back-button" onClick={() => navigate("/menu-page")}>
        ← Geri
      </button>
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
            <label htmlFor="recordsPerPage">Sayfa Başına Kayıt:</label>
            <select
              id="recordsPerPage"
              value={recordsPerPage}
              onChange={(e) => {
                setRecordsPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {loading && <p className="loading-text">Yükleniyor...</p>}
        {error && <p className="error-text">{error}</p>}
        
        {!loading && !error && (
          <>
            <div className="table-responsive-wrapper"> {/* TABLO İÇİN YATAY KAYDIRMA */}
              <table className="patients-table">
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
            </div> {/* .table-responsive-wrapper sonu */}

            {filteredPatients.length > recordsPerPage && totalPages > 1 && (
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
                  disabled={currentPage === totalPages || totalPages === 0}
                  aria-label="Sonraki Sayfa"
                  className="pagination-button"
                >
                  <FaAngleRight />
                </button>
                <button
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                  aria-label="Son Sayfa"
                  className="pagination-button"
                >
                  <FaAngleDoubleRight />
                </button>
              </div>
            )}
          </>
        )}
      </div> {/* .patient-search-container sonu */}
    </div> /* .page-wrapper sonu */
  );
};

export default PatientSearch;