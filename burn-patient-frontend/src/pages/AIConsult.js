import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AIConsult = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const patient = location.state?.patient;

    const [photo, setPhoto] = useState(null);
    const [results, setResults] = useState({
        burnDepth: 'Hesaplanıyor...',
        confidenceDepth: '...',
        burnAreaCm2: '...',
        burnPercentage: '...',
        detectedDpi: '...'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showVerificationButtons, setShowVerificationButtons] = useState(false);
    const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
    const [verifiedStatus, setVerifiedStatus] = useState(null);

    // Stil ve responsivite için useEffect
    useEffect(() => {
        const styleEl = document.createElement('style');
        styleEl.innerHTML = `
            /* Varsayılan stiller (AIConsult component'inin kendi style objesinden gelir) */

            /* Mobil için override'lar */
            @media (max-width: 768px) { /* Tablet ve altı için breakpoint */
                .ai-consult-page-title { /* Eğer h1'e sınıf verdiysek veya genel h1'i hedefliyorsak */
                    font-size: 1.6em; /* Mobil için başlığı küçült */
                    margin-bottom: 15px;
                }

                .ai-consult-content-container {
                    flex-direction: column !important; /* ÖNEMLİ: Alt alta gelmesi için */
                    align-items: center !important; /* Kartları ortala */
                }

                .ai-consult-image-container,
                .ai-consult-results-container {
                    flex: none !important; /* flex:1 override'ı */
                    width: 100% !important; /* Tam genişlikte olsunlar */
                    max-width: 500px !important; /* Mobil için maksimum genişlik, isteğe bağlı */
                }
                .ai-consult-image-container {
                    min-height: 250px; /* Mobil için min yükseklik */
                }
                .ai-consult-image-container img { /* .image stili */
                     max-height: 300px; /* Mobil için resim max yüksekliği */
                }
                 .ai-consult-back-button { /* Geri butonuna sınıf verdiysek */
                    padding: 8px 12px;
                    font-size: 14px;
                    top: 15px;
                    left: 15px;
                 }
            }
            @media (max-width: 700px) { /* Çok küçük telefonlar için ek ayarlar */
                .ai-consult-page-title {
                    font-size: 1.4em;
                }
                .ai-consult-image-container,
                .ai-consult-results-container {
                    padding: 15px; /* İç boşlukları azalt */
                }
                 .ai-consult-ai-button { /* Yapay Zekaya Sor butonuna sınıf verdiysek */
                    padding: 10px 15px;
                    font-size: 15px;
                 }
            }
        `;
        document.head.appendChild(styleEl);
        return () => {
            document.head.removeChild(styleEl);
        };
    }, []);


    useEffect(() => {
        const loadImageAndPatientData = async () => {
            if (!patient?.patientID) {
                console.error("Hasta bilgisi eksik.");
                return;
            }

            if (patient.photoPath) {
                try {
                    const photoUrl = `http://localhost:5005/${patient.photoPath.replace(/\\/g, '/')}`;
                    const response = await fetch(photoUrl);
                    if (!response.ok) throw new Error(`Fotoğraf yüklenirken hata: ${response.status} - ${photoUrl}`);
                    setPhoto(await response.blob());
                } catch (error) {
                    console.error("Fotoğraf yüklenirken hata:", error);
                    setPhoto(null);
                }
            } else {
                setPhoto(null);
            }

            try {
                const patientResponse = await fetch(`http://localhost:5005/api/Patient/${patient.patientID}`);
                if (!patientResponse.ok) throw new Error('Hasta verisi alınamadı');
                const patientData = await patientResponse.json();
                setVerifiedStatus(patientData.verified);

                if (patientData.burnDepth || patientData.burnSizeCm2 || patientData.burnPercentage) {
                    setResults(prevResults => ({
                        ...prevResults,
                        burnDepth: patientData.burnDepth || 'Belirtilmemiş',
                        burnAreaCm2: patientData.burnSizeCm2 !== null ? patientData.burnSizeCm2.toFixed(2) : 'Belirtilmemiş',
                        burnPercentage: patientData.burnPercentage !== null ? patientData.burnPercentage.toFixed(2) : 'Belirtilmemiş'
                    }));
                    if(patientData.verified) {
                    } else if (patientData.burnDepth && patientData.burnDepth !== 'Belirtilmemiş') {
                        setShowVerificationButtons(true);
                    }
                }
            } catch (error) {
                console.error("Hasta durumu/AI bilgisi alınamadı:", error);
            }
        };

        loadImageAndPatientData();
    }, [patient]);

    const handleBack = () => {
        if (patient && patient.patientID) {
            navigate(`/view-patient/${patient.patientID}`);
        } else {
            navigate(-1);
        }
    };

    const handleSendToAI = async () => {
        if (!photo) {
            alert("Lütfen önce bir fotoğraf yükleyin veya hastanın kayıtlı fotoğrafının yüklenmesini bekleyin.");
            return;
        }
        if (!patient || patient.heightCm == null || patient.weightKg == null ) {
            alert("Hasta boy ve kilo bilgileri AI analizi için gereklidir. Lütfen hasta bilgilerini güncelleyin.");
            return;
        }

        setIsLoading(true);
        setResults({
            burnDepth: 'Hesaplanıyor...',
            confidenceDepth: '...',
            burnAreaCm2: '...',
            burnPercentage: '...',
            detectedDpi: '...'
        });
        setShowVerificationButtons(false);

        try {
            const formData = new FormData();
            formData.append('image', photo, "upload.jpg");
            formData.append('height_cm', patient.heightCm.toString());
            formData.append('weight_kg', patient.weightKg.toString());

            const aiResponse = await fetch('http://localhost:5000/predict', {
                method: 'POST',
                body: formData
            });

            if (!aiResponse.ok) {
                const errorData = await aiResponse.json().catch(() => ({ error: "AI sunucusundan okunabilir bir hata mesajı alınamadı." }));
                throw new Error(`AI Foto Analiz isteği başarısız oldu: ${aiResponse.status} - ${errorData.error || aiResponse.statusText}`);
            }

            const data = await aiResponse.json();

            const updatedResults = {
                burnDepth: data.burn_depth || 'Belirsiz',
                confidenceDepth: data.confidence_depth ? `${(data.confidence_depth * 100).toFixed(2)}%` : 'Belirsiz',
                burnAreaCm2: data.burn_area_cm2 !== null ? data.burn_area_cm2.toFixed(2) : 'Belirsiz',
                burnPercentage: data.burn_percentage !== null ? data.burn_percentage.toFixed(2) : 'Belirsiz',
                detectedDpi: data.detected_dpi !== null ? data.detected_dpi.toFixed(0) : 'Belirsiz'
            };
            setResults(updatedResults);

            const backendUpdatePayload = {
                BurnDepth: data.burn_depth,
                BurnSizeCm2: data.burn_area_cm2,
                BurnPercentage: data.burn_percentage
            };

            const backendResponse = await fetch(`http://localhost:5005/api/Patient/update-ai-analysis/${patient.patientID}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(backendUpdatePayload)
            });

            if (!backendResponse.ok) {
                 const errorBackend = await backendResponse.json().catch(() => ({ message: "Backend'den hata mesajı alınamadı." }));
                throw new Error(`Backend güncelleme isteği başarısız oldu: ${backendResponse.status} - ${errorBackend.message || errorBackend.title}`);
            }
            if (data.burn_depth && data.burn_depth !== 'Belirsiz') {
                setShowVerificationButtons(true);
            }
            setVerifiedStatus(false);

        } catch (error) {
            console.error("Fotoğraf analizi veya backend güncelleme sırasında hata:", error);
            alert(`Bir hata oluştu: ${error.message}`);
            setResults({
                burnDepth: 'Hata',
                confidenceDepth: 'Hata',
                burnAreaCm2: 'Hata',
                burnPercentage: 'Hata',
                detectedDpi: 'Hata'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const confirmVerification = async () => {
        try {
            const response = await fetch(`http://localhost:5005/api/Patient/update-verified/${patient.patientID}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verified: true })
            });
            if (!response.ok) throw new Error("Veritabanı güncellenemedi");
            setVerifiedStatus(true);
            setShowVerificationButtons(false);
            setShowConfirmationDialog(false);
        } catch (error) {
            console.error("Onay işlemi başarısız:", error);
            alert(`Onaylama sırasında hata: ${error.message}`);
        }
    };

    const rejectVerification = async () => {
        try {
            setVerifiedStatus(false);
            setShowVerificationButtons(false);
        } catch (error) {
            console.error("Reddetme işlemi başarısız:", error);
            // alert(`Reddetme sırasında hata: ${error.message}`); // Genellikle UI değişikliği için hata olmaz
        }
    };

    if (!patient) {
        return <div>Hasta bilgisi yüklenemedi. Lütfen geri dönüp tekrar deneyin.</div>;
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                {/* Geri butonuna sınıf ekleyelim */}
                <button style={styles.backButton} className="ai-consult-back-button" onClick={handleBack}>← Geri</button>
            </div>
            {/* Başlığa sınıf ekleyelim */}
            <h1 style={styles.pageTitle} className="ai-consult-page-title">Yapay Zeka Konsültasyonu - {patient.name}</h1>

            {/* Ana içerik container'ına sınıf ekleyelim */}
            <div style={styles.contentContainer} className="ai-consult-content-container">
                {/* Image container'a sınıf ekleyelim */}
                <div style={styles.imageContainer} className="ai-consult-image-container">
                    {photo ? (
                        <img src={URL.createObjectURL(photo)} alt="Yanık Fotoğrafı" style={styles.image} />
                    ) : (
                        <p style={styles.imagePlaceholderText}>
                            {patient.photoPath ? "Fotoğraf yükleniyor..." : "Hastanın kayıtlı fotoğrafı bulunmamaktadır."}
                        </p>
                    )}
                </div>

                {/* Results container'a sınıf ekleyelim */}
                <div style={styles.resultsContainer} className="ai-consult-results-container">
                    <h2>Sonuçlar</h2>
                    {isLoading ? <p style={styles.loadingText}>Yapay Zeka Analiz Ediyor...</p> : (
                        <>
                            <p><strong>Yanık Derinliği:</strong> {results.burnDepth} 
                                {results.confidenceDepth && results.confidenceDepth !== '...' && results.confidenceDepth !== 'Belirsiz' && ` (${results.confidenceDepth})`} 
                            </p>
                            <p><strong>Hesaplanan Yanık Alanı:</strong> {results.burnAreaCm2} cm²</p>
                            <p><strong>Vücut Yüzey Alanı (TBSA):</strong> {results.burnPercentage}%</p>
                            {results.detectedDpi && results.detectedDpi !== '...' && results.detectedDpi !== 'Belirsiz' && 
                                <p style={styles.dpiText}><i>Tespit Edilen DPI: {results.detectedDpi}</i></p>
                            }
                        </>
                    )}
                     {/* AI butonuna sınıf ekleyelim */}
                    {(!results.burnDepth || results.burnDepth === 'Hesaplanıyor...' || results.burnDepth === 'Hata' || results.burnDepth === 'Belirtilmemiş' || results.burnDepth === 'Belirsiz' || verifiedStatus !== true) && (
                        <button
                            style={isLoading || !photo || patient.heightCm == null || patient.weightKg == null ? {...styles.aiButton, ...styles.aiButtonDisabled} : styles.aiButton}
                            className="ai-consult-ai-button"
                            onClick={handleSendToAI}
                            disabled={isLoading || !photo || patient.heightCm == null || patient.weightKg == null}
                        >
                            {isLoading ? 'Analiz Ediliyor...' : 'Yapay Zekaya Sor'}
                        </button>
                    )}

                    {verifiedStatus === true && (
                        <p style={styles.statusMessageSuccess}>
                            Bu hastanın son AI analizi doktor tarafından ONAYLANDI.
                        </p>
                    )}
                    {verifiedStatus === false && results.burnDepth && results.burnDepth !== 'Hesaplanıyor...' && results.burnDepth !== 'Hata' && results.burnDepth !== 'Belirtilmemiş' && results.burnDepth !== 'Belirsiz' && (
                         <p style={styles.statusMessageWarning}>
                            Bu hastanın son AI analizi doktor tarafından REDDEDİLDİ/HENÜZ ONAYLANMADI.
                        </p>
                    )}

                    {showVerificationButtons && verifiedStatus !== true && results.burnDepth && results.burnDepth !== 'Hesaplanıyor...' && results.burnDepth !== 'Hata' && results.burnDepth !== 'Belirtilmemiş' && results.burnDepth !== 'Belirsiz' && (
                        <div style={styles.verificationContainer}>
                            <p>Yapay zeka sonucunu (Derinlik: {results.burnDepth}, Alan: {results.burnAreaCm2} cm²) onaylıyor musunuz?</p>
                            <button style={styles.confirmButton} onClick={() => setShowConfirmationDialog(true)}>Onaylıyorum</button>
                            <button style={styles.rejectButton} onClick={rejectVerification}>Reddediyorum</button>
                        </div>
                    )}

                    {showConfirmationDialog && (
                        <div style={styles.dialogBox}>
                            <p>Onaylanan sonuçlar model eğitimi için kullanılabilir ve bu işlem geri alınamaz! Yine de onaylamak istiyor musunuz?</p>
                            <div style={styles.dialogActions}>
                                <button style={styles.confirmButton} onClick={confirmVerification}>Evet, Onayla</button>
                                <button style={styles.rejectButton} onClick={() => setShowConfirmationDialog(false)}>Hayır, İptal</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// STYLES OBJESİ - MASAÜSTÜ İÇİN VARSAYILAN
const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: "#ecf0f1",
        alignItems: 'center',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        minHeight: '100vh',
    },
    header: {
        width: '100%',
        maxWidth: '1000px',
        display: 'flex',
        justifyContent: 'flex-start',
        marginBottom: '10px',
        position: 'relative',
    },
    backButton: { // Bu className="ai-consult-back-button" ile hedeflenecek
        padding: '10px 15px',
        backgroundColor: '#7ba9db',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '15px',
    },
    pageTitle: { // Bu className="ai-consult-page-title" ile hedeflenecek
        textAlign: 'center',
        marginBottom: '20px',
        color: '#333',
        width: '100%',
        maxWidth: '1000px',
        fontSize: '1.8em', // Masaüstü için başlık boyutu
    },
    contentContainer: { // Bu className="ai-consult-content-container" ile hedeflenecek
        display: 'flex',
        flexDirection: 'row', // MASAÜSTÜ: Yan yana
        width: '100%',
        maxWidth: '1000px', // Yan yana için uygun genişlik
        gap: '20px',
    },
    imageContainer: { // Bu className="ai-consult-image-container" ile hedeflenecek
        flex: 1, // MASAÜSTÜ: Sol taraf
        backgroundColor: "#fff",
        boxShadow:"0 4px 12px rgba(0, 0, 0, 0.1)",
        border: '1px solid #ddd',
        padding: '20px',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '350px', // Yan yana için min yükseklik
        boxSizing: 'border-box',
    },
    image: {
        maxWidth: '100%',
        maxHeight: '400px',
        width: 'auto',
        height: 'auto',
        borderRadius: '4px',
        objectFit: 'contain',
    },
    imagePlaceholderText: {
        color: '#666',
        textAlign: 'center',
    },
    resultsContainer: { // Bu className="ai-consult-results-container" ile hedeflenecek
        flex: 1, // MASAÜSTÜ: Sağ taraf
        backgroundColor: "#fff",
        boxShadow:"0 4px 12px rgba(0, 0, 0, 0.1)",
        border: '1px solid #ddd',
        padding: '20px',
        borderRadius: '8px',
        boxSizing: 'border-box',
    },
    loadingText: {
        textAlign: 'center',
        color: '#007bff',
        fontWeight: 'bold',
        margin: '20px 0',
    },
    dpiText: {
        fontSize: '0.9em',
        color: '#555',
        marginTop: '5px',
    },
    aiButton: { // Bu className="ai-consult-ai-button" ile hedeflenecek
        padding: '12px 20px',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
        marginTop: '20px',
        display: 'block',
        width: 'fit-content',
        margin: '20px auto 0 auto',
    },
    aiButtonDisabled: {
        backgroundColor: '#ccc',
        cursor: 'not-allowed',
    },
    verificationContainer: {
        marginTop: '25px',
        paddingTop: '15px',
        borderTop: '1px solid #eee',
    },
    confirmButton: {
        padding: '10px 18px',
        margin: '5px',
        backgroundColor: '#7ba9db',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '14px',
    },
    rejectButton: {
        padding: '10px 18px',
        margin: '5px',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '14px',
    },
    statusMessageSuccess: {
        color: 'green',
        marginTop: '20px',
        fontWeight: 'bold',
        textAlign: 'center',
        padding: '10px',
        backgroundColor: '#e6ffed',
        border: '1px solid green',
        borderRadius: '5px',
    },
    statusMessageWarning: {
        color: '#856404',
        marginTop: '20px',
        fontWeight: 'bold',
        textAlign: 'center',
        padding: '10px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '5px',
    },
    dialogBox: {
        border: '1px solid #ffc107',
        padding: '20px',
        borderRadius: '8px',
        backgroundColor: '#fff8e1',
        marginTop: '20px',
        color: '#594500',
        textAlign: 'center',
    },
    dialogActions: {
        marginTop: '15px',
    }
};

export default AIConsult;