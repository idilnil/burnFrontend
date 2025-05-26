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
        detectedDpi: '...' // Backend'den gelen DPI'ı saklamak için
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showVerificationButtons, setShowVerificationButtons] = useState(false);
    const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
    const [verifiedStatus, setVerifiedStatus] = useState(null);
    // const [dpi, setDpi] = useState(96); // BU SATIRI SİLİYORUZ

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
                }
            }

            try {
                const patientResponse = await fetch(`http://localhost:5005/api/Patient/${patient.patientID}`);
                if (!patientResponse.ok) throw new Error('Hasta verisi alınamadı');
                const patientData = await patientResponse.json();
                setVerifiedStatus(patientData.verified);

                if (patientData.burnDepth || patientData.burnSizeCm2 || patientData.burnPercentage) {
                    setResults(prevResults => ({ // Önceki results'ı koruyarak güncelle
                        ...prevResults, // detectedDpi gibi diğer alanları koru
                        burnDepth: patientData.burnDepth || 'Belirtilmemiş',
                        burnAreaCm2: patientData.burnSizeCm2 !== null ? patientData.burnSizeCm2.toFixed(2) : 'Belirtilmemiş',
                        burnPercentage: patientData.burnPercentage !== null ? patientData.burnPercentage.toFixed(2) : 'Belirtilmemiş'
                        // confidenceDepth ve detectedDpi AI'dan geldiği için burada güncellenmeyebilir,
                        // veya backend bunları da saklıyorsa oradan çekilebilir.
                    }));
                    if(patientData.verified) {
                        // Onaylanmışsa özel bir işlem yapılabilir
                    } else if (patientData.burnDepth) {
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
            navigate(`/view-patient/${patient.patientID}`); // PatientView sayfasının route'una göre ayarlayın
        } else {
            // Eğer patientID yoksa, genel bir "önceki sayfa" veya dashboard'a yönlendir
            navigate(-1); // Veya navigate('/doctor-dashboard');
            console.warn("Geri dönmek için hasta ID bulunamadı, genel geri kullanılıyor.");
        }
    };

    const handleSendToAI = async () => {
        if (!photo) {
            alert("Lütfen önce bir fotoğraf yükleyin veya hastanın kayıtlı fotoğrafının yüklenmesini bekleyin.");
            return;
        }
        if (!patient || patient.heightCm == null || patient.weightKg == null ) { // Yaş TBSA için zorunlu değil Mosteller'da
            alert("Hasta boy ve kilo bilgileri AI analizi için gereklidir. Lütfen hasta bilgilerini güncelleyin.");
            return;
        }
        // if (dpi <= 0) { // BU KONTROLÜ SİLİYORUZ
        //     alert("Lütfen geçerli bir DPI değeri girin.");
        //     return;
        // }

        setIsLoading(true);
        setResults({ // Analiz başlarken tüm sonuçları sıfırla/belirsiz yap
            burnDepth: 'Hesaplanıyor...',
            confidenceDepth: '...',
            burnAreaCm2: '...',
            burnPercentage: '...',
            detectedDpi: '...'
        });

        try {
            const formData = new FormData();
            formData.append('image', photo, "upload.jpg");
            formData.append('height_cm', patient.heightCm.toString());
            formData.append('weight_kg', patient.weightKg.toString());
            // formData.append('dpi', dpi.toString()); // BU SATIRI SİLİYORUZ

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
                detectedDpi: data.detected_dpi !== null ? data.detected_dpi.toFixed(0) : 'Belirsiz' // DPI'ı da al
            };
            setResults(updatedResults);

            const backendUpdatePayload = {
                BurnDepth: data.burn_depth,
                BurnSizeCm2: data.burn_area_cm2,
                BurnPercentage: data.burn_percentage
                // Backend'e detected_dpi göndermek isterseniz buraya ekleyebilirsiniz
                // Ama genellikle bu AI'ın bir çıktısıdır ve frontend'de gösterilir.
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
            console.log("AI sonuçları backend'e başarıyla kaydedildi.");
            setShowVerificationButtons(true);
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
            await fetch(`http://localhost:5005/api/Patient/update-verified/${patient.patientID}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verified: false })
            });
            setVerifiedStatus(false);
            setShowVerificationButtons(false);
        } catch (error) {
            console.error("Reddetme işlemi başarısız:", error);
            alert(`Reddetme sırasında hata: ${error.message}`);
        }
    };

    if (!patient) {
        return <div>Hasta bilgisi yüklenemedi. Lütfen geri dönüp tekrar deneyin.</div>;
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <button style={styles.backButton} onClick={handleBack}>← Geri</button>
            </div>
            <h1>Yapay Zeka Konsültasyonu - {patient.name}</h1>

            <div style={styles.contentContainer}>
                <div style={styles.imageContainer}>
                    {photo ? (
                        <img src={URL.createObjectURL(photo)} alt="Yanık Fotoğrafı" style={styles.image} />
                    ) : (
                        <p>{patient.photoPath ? "Fotoğraf yükleniyor..." : "Hastanın kayıtlı fotoğrafı yok."}</p>
                    )}
                </div>

                <div style={styles.resultsContainer}>
                    <h2>Sonuçlar</h2>
                    {}
                    {/* <div style={styles.dpiInputContainer}> ... </div> */}

                    {isLoading ? <p>Yapay Zeka Analiz Ediyor...</p> : (
                        <>
                            <p><strong>Yanık Derinliği:</strong> {results.burnDepth}</p>
                            {results.confidenceDepth && results.confidenceDepth !== '...' && <p><strong>Derinlik Güven Skoru:</strong> {results.confidenceDepth}</p>}
                            <p><strong>Hesaplanan Yanık Alanı:</strong> {results.burnAreaCm2} cm²</p>
                            <p><strong>Hesaplanan Yanık Yüzdesi:</strong> {results.burnPercentage} %</p>
                            {results.detectedDpi && results.detectedDpi !== '...' && <p><small>(Tespit Edilen Resim DPI: {results.detectedDpi})</small></p>}
                        </>
                    )}

                    {(!results.burnDepth || results.burnDepth === 'Hesaplanıyor...' || results.burnDepth === 'Hata' || !verifiedStatus) && (
                        <button
                            style={styles.aiButton}
                            onClick={handleSendToAI}
                            disabled={isLoading || !photo || patient.heightCm == null || patient.weightKg == null}
                        >
                            {isLoading ? 'Analiz Ediliyor...' : 'Yapay Zekaya Sor'}
                        </button>
                    )}

                    {verifiedStatus === true && (
                        <p style={{ color: 'green', marginTop: '20px', fontWeight: 'bold' }}>
                            Bu hastanın son AI analizi doktor tarafından ONAYLANDI.
                        </p>
                    )}
                    {verifiedStatus === false && results.burnDepth && results.burnDepth !== 'Hesaplanıyor...' && results.burnDepth !== 'Hata' && (
                         <p style={{ color: 'orange', marginTop: '20px', fontWeight: 'bold' }}>
                            Bu hastanın son AI analizi doktor tarafından REDDEDİLDİ/ONAYLANMADI.
                        </p>
                    )}

                    {showVerificationButtons && verifiedStatus !== true && (
                        <div style={{ marginTop: '20px' }}>
                            <p>Yapay zeka sonucunu (Derinlik: {results.burnDepth}, Alan: {results.burnAreaCm2} cm², Yüzde: {results.burnPercentage}%) onaylıyor musunuz?</p>
                            <button style={styles.confirmButton} onClick={() => setShowConfirmationDialog(true)}>Onaylıyorum</button>
                            <button style={styles.rejectButton} onClick={rejectVerification}>Onaylamıyorum (Eğitim için Kullanma)</button>
                        </div>
                    )}

                    {showConfirmationDialog && (
                        <div style={styles.dialogBox}>
                            <p>Onaylanan sonuçlar model eğitimi için kullanılabilir ve bu işlem geri alınamaz! Yine de onaylamak istiyor musunuz?</p>
                            <button style={styles.confirmButton} onClick={confirmVerification}>Evet, Onayla</button>
                            <button style={styles.rejectButton} onClick={() => setShowConfirmationDialog(false)}>Hayır, İptal</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', fontFamily: 'Arial, sans-serif' },
    header: { width: '100%', display: 'flex', justifyContent: 'flex-start', marginBottom: '20px' },
    backButton: { padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' },
    contentContainer: { display: 'flex', flexDirection: 'row', width: '100%', maxWidth: '1000px', gap: '20px' },
    imageContainer: { flex: 1, border: '1px solid #ddd', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' },
    image: { maxWidth: '100%', maxHeight: '400px', height: 'auto', borderRadius: '4px' },
    resultsContainer: { flex: 1, border: '1px solid #ddd', padding: '20px', borderRadius: '8px', backgroundColor: '#f8f9fa' },
   
    aiButton: { padding: '12px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', marginTop: '15px', display: 'block' },
    confirmButton: { padding: '10px 18px', margin: '5px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' },
    rejectButton: { padding: '10px 18px', margin: '5px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' },
    dialogBox: { border: '1px solid #ffc107', padding: '15px', borderRadius: '8px', backgroundColor: '#fff3cd', marginTop: '20px', color: '#856404' }
};

export default AIConsult;