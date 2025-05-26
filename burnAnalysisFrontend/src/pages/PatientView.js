import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

const PatientView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [visits, setVisits] = useState([]);
    const [doctorName, setDoctorName] = useState("");
    const [recording, setRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioSource, setAudioSource] = useState(null);
    const [supportedMimeType, setSupportedMimeType] = useState(null);
    const audioChunksRef = useRef([]);
    const mediaStreamRef = useRef(null); // Stream'i de ref'te tutalım

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
                    console.log(`KULLANILACAK MIME TÜRÜ: ${mimeType}`);
                    return;
                }
                console.log(`${mimeType} desteklenmiyor.`);
            }
            console.error('DESTEKLENEN MIME TÜRÜ BULUNAMADI!');
            alert('Üzgünüz, tarayıcınız ses kaydını desteklemiyor veya desteklenen bir format bulunamadı.');
        };
        checkSupportedMimeTypes();
    }, []);

    // ... (fetchDoctorInfo ve fetchPatientData aynı) ...
    useEffect(() => {
        const fetchDoctorInfo = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("Token bulunamadı! Kullanıcı giriş yapmamış olabilir.");
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
            console.log("Fetched patient data:", patientData);

            if (patientData && patientData.photoPath) {
                const imageUrl = `http://localhost:5005/${patientData.photoPath}`;
                console.log("Patient Photo Path from DB:", patientData.photoPath);
                console.log("Constructed Image URL for patient:", imageUrl);
            } else {
                console.log("Patient data does not have a photoPath.");
            }
    

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
    }, [id]);

    const startRecording = async () => {
        console.log("startRecording çağrıldı. Desteklenen MIME Türü:", supportedMimeType);
        if (!supportedMimeType) {
            alert("Desteklenen bir ses kayıt formatı bulunamadı.");
            return;
        }
        if (recording) {
            console.log("Zaten kayıt yapılıyor, çıkılıyor.");
            return;
        }

        try {
            audioChunksRef.current = []; // Her yeni kayıtta chunk'ları temizle
            console.log("Mikrofon erişimi isteniyor...");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream; // Stream'i sakla
            console.log("Mikrofon stream alındı:", stream);

            const options = { mimeType: supportedMimeType };
            const recorder = new MediaRecorder(stream, options);
            
            console.log("MediaRecorder oluşturuldu. mimeType:", recorder.mimeType);

            recorder.ondataavailable = (event) => {
                console.log("ondataavailable tetiklendi!"); // BU LOG ÇOK ÖNEMLİ
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                    console.log("Chunk eklendi, boyutu:", event.data.size, "Toplam chunk sayısı:", audioChunksRef.current.length);
                } else {
                    console.log("Boş data event'i geldi (size 0).");
                }
            };

            recorder.onstart = () => {
                console.log("MediaRecorder onstart event'i tetiklendi. Durum:", recorder.state);
                setRecording(true);
            };

            recorder.onstop = async () => {
                console.log("MediaRecorder onstop event'i tetiklendi. Toplanan chunk sayısı:", audioChunksRef.current.length);
                setRecording(false); // Kayıt durumunu güncelle

                // Stream'deki tüm track'leri durdur (mikrofonu serbest bırak)
                if (mediaStreamRef.current) {
                    mediaStreamRef.current.getTracks().forEach(track => track.stop());
                    mediaStreamRef.current = null;
                    console.log("Mikrofon stream'i durduruldu.");
                }
                
                if (audioChunksRef.current.length === 0) {
                    console.error("Hiç ses verisi toplanmadı! Yükleme yapılmayacak.");
                    // alert("Ses kaydı sırasında veri alınamadı. Lütfen tekrar deneyin."); // Kullanıcıyı bilgilendir
                    return;
                }

                let fileExtension = 'webm';
                const basicMimeType = supportedMimeType.split(';')[0].trim();
                if (basicMimeType === 'audio/mp4') fileExtension = 'm4a';
                else if (basicMimeType === 'audio/ogg') fileExtension = 'ogg';
                else if (basicMimeType === 'audio/webm') fileExtension = 'webm';

                const blob = new Blob(audioChunksRef.current, { type: supportedMimeType });
                console.log("Blob oluşturuldu, boyutu:", blob.size, "türü:", blob.type);
                
                // audioChunksRef.current = []; // Zaten her kayıt başında temizleniyor
                await uploadAudio(blob, fileExtension);
            };

            recorder.onerror = (event) => {
                console.error("MediaRecorder HATA event'i:", event.error);
                alert(`Ses kaydı sırasında bir hata oluştu: ${event.error.name} - ${event.error.message}`);
                setRecording(false);
                if (mediaStreamRef.current) {
                    mediaStreamRef.current.getTracks().forEach(track => track.stop());
                    mediaStreamRef.current = null;
                }
            };
            
            setMediaRecorder(recorder); // state'e ata
            recorder.start(1000); // TIMESLICE EKLE! Her saniyede bir dataavailable tetikle
            console.log("recorder.start(1000) çağrıldı.");
            // setRecording(true) onstart içinde yapılıyor.

        } catch (err) {
            console.error("startRecording içinde hata (getUserMedia veya MediaRecorder):", err);
            alert(`Mikrofon erişim hatası veya kayıt başlatılamadı: ${err.name} - ${err.message}`);
            setRecording(false);
        }
    };

    const stopRecording = () => {
        console.log("stopRecording çağrıldı. MediaRecorder:", mediaRecorder, "Durumu:", mediaRecorder?.state);
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
            console.log("mediaRecorder.stop() çağrıldı.");
            // setRecording(false) onstop içinde yapılacak
        } else if (mediaRecorder && mediaRecorder.state === "inactive" && recording) {
            // Bu durum beklenmedik, ama UI'ı düzeltmek için
            console.warn("MediaRecorder inaktif ama recording state true, düzeltiliyor.");
            setRecording(false);
            if (mediaStreamRef.current) { // Stream hala açıksa kapat
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
                mediaStreamRef.current = null;
            }
        } else {
            console.log("Durdurulacak aktif bir kayıt bulunmuyor veya MediaRecorder düzgün set edilmemiş.");
        }
    };
    
    // ... (uploadAudio, handleDeleteAudio, ve diğer handle fonksiyonları aynı)
    const uploadAudio = async (blob, fileExtension) => {
        if (blob.size === 0) {
            console.error("Yüklenecek Blob boş!");
            alert("Kaydedilmiş ses verisi bulunmuyor. Yükleme iptal edildi.");
            return;
        }
        const formData = new FormData();
        formData.append('audioFile', blob, `hasta_notu.${fileExtension}`);
        console.log(`Ses yükleniyor: hasta_notu.${fileExtension}, boyut: ${blob.size}`);
        try {
            const response = await fetch(`http://localhost:5005/api/patient/upload-audio/${id}`, {
                method: 'POST',
                body: formData,
            });
            if (response.ok) {
                console.log("Ses başarıyla yüklendi, hasta verisi yenileniyor...");
                await fetchPatientData();
            } else {
                const errorData = await response.text();
                console.error('Ses kaydı yüklenirken backend hatası:', errorData);
                alert(`Ses kaydı yüklenirken sunucu hatası oluştu: ${errorData || response.statusText}`);
            }
        } catch (error) {
            console.error('Ses kaydı yükleme network hatası:', error);
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
                console.log('Ses kaydı başarıyla silindi.');
                // alert('Ses kaydı başarıyla silindi!');
                setAudioSource(null); // UI'ı hemen güncelle
                // await fetchPatientData(); // Opsiyonel, sadece audioSource'u null yapmak yeterli olabilir
            } else {
                const errorData = await response.text();
                console.error('Ses kaydı silinirken hata oluştu:', errorData);
                alert(`Ses kaydı silinirken hata oluştu: ${errorData || response.statusText}`);
            }
        } catch (error) {
            console.error('Ses kaydı silme hatası:', error);
            alert(`Ses kaydı silinirken bir hata oluştu: ${error.message}`);
        }
    };
    

    const handleForum = async () => {
        if (!patient) { 
            console.error("Hasta bilgisi bulunamadı! Forum postu oluşturulamıyor.");
            alert("Hasta bilgisi yüklenemedi. Lütfen sayfayı yenileyin.");
            return; 
        }
        console.log("handleForum - Patient State:", JSON.stringify(patient, null, 2));
        console.log("handleForum - Patient PhotoPath:", patient.photoPath);

        if (!doctorName) {
            console.error("Doktor adı bulunamadı! Forum postu oluşturulamıyor.");
            // Belki doktor adı olmadan da post atılabilir, backend'e bağlı.
            // Şimdilik bir uyarı verelim.
            alert("Doktor bilgisi yüklenemedi. Lütfen bir süre bekleyin veya sayfayı yenileyin.");
            return;
        }
    
        try {
            const payload = {
                // Backend'deki ForumPost modelinin property adlarıyla eşleşmeli
                // Büyük/küçük harf duyarlılığına dikkat edin. Genellikle JSON property'leri camelCase (patientID)
                // C# property'leri PascalCase (PatientID) olur. ASP.NET Core bunu genellikle halleder.
                // Ama emin olmak için backend DTO'nuzun veya modelinizin tam adlarını kullanın.
                // ForumController'daki AddPost metodu `ForumPost forumPost` alıyor.
                // Bu yüzden ForumPost modelindeki property adlarını kullanmalıyız.
    
                PatientID: patient.patientID, // Bu zaten ForumPost'ta var ve FK
                Patient: patient,             // !!! EN ÖNEMLİ DEĞİŞİKLİK: TÜM PatientInfo NESNESİNİ GÖNDER !!!
                DoctorName: doctorName,
                Description: `Hasta Adı: ${patient.name}, Yaş: ${patient.age}, Yanık Nedeni: ${patient.burnCause || 'Belirtilmemiş'}`,
                PhotoPath: patient.photoPath , // Modelde PhotoPath nullable (string?)
                CreatedAt: new Date().toISOString()   // Backend'de zaten DateTime.UtcNow ile set ediliyor,
                                                      // göndermek isteğe bağlı. Eğer gönderilmezse backend'deki değer kullanılır.
            };
    
            console.log("Foruma gönderilecek payload:", JSON.stringify(payload));
    
            const response = await fetch("http://localhost:5005/api/forum/addPost", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    // Eğer token tabanlı bir yetkilendirme varsa (örn: doktorun post atması için)
                    // "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(payload),
            });
            
            const responseText = await response.text(); 
            if (!response.ok) {
                console.error("Forum post eklenemedi, Sunucu yanıtı:", responseText);
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
            
            try {
                const result = JSON.parse(responseText); 
                console.log("Forum post eklendi:", result);
            } catch (e) {
                console.log("Forum post eklendi (yanıt JSON değil, muhtemelen sadece 'Ok'):", responseText);
            }
            alert("Forum gönderisi başarıyla oluşturuldu!"); // Kullanıcıya geri bildirim
            navigate("/doctorForum");
    
        } catch (error) {
            console.error("Forum post gönderme sırasında genel hata:", error);
            alert(`Bir ağ veya istemci hatası oluştu: ${error.message}`);
        }
    };
    
    const handleBack = () => { navigate("/doctor-dashboard"); };
    const handleAddVisit = () => { navigate(`/add-visit/${id}`); };
    const handleAiConsult = () => {
        if (!patient) { alert("Hasta verisi yüklenemedi."); return; }
        navigate(`/ai-consult`, { state: { patient: patient } });
    };

    // handleMouseDown ve handleMouseUp'ı startRecording ve stopRecording olarak değiştirdik
    // Butonun event'lerini de buna göre güncelleyelim.

    if (!patient || !doctorName) return <div style={{textAlign: 'center', marginTop: '50px'}}>Yükleniyor...</div>;

    return (
        <div style={styles.container}>
            {/* ... (header, hasta detayları vb.) ... */}
             <div style={styles.header}>
                <span style={styles.backArrow} onClick={handleBack}>
                    ← Geri
                </span>
            </div>

            <h1>Hasta Detayları</h1>
            <p><strong>Doktor Adı:</strong> {doctorName}</p>
            <div style={styles.content}> {/* Ana içerik flex container'ı */}
                
                {/* İLK GELİŞ KARTI */}
                <div style={styles.firstVisitCard}>
                    <div style={styles.firstVisitHeader}>
                        <h2>İlk Geliş Bilgileri</h2>
                        <button style={styles.addButton} onClick={handleAddVisit} title="Yeni Ziyaret Ekle">+</button>
                    </div>
                    <p><strong>Ad Soyad:</strong> {patient.name}</p>
                    <p><strong>Yaş:</strong> {patient.age}</p>
                    <p><strong>Cinsiyet:</strong> {patient.gender}</p>
                    <p style={styles.infoText}><strong>Boy:</strong> {patient.heightCm ? `${patient.heightCm} cm` : "Belirtilmemiş"}</p>
                    <p style={styles.infoText}><strong>Kilo:</strong> {patient.weightKg ? `${patient.weightKg} kg` : "Belirtilmemiş"}</p>
                    <p style={styles.infoText}><strong>Email:</strong> {patient.email || "Belirtilmemiş"}</p>
                    <p style={styles.infoText}><strong>Tıbbi Geçmiş:</strong> {patient.medicalHistory || "Belirtilmemiş"}</p>
                    <p style={styles.infoText}><strong>Yanık Nedeni:</strong> {patient.burnCause || "Belirtilmemiş"}</p>
                    <p style={styles.infoText}><strong>Yanık Bölgesi:</strong> {patient.burnArea || "Belirtilmemiş"}</p>
                    <p style={styles.infoText}><strong>Hastaneye Geliş:</strong> {patient.hospitalArrivalDate ? new Date(patient.hospitalArrivalDate).toLocaleDateString() : "Belirtilmemiş"}</p>
                    <p style={styles.infoText}><strong>Yanık Oluşma:</strong> {patient.burnOccurrenceDate ? new Date(patient.burnOccurrenceDate).toLocaleDateString() : "Belirtilmemiş"}</p>

                    <div style={styles.imageContainer}>
                        {patient.photoPath ? (
                            <img src={`http://localhost:5005/${patient.photoPath}`} alt={`${patient.name} Yanık Fotoğrafı`} style={styles.image} />
                        ) : (
                            <p style={styles.noImageText}>Hastaya Ait Fotoğraf Yok</p>
                        )}
                    </div>

                    <div style={styles.recordContainer}>
                        <button 
                            onMouseDown={startRecording} // Değişti
                            onMouseUp={stopRecording}   // Değişti
                            onTouchStart={startRecording} // Değişti
                            onTouchEnd={stopRecording}   // Değişti
                            disabled={!supportedMimeType || (recording && mediaRecorder?.state !== 'recording')} // Düzeltilmiş disable koşulu
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
                            <audio controls src={audioSource} style={styles.audioPlayer} key={audioSource} /* Audio source değişince re-render için */ >
                                Tarayıcınız ses oynatmayı desteklemiyor.
                            </audio>
                            <button onClick={handleDeleteAudio} style={styles.deleteAudioButton} title="Ses Kaydını Sil">X</button>
                        </div>
                    )}

                    <div style={styles.buttonsContainer}>
                        <button style={styles.button} onClick={handleForum}>Foruma Sor</button>
                        <button style={styles.button} onClick={handleAiConsult}>Yapay Zekaya Danış</button>
                    </div>
                </div>

                {/* ZİYARET GEÇMİŞİ BÖLÜMÜ */}
                <div style={styles.visitsSection}> {/* Ziyaretler için ana sarmalayıcı */}
                    <h3 style={styles.visitsHeader}>Ziyaret Geçmişi</h3> {/* Başlık kartların üstünde */}
                    <div style={styles.visitsGrid}> {/* Kartların sıralanacağı grid/flex yapısı */}
                        {visits.length > 0 ? (
                            visits.map((visit) => (
                                <div key={visit.visitID} style={styles.visitCard}>
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

// ... (stiller aynı)
const styles = {
    container: { display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "70px", paddingBottom: "20px", minHeight: "100vh" },
    header: { width: "calc(100% - 40px)", display: "flex", justifyContent: "flex-start", padding: "10px 0", position: "absolute", top: "10px", left: "20px", zIndex: 10 },
    backArrow: { padding: "10px 20px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", fontSize: "16px" },
    content: { display: "flex", flexDirection: "row", justifyContent: "flex-start", gap: "30px", width: "90%", maxWidth: "1200px", marginTop: "20px", alignItems: "flex-start" },
    
    // --- İLK GELİŞ KARTI STİLLERİ (KÜÇÜLTÜLDÜ) ---
    firstVisitCard: { 
        width: "360px", // Biraz küçülttük
        minWidth: "320px", // Minimum genişlik
        border: "1px solid #dee2e6", 
        padding: "15px", // İç boşluğu azalttık
        borderRadius: "8px", 
        backgroundColor: "#ffffff", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)", 
        textAlign: "left", 
        position: "relative", 
        marginBottom: "20px", 
        display: "flex", 
        flexDirection: "column"
    },
    firstVisitHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }, // Boşluk azaltıldı
    addButton: { backgroundColor: "#28a745", color: "white", fontSize: "18px", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }, // Buton küçültüldü
    infoText: { // İlk geliş kartındaki paragraflar için ortak stil
        fontSize: "14px",
        marginBottom: "6px",
        lineHeight: "1.4",
    },
    imageContainer: { // Ana resim (ilk geliş) için container
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        marginTop: "10px", // Boşluk azaltıldı
        marginBottom: "10px", // Boşluk azaltıldı
        border: "1px solid #eee", 
        padding: "5px", 
        borderRadius: "4px", 
        backgroundColor: "#f9f9f9", 
        minHeight: "120px" // Min yükseklik azaltıldı
    },
    image: { // Ana resim (ilk geliş)
        maxWidth: "100%", 
        maxHeight: "200px", // Max yükseklik azaltıldı
        width: "auto", 
        height: "auto", 
        objectFit: "contain", 
        borderRadius: "4px" 
    }, 
    // --- İLK GELİŞ KARTI STİLLERİ BİTİŞ ---

    // --- ZİYARET GEÇMİŞİ BÖLÜMÜ STİLLERİ ---
    visitsSection: { // Ziyaretler için ana sarmalayıcı
        flexGrow: 1,
        display: "flex",
        flexDirection: "column", // Başlık ve grid alt alta
    },
    visitsHeader: { // Ziyaret başlığı için stil
        marginBottom: "15px", // Başlık ile kartlar arası boşluk
        fontSize: "20px",
        color: "#343a40",
        borderBottom: "2px solid #007bff",
        paddingBottom: "5px",
    },
    visitsGrid: { // Ziyaret kartlarının sıralanacağı grid/flex yapısı
        display: "flex",
        flexDirection: "row", 
        flexWrap: "wrap",     
        gap: "20px",         
        justifyContent: "flex-start", 
    },
    visitCard: {
        width: "230px", 
        height: "auto", 
        minHeight: "250px", 
        border: "1px solid #e0e0e0",
        padding: "12px", 
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
        textAlign: "left",
        boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "space-between",
    },
    visitCardContent: { 
        flexGrow: 1, 
        overflowY: "auto",
        marginBottom: "10px", 
    },
    visitCardText: {
        fontSize: "13px", 
        marginBottom: "5px", 
        wordBreak: "break-word", 
        lineHeight: "1.4",
    },
    visitImageContainer: { 
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginTop: "8px",
        marginBottom: "8px",
        border: "1px solid #eee",
        padding: "3px",
        borderRadius: "4px",
        backgroundColor: "#f0f0f0",
        height: "120px", 
        width: "100%", 
        overflow: "hidden",
    },
    visitImage: { 
        maxWidth: "100%",
        maxHeight: "100%", 
        width: "auto", 
        height: "auto",
        objectFit: "contain", 
        borderRadius: "3px",
    },
    noVisitsText: { // Ziyaret yoksa gösterilecek mesaj için
        width: "100%",
        textAlign: "center",
        color: "#6c757d",
        marginTop: "20px",
    },
    // --- ZİYARET GEÇMİŞİ BÖLÜMÜ STİLLERİ BİTİŞ ---
    
    noImageText: { color: "#6c757d", fontStyle: "italic", textAlign: "center", width: "100%" },
    labResultsButton: { 
        display: "block", 
        marginTop: "10px", 
        padding: "8px 10px", 
        backgroundColor: "#17a2b8", 
        color: "white", textAlign: "center",
        textDecoration: "none", borderRadius: "5px", 
        fontWeight: "bold", fontSize: "13px",
        // alignSelf: "stretch", // Eğer kart flex direction column ise bu işe yaramaz, direkt block yeterli
    },
    buttonsContainer: { marginTop: "auto", paddingTop:"15px", display: "flex", gap: "10px", justifyContent: "stretch" },
    button: { flex: 1, padding: "10px 15px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", fontSize: "15px", textAlign: "center" },
    recordContainer: { display: 'flex', alignItems: 'center', marginTop: '10px', marginBottom: '8px' }, // Boşluk azaltıldı
    recordButton: { padding: "8px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "50%", cursor: "pointer", fontSize: "18px", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", transition: "background-color 0.2s" }, // Buton küçültüldü
    recordButtonRecording: { backgroundColor: "#dc3545" },
    recordInstruction: { fontSize: '0.8em', marginLeft: '8px', color: '#495057' }, // Yazı ve boşluk küçültüldü
    audioPlayerContainer: { display: "flex", alignItems: "center", marginTop: "8px", marginBottom: "10px", padding: "6px", backgroundColor: "#e9ecef", borderRadius: "5px" }, // Boşluk ve padding azaltıldı
    audioPlayer: { flexGrow: 1, height: "36px" }, // Yükseklik azaltıldı
    deleteAudioButton: { padding: "0px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "50%", cursor: "pointer", fontWeight: "bold", marginLeft: "6px", fontSize: "12px", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, // Buton küçültüldü
};
export default PatientView;