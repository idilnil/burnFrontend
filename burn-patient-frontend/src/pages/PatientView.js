// PatientView.js
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

const PatientView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [visits, setVisits] = useState([]);
    const [doctorName, setDoctorName] = useState("");
    const [recording, setRecording] = useState(false); // EKLENDİ
    const [mediaRecorder, setMediaRecorder] = useState(null); // EKLENDİ
    const [audioSource, setAudioSource] = useState(null); // EKLENDİ
    const [supportedMimeType, setSupportedMimeType] = useState(null); // EKLENDİ
    const audioChunksRef = useRef([]); // EKLENDİ
    const mediaStreamRef = useRef(null); // EKLENDİ

    useEffect(() => {
        const styleEl = document.createElement('style');
        styleEl.innerHTML = `
            html, body {
                margin: 0;
                padding: 0;
                width: 100%;
                overflow-x: hidden;
                box-sizing: border-box;
                background-color: #ecf0f1;
            }
            *, *::before, *::after {
                box-sizing: inherit;
            }

            @media (max-width: 768px) {
                .patient-view-container {
                    padding-left: 15px !important;
                    padding-right: 15px !important;
                }
                .patient-view-header {
                    padding-left: 0 !important;
                    padding-right: 0 !important;
                    margin-bottom: 10px !important; /* Mobil için header altı boşluk */
                }
                .patient-view-back-arrow {
                    margin-left: 0 !important; 
                    font-size: 15px !important;
                    padding: 9px 13px !important;
                }
                .patient-view-main-title {
                    font-size: 1.5em !important;
                    margin-bottom: 8px !important;
                }
                .patient-view-doctor-name {
                    font-size: 0.9em !important;
                    margin-bottom: 15px !important;
                }
                .patient-view-content {
                    flex-direction: column !important;
                    align-items: stretch !important; 
                    width: 100% !important;
                    gap: 20px !important;
                }
                .patient-view-first-visit-card,
                .patient-view-visits-section {
                    width: 100% !important;
                    max-width: none !important;
                    margin-left: 0 !important;
                    margin-right: 0 !important;
                    /* flex: none !important; */ /* Eğer masaüstünde flex varsa */
                }
                .patient-view-visits-grid {
                    justify-content: space-around !important;
                }
            }
            @media (max-width: 700px) {
                .patient-view-container {
                    padding-top: 15px !important;
                    padding-left: 10px !important;
                    padding-right: 10px !important;
                }
                .patient-view-main-title {
                    font-size: 1.3em !important;
                }
                 .patient-view-first-visit-card, .patient-view-visits-section {
                    padding: 12px !important;
                 }
                .patient-view-visit-card {
                    width: 100% !important;
                    max-width: 300px !important; 
                    margin-left: auto !important;
                    margin-right: auto !important;
                }
                .patient-view-infoText { /* Eğer infoText paragraflarına sınıf verdiysek */
                    font-size: 13px !important;
                }
                .patient-view-button { /* Genel butonlara sınıf verdiysek */
                    font-size: 14px !important;
                    padding: 8px 12px !important;
                }
            }
        `;
        document.head.appendChild(styleEl);
        return () => {
            document.head.removeChild(styleEl);
        };
    }, []);

    useEffect(() => {
        const checkSupportedMimeTypes = () => {
            const mimeTypes = [
                'audio/webm;codecs=opus', 
                'audio/ogg;codecs=opus',
                'audio/webm',
                'audio/ogg',
                'audio/mp4', 
            ];
            for (const mimeType of mimeTypes) {
                if (MediaRecorder.isTypeSupported(mimeType)) {
                    setSupportedMimeType(mimeType);
                    return;
                }
            }
            console.error('DESTEKLENEN MIME TÜRÜ BULUNAMADI!');
            // alert('Üzgünüz, tarayıcınız ses kaydını desteklemiyor veya desteklenen bir format bulunamadı.');
        };
        checkSupportedMimeTypes();
    }, []);

    useEffect(() => {
        const fetchDoctorInfo = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                // console.error("Token bulunamadı! Kullanıcı giriş yapmamış olabilir.");
                return;
            }
            try {
                const response = await fetch("http://localhost:5005/api/doctor/info", {
                    method: "GET",
                    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                });
                if (!response.ok) throw new Error("HTTP hata! Durum: " + response.status);
                const data = await response.json();
                setDoctorName(data.name);
            } catch (error) {
                console.error("Doktor bilgileri alınamadı:", error);
            }
        };
        fetchDoctorInfo();
    }, []);

    const fetchPatientData = async () => {
        if (!id) return;
        try {
            const patientResponse = await fetch(`http://localhost:5005/api/patient/${id}`);
            if (!patientResponse.ok) throw new Error("Failed to fetch patient data.");
            const patientData = await patientResponse.json();
            setPatient(patientData);

            if (patientData && patientData.audioPath) {
                const fullAudioPath = `http://localhost:5005/${patientData.audioPath}`;
                setAudioSource(fullAudioPath);
            } else {
                setAudioSource(null);
            }

            const visitsResponse = await fetch(`http://localhost:5005/api/visit/patient/${id}`);
            if (!visitsResponse.ok) throw new Error("Failed to fetch visit data.");
            const visitsData = await visitsResponse.json();
            setVisits(visitsData);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        fetchPatientData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const startRecording = async () => {
        if (!supportedMimeType) {
            alert("Desteklenen bir ses kayıt formatı bulunamadı.");
            return;
        }
        if (recording) return;

        try {
            audioChunksRef.current = [];
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const options = { mimeType: supportedMimeType };
            const recorder = new MediaRecorder(stream, options);
            
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.onstart = () => setRecording(true);

            recorder.onstop = async () => {
                setRecording(false);
                if (mediaStreamRef.current) {
                    mediaStreamRef.current.getTracks().forEach(track => track.stop());
                    mediaStreamRef.current = null;
                }
                if (audioChunksRef.current.length === 0) return;

                let fileExtension = 'webm';
                const basicMimeType = supportedMimeType.split(';')[0].trim();
                if (basicMimeType === 'audio/mp4') fileExtension = 'm4a';
                else if (basicMimeType === 'audio/ogg') fileExtension = 'ogg';

                const blob = new Blob(audioChunksRef.current, { type: supportedMimeType });
                await uploadAudio(blob, fileExtension);
            };

            recorder.onerror = (event) => {
                console.error("MediaRecorder HATA event'i:", event.error);
                alert(`Ses kaydı sırasında bir hata oluştu: ${event.error.name}`);
                setRecording(false);
                if (mediaStreamRef.current) {
                    mediaStreamRef.current.getTracks().forEach(track => track.stop());
                    mediaStreamRef.current = null;
                }
            };
            
            setMediaRecorder(recorder);
            recorder.start(1000);

        } catch (err) {
            console.error("startRecording içinde hata (getUserMedia veya MediaRecorder):", err);
            alert(`Mikrofon erişim hatası veya kayıt başlatılamadı: ${err.name}`);
            setRecording(false);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
        } else if (mediaRecorder && mediaRecorder.state === "inactive" && recording) {
            setRecording(false);
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
                mediaStreamRef.current = null;
            }
        }
    };
    
    const uploadAudio = async (blob, fileExtension) => {
        if (blob.size === 0) {
            alert("Kaydedilmiş ses verisi bulunmuyor.");
            return;
        }
        const formData = new FormData();
        formData.append('audioFile', blob, `hasta_notu.${fileExtension}`);
        try {
            const response = await fetch(`http://localhost:5005/api/patient/upload-audio/${id}`, {
                method: 'POST',
                body: formData,
            });
            if (response.ok) {
                await fetchPatientData();
            } else {
                const errorData = await response.text();
                alert(`Ses kaydı yüklenirken sunucu hatası oluştu: ${errorData || response.statusText}`);
            }
        } catch (error) {
            alert(`Ses kaydı yüklenirken bir ağ hatası oluştu: ${error.message}`);
        }
    };

    const handleDeleteAudio = async () => {
        if (!window.confirm("Bu ses kaydını silmek istediğinizden emin misiniz?")) return;
        try {
            const response = await fetch(`http://localhost:5005/api/patient/delete-audio/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setAudioSource(null);
            } else {
                const errorData = await response.text();
                alert(`Ses kaydı silinirken hata oluştu: ${errorData || response.statusText}`);
            }
        } catch (error) {
            alert(`Ses kaydı silinirken bir hata oluştu: ${error.message}`);
        }
    };
    
    const handleForum = async () => {
        if (!patient || !doctorName) { 
            alert("Hasta veya doktor bilgisi yüklenemedi.");
            return; 
        }
        try {
            const payload = {
                PatientID: patient.patientID,
                Patient: patient, // Tüm patient objesini gönderiyoruz
                DoctorName: doctorName,
                Description: `Hasta Adı: ${patient.name}, Yaş: ${patient.age}, Yanık Nedeni: ${patient.burnCause || 'Belirtilmemiş'}`,
                PhotoPath: patient.photoPath ,
                CreatedAt: new Date().toISOString()
            };
            const response = await fetch("http://localhost:5005/api/forum/addPost", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const responseText = await response.text(); 
            if (!response.ok) {
                try {
                    const errorJson = JSON.parse(responseText);
                    if (errorJson.errors) {
                        const errorMessages = Object.values(errorJson.errors).flat().join("\n");
                        alert(`Forum gönderisi eklenirken hata oluştu:\n${errorMessages}`);
                    } else {
                        alert(`Forum gönderisi eklenirken hata oluştu: ${errorJson.title || response.statusText}`);
                    }
                } catch (e) {
                    alert(`Forum gönderisi eklenirken hata oluştu: ${responseText || response.statusText}`);
                }
                return;
            }
            alert("Forum gönderisi başarıyla oluşturuldu!");
            navigate("/doctorForum");
        } catch (error) {
            alert(`Bir ağ veya istemci hatası oluştu: ${error.message}`);
        }
    };
    
    const handleBack = () => { navigate("/patient-records"); };
    const handleAddVisit = () => { navigate(`/add-visit/${id}`); };
    const handleAiConsult = () => {
        if (!patient) { alert("Hasta verisi yüklenemedi."); return; }
        navigate(`/ai-consult`, { state: { patient: patient } });
    };

    if (!patient || !doctorName) return <div style={{textAlign: 'center', marginTop: '50px'}}>Yükleniyor...</div>;

    return (
        <div style={styles.container} className="patient-view-container">
             <div style={styles.header} className="patient-view-header">
                <span style={styles.backArrow} className="patient-view-back-arrow" onClick={handleBack}>
                    ← Geri
                </span>
            </div>

            <h1 style={styles.mainTitle} className="patient-view-main-title">Hasta Detayları</h1>
            <p style={styles.doctorName} className="patient-view-doctor-name"><strong>Doktor Adı:</strong> {doctorName}</p>
            
            <div style={styles.content} className="patient-view-content">
                <div style={styles.firstVisitCard} className="patient-view-first-visit-card">
                    <div style={styles.firstVisitHeader}>
                        <h2>İlk Geliş Bilgileri</h2>
                        <button style={styles.addButton} onClick={handleAddVisit} title="Yeni Ziyaret Ekle">+</button>
                    </div>
                    <p><strong>Ad Soyad:</strong> {patient.name}</p>
                    <p><strong>Yaş:</strong> {patient.age}</p>
                    <p><strong>Cinsiyet:</strong> {patient.gender}</p>
                    <p style={{...styles.infoText, ...styles.mobileInfoText}} className="patient-view-infoText"><strong>Boy:</strong> {patient.heightCm ? `${patient.heightCm} cm` : "Belirtilmemiş"}</p>
                    <p style={{...styles.infoText, ...styles.mobileInfoText}} className="patient-view-infoText"><strong>Kilo:</strong> {patient.weightKg ? `${patient.weightKg} kg` : "Belirtilmemiş"}</p>
                    <p style={{...styles.infoText, ...styles.mobileInfoText}} className="patient-view-infoText"><strong>Email:</strong> {patient.email || "Belirtilmemiş"}</p>
                    <p style={{...styles.infoText, ...styles.mobileInfoText}} className="patient-view-infoText"><strong>Tıbbi Geçmiş:</strong> {patient.medicalHistory || "Belirtilmemiş"}</p>
                    <p style={{...styles.infoText, ...styles.mobileInfoText}} className="patient-view-infoText"><strong>Yanık Nedeni:</strong> {patient.burnCause || "Belirtilmemiş"}</p>
                    <p style={{...styles.infoText, ...styles.mobileInfoText}} className="patient-view-infoText"><strong>Yanık Bölgesi:</strong> {patient.burnArea || "Belirtilmemiş"}</p>
                    <p style={{...styles.infoText, ...styles.mobileInfoText}} className="patient-view-infoText"><strong>Hastaneye Geliş:</strong> {patient.hospitalArrivalDate ? new Date(patient.hospitalArrivalDate).toLocaleDateString() : "Belirtilmemiş"}</p>
                    <p style={{...styles.infoText, ...styles.mobileInfoText}} className="patient-view-infoText"><strong>Yanık Oluşma:</strong> {patient.burnOccurrenceDate ? new Date(patient.burnOccurrenceDate).toLocaleDateString() : "Belirtilmemiş"}</p>

                    <div style={styles.imageContainer}>
                        {patient.photoPath ? (
                            <img src={`http://localhost:5005/${patient.photoPath}`} alt={`${patient.name} Yanık Fotoğrafı`} style={styles.image} />
                        ) : (
                            <p style={styles.noImageText}>Hastaya Ait Fotoğraf Yok</p>
                        )}
                    </div>

                    <div style={styles.recordContainer}>
                        <button 
                            onMouseDown={startRecording}
                            onMouseUp={stopRecording}
                            onTouchStart={startRecording}
                            onTouchEnd={stopRecording}
                            disabled={!supportedMimeType || (recording && mediaRecorder?.state !== 'recording')}
                            style={recording ? {...styles.recordButton, ...styles.recordButtonRecording} : styles.recordButton}
                            title="Sesli Not Kaydetmek İçin Basılı Tutun"
                        >
                            <i className={`fas ${recording ? 'fa-stop-circle' : 'fa-microphone'}`}></i>
                        </button>
                        <span style={styles.recordInstruction}>
                            {recording ? "Kaydediliyor..." : "Kaydetmek için basılı tutun"}
                        </span>
                    </div>
                    {audioSource && (
                        <div style={styles.audioPlayerContainer}>
                            <audio controls src={audioSource} style={styles.audioPlayer} key={audioSource}>
                                Tarayıcınız ses oynatmayı desteklemiyor.
                            </audio>
                            <button onClick={handleDeleteAudio} style={styles.deleteAudioButton} title="Ses Kaydını Sil">X</button>
                        </div>
                    )}

                    <div style={styles.buttonsContainer}>
                        <button style={{...styles.button, ...styles.mobileButton}} className="patient-view-button" onClick={handleForum}>Foruma Sor</button>
                        <button style={{...styles.button, ...styles.mobileButton}} className="patient-view-button" onClick={handleAiConsult}>Yapay Zekaya Danış</button>
                    </div>
                </div>

                <div style={styles.visitsSection} className="patient-view-visits-section">
                    <h3 style={styles.visitsHeader}>Ziyaret Geçmişi</h3>
                    <div style={styles.visitsGrid} className="patient-view-visits-grid">
                        {visits.length > 0 ? (
                            visits.map((visit) => (
                                <div key={visit.visitID} style={styles.visitCard} className="patient-view-visit-card"> 
                                    <div style={styles.visitCardContent}>
                                        <p style={styles.visitCardText}><strong>Ziyaret Tarihi:</strong> {new Date(visit.visitDate).toLocaleDateString()}</p>
                                        <p style={styles.visitCardText}><strong>İlaçlar:</strong> {visit.prescribedMedications || "Yok"}</p>
                                        <p style={styles.visitCardText}><strong>Notlar:</strong> {visit.notes || "Yok"}</p>
                                        {visit.photoPath && (
                                            <div style={styles.visitImageContainer}>
                                                <img src={`http://localhost:5005/${visit.photoPath}`} alt={`Ziyaret ${new Date(visit.visitDate).toLocaleDateString()}`} style={styles.visitImage} />
                                            </div>
                                        )}
                                    </div>
                                    {visit.labResultsFilePath && (
                                        <a
                                            href={`http://localhost:5005/${visit.labResultsFilePath}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={styles.labResultsButton}
                                        >
                                            Laboratuvar Sonuçları
                                        </a>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p style={styles.noVisitsText}>Hastanın ziyaret geçmişi bulunmamaktadır.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px", 
        minHeight: "100vh",
        width: "100%", 
        backgroundColor: "#ecf0f1", 
    },
    header: { 
        width: "100%", 
        maxWidth: "1200px", 
        display: "flex",
        justifyContent: "flex-start",
        paddingTop: "0", // Üst padding mobil için ayarlanacak
        paddingBottom: "0", // Alt padding mobil için ayarlanacak
        zIndex: 10,
        marginBottom: "10px",
    },
    backArrow: { 
        padding: "10px 15px",
        backgroundColor: "#7ba9db",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "16px",
        marginLeft: "0", // Mobil için @media ile ayarlanacak, masaüstünde container padding'i yeterli
    },
    mainTitle: { 
        textAlign: "center",
        width: "100%",
        maxWidth: "1200px",
        marginTop: "0",
        marginBottom: "10px",
        fontSize: "1.8em",
    },
    doctorName: { 
        textAlign: "center",
        width: "100%",
        maxWidth: "1200px",
        marginBottom: "20px",
        fontSize: "1em",
    },
    content: { 
        display: "flex",
        flexDirection: "row", 
        alignItems: "flex-start", 
        gap: "30px", 
        width: "100%",
        maxWidth: "1200px",
    },
    firstVisitCard: { 
        width: "360px", 
        minWidth: "320px",
        border: "1px solid #dee2e6", 
        padding: "15px",
        borderRadius: "8px", 
        backgroundColor: "#f8f9fa",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        textAlign: "left", 
        display: "flex", 
        flexDirection: "column",
        // alignSelf: "stretch", // Kaldırıldı, mobil için sorun yaratabilir
    },
    firstVisitHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
    addButton: { backgroundColor: "#28a745", color: "white", fontSize: "18px", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" },
    infoText: { fontSize: "14px", marginBottom: "6px", lineHeight: "1.4" },
    mobileInfoText: {}, // Mobil için className ile override edilecek stiller için boş obje
    imageContainer: { display: "flex", justifyContent: "center", alignItems: "center", marginTop: "10px", marginBottom: "10px", border: "1px solid #eee", padding: "5px", borderRadius: "4px", backgroundColor: "#fff", minHeight: "120px" },
    image: { maxWidth: "100%", maxHeight: "200px", width: "auto", height: "auto", objectFit: "contain", borderRadius: "4px" }, 
    visitsSection: { 
        flex: 1, 
        display: "flex",
        flexDirection: "column",
    },
    visitsHeader: {
        marginBottom: "15px",
        fontSize: "20px",
        color: "#343a40",
        borderBottom: "2px solid #7ba9db",
        paddingBottom: "5px",
        alignSelf: "flex-start",
    },
    visitsGrid: { 
        display: "flex",
        flexDirection: "row", 
        flexWrap: "wrap",     
        gap: "20px",         
        justifyContent: "flex-start", 
    },
    visitCard: { 
        width: "230px", 
        minWidth: "200px", 
        height: "auto", 
        minHeight: "250px", 
        border: "1px solid #e0e0e0",
        padding: "12px", 
        borderRadius: "8px",
        backgroundColor: "#fff",
        textAlign: "left",
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.08)",
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "space-between",
    },
    visitCardContent: { flexGrow: 1, overflowY: "auto", marginBottom: "10px" },
    visitCardText: { fontSize: "13px", marginBottom: "5px", wordBreak: "break-word", lineHeight: "1.4" },
    visitImageContainer: { display: "flex", justifyContent: "center", alignItems: "center", marginTop: "8px", marginBottom: "8px", border: "1px solid #eee", padding: "3px", borderRadius: "4px", backgroundColor: "#f8f9fa", height: "120px", width: "100%", overflow: "hidden" },
    visitImage: { maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto", objectFit: "contain", borderRadius: "3px" },
    noVisitsText: { width: "100%", textAlign: "center", color: "#6c757d", marginTop: "20px" },
    noImageText: { color: "#6c757d", fontStyle: "italic", textAlign: "center", width: "100%" },
    labResultsButton: { display: "block", marginTop: "auto", padding: "8px 10px", backgroundColor: "#7ba9db", color: "white", textAlign: "center", textDecoration: "none", borderRadius: "5px", fontWeight: "bold", fontSize: "13px" },
    buttonsContainer: { marginTop: "auto", paddingTop:"15px", display: "flex", gap: "10px", justifyContent: "stretch" },
    button: { flex: 1, padding: "10px 15px", backgroundColor: "#7ba9db", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", fontSize: "15px", textAlign: "center" },
    mobileButton: {}, // Mobil için className ile override edilecek stiller için boş obje
    recordContainer: { display: 'flex', alignItems: 'center', marginTop: '10px', marginBottom: '8px' },
    recordButton: { padding: "8px", backgroundColor: "#7ba9db", color: "white", border: "none", borderRadius: "50%", cursor: "pointer", fontSize: "18px", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", transition: "background-color 0.2s" },
    recordButtonRecording: { backgroundColor: "#dc3545" },
    recordInstruction: { fontSize: '0.8em', marginLeft: '8px', color: '#495057' },
    audioPlayerContainer: { display: "flex", alignItems: "center", marginTop: "8px", marginBottom: "10px", padding: "6px", backgroundColor: "#e9ecef", borderRadius: "5px" },
    audioPlayer: { flexGrow: 1, height: "36px" },
    deleteAudioButton: { padding: "0px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "50%", cursor: "pointer", fontWeight: "bold", marginLeft: "6px", fontSize: "12px", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
};

export default PatientView;