// DoctorForum.js
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPencilAlt, faTrashAlt, faMicrophone, faStopCircle, faSpinner, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';
import 'moment/locale/tr';
//import "./DoctorForum.css"; // Make sure this CSS file exists and is correctly linked

moment.locale('tr');

const DoctorForum = () => {
    const { postId: routePostId } = useParams();
    const navigate = useNavigate();

    const [currentDoctor, setCurrentDoctor] = useState("");
    const [posts, setPosts] = useState([]);
    const [singlePost, setSinglePost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [recording, setRecording] = useState(false);
    const [recordingPostId, setRecordingPostId] = useState(null);
    const mediaRecorderRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const audioChunksRef = useRef([]);
    const [supportedMimeType, setSupportedMimeType] = useState(null);

    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editedCommentContent, setEditedCommentContent] = useState("");
    const [showAuthError, setShowAuthError] = useState(false);


    useEffect(() => {
        const checkSupportedMimeTypes = () => {
            const mimeTypes = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/webm", "audio/ogg", "audio/mp4", "audio/aac"];
            for (const mimeType of mimeTypes) {
                if (MediaRecorder.isTypeSupported(mimeType)) {
                    setSupportedMimeType(mimeType);
                    console.log(`Kullanılacak ses kayıt formatı: ${mimeType}`);
                    return;
                }
            }
            console.error("Tarayıcıda MediaRecorder için desteklenen bir ses formatı bulunamadı.");
            // Optionally alert the user if no supported format is found
            // alert("Tarayıcınızda ses kaydı için desteklenen bir format bulunamadı. Sesli yorum özelliği çalışmayabilir.");
        };
        checkSupportedMimeTypes();
    }, []);

    useEffect(() => {
        const fetchDoctorInfo = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("Token bulunamadı. DoctorForum: fetchDoctorInfo");
                // setError("Doktor bilgileri alınamadı. Lütfen tekrar giriş yapın."); // Optionally set an error
                return;
            }
            try {
                const response = await fetch("http://localhost:5005/api/doctor/info", {
                    headers: { "Authorization": `Bearer ${token}` },
                });
                if (!response.ok) {
                    if (response.status === 401) {
                        console.error("Yetkisiz erişim, token geçersiz olabilir. Yönlendiriliyor...");
                        localStorage.removeItem("token");
                        // navigate("/login"); // Consider redirecting
                        return;
                    }
                    throw new Error(`Doktor bilgisi alınamadı: ${response.status}`);
                }
                const data = await response.json();
                setCurrentDoctor(data.name);
            } catch (err) {
                console.error("Doktor bilgisi çekme hatası:",err.message);
                // setError(`Doktor bilgisi alınamadı: ${err.message}`); // Optionally set an error
            }
        };
        fetchDoctorInfo();
    }, [navigate]);

    const fetchAllPostsWithDetails = async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Forum içeriğini görüntülemek için lütfen giriş yapınız.");
            setLoading(false);
            // navigate("/login"); // Consider redirecting
            return;
        }
        try {
            const response = await fetch("http://localhost:5005/api/forum/getAll", {
                 headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`Forum gönderileri alınamadı: ${response.statusText} (${response.status})`);
            let fetchedPosts = await response.json();
            
            const detailedPosts = fetchedPosts.map(p => ({
                ...p,
                comments: p.comments || [],
                voiceRecordings: p.voiceRecordings || []
            }));

            setPosts(detailedPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (err) {
            console.error("Tüm postlar çekilirken hata:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchSinglePostWithDetails = async (id) => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
         if (!token) {
            setError("Bu gönderiyi görüntülemek için lütfen giriş yapınız.");
            setLoading(false);
            // navigate("/login"); // Consider redirecting
            return;
        }
        try {
            const response = await fetch(`http://localhost:5005/api/forum/getPost/${id}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) {
                if (response.status === 404) throw new Error(`Gönderi (ID: ${id}) bulunamadı.`);
                throw new Error(`Gönderi (ID: ${id}) alınamadı: ${response.statusText} (${response.status})`);
            }
            let fetchedPost = await response.json();
            
            const detailedPost = {
                ...fetchedPost,
                comments: fetchedPost.comments || [],
                voiceRecordings: fetchedPost.voiceRecordings || []
            };
            setSinglePost(detailedPost);

        } catch (err) {
            console.error(`Tek post (ID: ${id}) çekilirken hata:`, err);
            setError(err.message);
            setSinglePost(null); // Clear single post on error
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token && !loading) { // Avoid setting error if already loading
            setLoading(false);
            setError("Forum içeriğini görüntülemek için lütfen giriş yapın.");
            // navigate("/login"); // Consider redirecting if no token
            return;
        }

        if (routePostId) {
            fetchSinglePostWithDetails(routePostId);
            setPosts([]); // Clear all posts when viewing a single post
        } else {
            fetchAllPostsWithDetails();
            setSinglePost(null); // Clear single post when viewing all posts
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routePostId, navigate]); // Not adding loading to dependencies to avoid re-fetch loops


    const handleAddComment = async (postId, newCommentContent) => {
        if (!newCommentContent.trim()) { alert("Yorum boş olamaz."); return; }
        const token = localStorage.getItem('token');
        if (!token) { alert("Yorum yapmak için giriş yapmalısınız."); setShowAuthError(true); return; }
        if (!currentDoctor) { alert("Doktor bilgisi yüklenemedi, lütfen sayfayı yenileyin veya tekrar giriş yapın."); return; }

        try {
            const response = await fetch(`http://localhost:5005/api/forum/addComment/${postId}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ content: newCommentContent, doctorName: currentDoctor }),
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Yorum eklenemedi: ${response.statusText} (${response.status})` }));
                throw new Error(errorData.message || `Yorum eklenemedi: ${response.statusText} (${response.status})`);
            }
            
            const addedComment = await response.json();
            
            // Update state for both single post view and all posts view
            if (singlePost && singlePost.forumPostID === postId) {
                setSinglePost(prev => ({ ...prev, comments: [...(prev.comments || []), addedComment].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))}));
            }
            setPosts(prevPosts => prevPosts.map(p =>
                p.forumPostID === postId ? { ...p, comments: [...(p.comments || []), addedComment].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)) } : p
            ));

        } catch (err) { console.error("Yorum ekleme hatası:", err); alert(`Hata: ${err.message}`); }
    };

    const deleteMyForumPost = async (postId) => {
        const token = localStorage.getItem('token');
        console.log("Attempting to delete post. Token from localStorage:", token); // Token'ı logla

        if (!token) {
            alert("Gönderi silmek için giriş yapmalısınız.");
            // navigate('/login/doctor'); // Kullanıcıyı login'e yönlendir
            throw new Error("Giriş yapılmamış. Token bulunamadı.");
        }

        let response;
        try {
            response = await fetch(`http://localhost:5005/api/forum/deletePost/${postId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
        } catch (networkError) {
            // Ağ hatası (sunucuya ulaşılamadı vb.)
            console.error("Network error during delete request:", networkError);
            throw new Error("Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.");
        }


        if (!response.ok) {
            let errorMessage = `Gönderi silinemedi: ${response.status} ${response.statusText}`;
            // 401 Unauthorized durumunu özel olarak ele al
            if (response.status === 401) {
                errorMessage = "Oturumunuzun süresi dolmuş veya geçersiz. Lütfen tekrar giriş yapın.";
                // Token'ı temizleyip login'e yönlendirme burada yapılabilir veya handleDeletePost'ta
                // localStorage.removeItem('token');
                // localStorage.removeItem('doctorName'); // Diğer kullanıcı bilgilerini de temizle
                // navigate('/login/doctor'); // navigate import edilmiş ve tanımlanmış olmalı
            } else {
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.title || errorMessage;
                } catch (e) {
                    console.warn("Hata mesajı JSON olarak parse edilemedi (status " + response.status + "). Yanıt body:", await response.text());
                }
            }
            console.error("Sunucudan hata:", response.status, errorMessage);
            throw new Error(errorMessage);
        }

        if (response.status === 204) { // No Content
            return { message: "Gönderi başarıyla silindi." };
        }
        try {
            return await response.json(); // 200 OK with body
        } catch (e) {
            console.log("Silme işlemi başarılı (status " + response.status + "), ancak sunucudan JSON body dönmedi veya parse edilemedi.");
            return { message: "Gönderi başarıyla silindi (içerik yok)." };
        }
    };

    const handleDeletePost = async (postId) => {
        if (window.confirm("Bu gönderiyi silmek istediğinizden emin misiniz?")) {
          try {
            const result = await deleteMyForumPost(postId);

            if (singlePost && singlePost.forumPostID === postId) {
                setSinglePost(null);
                navigate("/doctor-forum");
            } else {
                 setPosts(prevPosts => prevPosts.filter(post => post.forumPostID !== postId));
            }
            alert(result?.message || "Gönderi başarıyla silindi.");
          } catch (err) {
            console.error("Gönderi silme hatası (handleDeletePost):", err.message);
            alert(err.message || "Gönderi silinirken bir hata oluştu.");

            // Hata mesajına göre kullanıcıyı bilgilendir veya yönlendir
            if (err.message.toLowerCase().includes("giriş yapılmamış") ||
                err.message.toLowerCase().includes("oturum") || // "Oturumunuzun süresi dolmuş"
                err.message.includes("401") || // "Unauthorized" backend'den geliyorsa
                err.message.includes("403") // "Yetkiniz yok" backend'den geliyorsa
            ) {
                setShowAuthError(true); // Genel bir yetki/oturum hata mesajı kutusu gösterir
                // Eğer özellikle oturum süresi dolduysa ve navigate varsa:
                if (err.message.toLowerCase().includes("oturum") || err.message.includes("401")) {
                     localStorage.removeItem('token');
                     localStorage.removeItem('doctorName');
                     // navigate('/login/doctor'); // Eğer navigate tanımlıysa
                     // Eğer navigate yoksa, kullanıcıya login olması gerektiğini söyleyen bir mesaj gösterin
                     // ve belki bir "Login" butonu.
                     // Veya App.js gibi bir üst component'te global bir 401 handler olabilir.
                }
            }
          }
        }
    };

    const startAudioRecording = async (postIdToRecord) => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Tarayıcınız mikrofon erişimini desteklemiyor.");
            return;
        }
        if (!supportedMimeType) { alert("Desteklenen ses kayıt formatı bulunamadı. Kayıt başlatılamıyor."); return; }
        if (recording) { alert("Devam eden bir kayıt var. Lütfen önce onu durdurun."); return; }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            audioChunksRef.current = [];
            const options = { mimeType: supportedMimeType };
            const recorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            
            recorder.onstop = async () => {
                setRecording(false);
                setRecordingPostId(null);
                if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
                if (audioChunksRef.current.length === 0) { console.warn("Ses verisi yok, yükleme yapılmayacak."); return; }
                
                let ext = 'webm';
                const basicMime = supportedMimeType.split(';')[0].trim();
                if (basicMime === 'audio/mp4') ext = 'm4a';
                else if (basicMime === 'audio/ogg') ext = 'ogg';
                else if (basicMime === 'audio/aac') ext = 'aac';
                
                const blob = new Blob(audioChunksRef.current, { type: supportedMimeType });
                audioChunksRef.current = []; // Clear chunks after creating blob
                await uploadAudio(postIdToRecord, blob, ext);
            };

            recorder.onerror = e => {
                console.error("MediaRecorder hatası:", e.error || e);
                alert(`MediaRecorder hatası: ${e.error?.name || e.error?.message || 'Bilinmeyen kayıt hatası'}`);
                setRecording(false); setRecordingPostId(null);
                if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
            };

            recorder.start(1000); // Start recording, data available every 1 second
            setRecording(true);
            setRecordingPostId(postIdToRecord);
        } catch (err) {
            console.error("Kayıt başlatma hatası (getUserMedia veya MediaRecorder):", err);
            let userMessage = "Mikrofon erişiminde veya kayıt başlatmada bir sorun oluştu.";
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                userMessage = "Mikrofon erişimine izin verilmedi. Lütfen tarayıcı ayarlarınızı kontrol edin.";
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                userMessage = "Kullanılabilir bir mikrofon bulunamadı.";
            }
            alert(userMessage);
        }
    };

    const stopAudioRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop(); // This will trigger the onstop event
        } else {
            // Fallback if somehow state is not "recording" but recording UI is active
            setRecording(false);
            setRecordingPostId(null);
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
                mediaStreamRef.current = null;
            }
        }
    };

    const toggleRecording = (postIdToToggle) => {
        if (!currentDoctor) {
             alert("Sesli yorum yapabilmek için doktor bilgisi gereklidir. Lütfen tekrar giriş yapın veya sayfayı yenileyin.");
             return;
        }
        if (recording && recordingPostId === postIdToToggle) {
            stopAudioRecording();
        } else if (!recording) {
            startAudioRecording(postIdToToggle);
        } else {
            alert("Lütfen önce diğer gönderideki ses kaydını durdurun veya tamamlayın.");
        }
    };
    
    const uploadAudio = async (postId, blob, fileExtension) => {
        if (blob.size === 0) { alert("Boş ses kaydı yüklenemez."); return; }
        const formData = new FormData();
        const token = localStorage.getItem('token');
        
        if (!token) { alert("Ses kaydı yüklemek için giriş yapmalısınız."); setShowAuthError(true); return; }
        if (!currentDoctor) { alert("Doktor adı alınamadı, ses kaydı yüklenemiyor."); return; }

        formData.append("file", blob, `forum_ses_${postId}_${Date.now()}.${fileExtension}`);
        formData.append("doctorName", currentDoctor);

        try {
            const response = await fetch(`http://localhost:5005/api/forum/addVoiceRecording/${postId}`,
                { method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: formData });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Ses yüklenemedi: ${response.statusText} (${response.status})` }));
                throw new Error(errorData.message || `Ses yüklenemedi: ${response.statusText} (${response.status})`);
            }
            
            const addedRecordingData = await response.json();
            const newRecordingObject = addedRecordingData.voiceRecording;

            if (!newRecordingObject || !newRecordingObject.voiceRecordingID) {
                console.error("Sunucudan geçersiz ses kaydı verisi alındı:", addedRecordingData);
                throw new Error("Sunucudan geçersiz ses kaydı verisi alındı.");
            }

            // Update state for both single post view and all posts view
            if (singlePost && singlePost.forumPostID === postId) {
                setSinglePost(prev => ({
                    ...prev,
                    voiceRecordings: [...(prev.voiceRecordings || []), newRecordingObject].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
                }));
            }
            setPosts(prevPosts => prevPosts.map(p =>
                p.forumPostID === postId
                    ? { ...p, voiceRecordings: [...(p.voiceRecordings || []), newRecordingObject].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)) }
                    : p
            ));
            alert("Ses kaydı başarıyla yüklendi.");
        } catch (err) {
            console.error("Ses yükleme hatası:", err);
            alert(`Hata: ${err.message}`);
        }
    };

    const deleteRecording = async (postId, recordingId) => {
        const token = localStorage.getItem('token');
        if (!token) { alert("Bu işlem için giriş yapmalısınız."); setShowAuthError(true); return; }
        if (!window.confirm("Bu ses kaydını silmek istediğinizden emin misiniz?")) return;

        try {
            const response = await fetch(
                `http://localhost:5005/api/forum/deleteVoiceRecording/${recordingId}`,
                { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } }
            );

            if (response.status === 403) {
                setShowAuthError(true);
                alert("Bu ses kaydını silme yetkiniz bulunmamaktadır.");
                return;
            }
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Ses kaydı silinemedi: ${response.statusText} (${response.status})` }));
                throw new Error(errorData.message || `Ses kaydı silinemedi: ${response.statusText} (${response.status})`);
            }
            
            // Update state for both single post view and all posts view
            if (singlePost && singlePost.forumPostID === postId) {
                setSinglePost(prev => ({ ...prev, voiceRecordings: (prev.voiceRecordings || []).filter(r => r.voiceRecordingID !== recordingId) }));
            }
            setPosts(prevPosts => prevPosts.map(p =>
                p.forumPostID === postId
                    ? { ...p, voiceRecordings: (p.voiceRecordings || []).filter(r => r.voiceRecordingID !== recordingId) }
                    : p
            ));
            alert("Ses kaydı başarıyla silindi!");

        } catch (error) {
            console.error("Ses kaydı silme hatası:", error);
            alert(`Hata: ${error.message}`);
        }
    };

    const handleUpdateComment = async (commentId, updatedContent) => {
        const token = localStorage.getItem('token');
        if (!token) { alert("Bu işlem için giriş yapmalısınız."); setShowAuthError(true); return; }
        if (!updatedContent.trim()) { alert("Yorum içeriği boş olamaz."); return; }

        try {
            const response = await fetch(
                `http://localhost:5005/api/forum/updateComment/${commentId}`,
                {
                    method: "PUT",
                    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ content: updatedContent }),
                }
            );
            if (response.status === 403) {
                setShowAuthError(true);
                alert("Bu yorumu düzenleme yetkiniz bulunmamaktadır.");
                return;
            }
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Yorum güncellenemedi: ${response.statusText} (${response.status})` }));
                throw new Error(errorData.message || `Yorum güncellenemedi: ${response.statusText} (${response.status})`);
            }
            const updatedCommentData = await response.json();

            // Update state for both single post view and all posts view
            if (singlePost && singlePost.comments.some(c => c.commentID === commentId)) {
                setSinglePost(prev => ({
                    ...prev,
                    comments: (prev.comments || []).map(c => c.commentID === commentId ? updatedCommentData : c)
                                        .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
                }));
            }
            setPosts(prevPosts => prevPosts.map(p => ({
                ...p,
                comments: (p.comments || []).map(c => c.commentID === commentId ? updatedCommentData : c)
                                    .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
            })));
            setEditingCommentId(null);
            setEditedCommentContent("");
        } catch (error) {
            console.error("Yorum güncelleme hatası:", error);
            alert(`Hata: ${error.message}`);
        }
    };

    const handleDeleteComment = async (commentId) => {
        const token = localStorage.getItem('token');
        if (!token) { alert("Bu işlem için giriş yapmalısınız."); setShowAuthError(true); return; }
        if (!window.confirm("Bu yorumu silmek istediğinizden emin misiniz?")) return;

        try {
            const response = await fetch(
                `http://localhost:5005/api/forum/deleteComment/${commentId}`,
                { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } }
            );
            if (response.status === 403) {
                setShowAuthError(true);
                alert("Bu yorumu silme yetkiniz bulunmamaktadır.");
                return;
            }
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Yorum silinemedi: ${response.statusText} (${response.status})` }));
                throw new Error(errorData.message || `Yorum silinemedi: ${response.statusText} (${response.status})`);
            }

            // Update state for both single post view and all posts view
            if (singlePost && singlePost.comments.some(c => c.commentID === commentId)) {
                setSinglePost(prev => ({ ...prev, comments: (prev.comments || []).filter(c => c.commentID !== commentId) }));
            }
            setPosts(prevPosts => prevPosts.map(p => ({
                ...p,
                comments: (p.comments || []).filter(c => c.commentID !== commentId)
            })));
             alert("Yorum başarıyla silindi.");

        } catch (error) {
            console.error("Yorum silme hatası:", error);
            alert(`Hata: ${error.message}`);
        }
    };

    const displayPosts = routePostId && singlePost ? [singlePost] : posts;

    if (loading) return <div className="loading-container" style={styles.loadingContainer}><FontAwesomeIcon icon={faSpinner} spin size="3x" /> <p className="loading-text" style={styles.loadingText}>Forum Yükleniyor...</p></div>;
    // Display error message if error state is set
    if (error) return <p className="error-text" style={styles.errorText}>Hata: {error}</p>;


    return (
        <div className="forumContainer" style={styles.forumContainer}>
            <button type="back" style={styles.backButton} onClick={() => navigate("/menu-page")}>
            ← Geri
             </button>
        <div className="forum-header-bar" style={styles.forumHeaderBar}>
            <h2>Doktor Forumu</h2>
            </div>

            {showAuthError && (
                <div className="error-message-box" style={styles.errorMessageBox}>
                    Bu işlem için yetkiniz bulunmamaktadır veya bir hata oluştu.
                    <button onClick={() => setShowAuthError(false)} className="close-error-button" style={styles.closeErrorButton}>Kapat</button>
                </div>
            )}

            <div className="forum-feed" style={styles.forumFeed}>
                
                {displayPosts.length > 0 ? (
                    displayPosts.map((p) => {
                        // DEBUGGING LOG FOR PATIENT DATA - Check browser console
                        // console.log(`Rendering Post ID ${p.forumPostID}, Patient Data:`, p.patient);
                        // if (p.patient) {
                        //     console.log(`HeightCm: ${p.patient.HeightCm}, WeightKg: ${p.patient.WeightKg}, BurnOccurrenceDate: ${p.patient.BurnOccurrenceDate}`);
                        // }

                            return (
                                <div className="pageContainer">
                                    <div key={p.forumPostID} className="forum-post-card" style={styles.forumPostCard}>
                            
                                        <div className="forum-post-header" style={styles.forumPostHeader}>
                                            <p className="post-doctor-name" style={styles.postDoctorName}>Dr. {p.doctorName || "Bilinmeyen Doktor"}</p>
                                            {/* GİRİŞ YAPMIŞ DOKTOR GÖNDERİNİN SAHİBİYSE SİLME BUTONU */}
                            {currentDoctor === p.doctorName && ( // currentDoctor state'i giriş yapmış doktorun adını tutmalı
                                <button
                                    onClick={() => handleDeletePost(p.forumPostID)}
                                    style={{...styles.commentActionButton, ...styles.commentDeleteButton, fontSize: '12px', padding: '4px 8px', marginLeft: 'auto' /* Sağa yaslamak için */}}
                                    title="Gönderiyi Sil"
                                >
                                    <FontAwesomeIcon icon={faTrashAlt} /> Sil
                                </button>
                            )}
                                            {p.createdAt && (
                                                <p className="post-timestamp" style={styles.postTimestamp}>
                                                    {moment(p.createdAt).format('DD MMMM YYYY, HH:mm')}
                                                </p>
                                            )}
                                        </div>

                                    {p.photoPath && (
                                        <div className="post-image-container" style={styles.postImageContainer}>
                                            <img
                                                src={`http://localhost:5005/${p.photoPath.startsWith('/') ? p.photoPath.substring(1) : p.photoPath}`}
                                                alt={`Hasta Fotoğrafı - Post ${p.forumPostID}`}
                                                className="postImage"
                                                style={styles.postImage}
                                                onError={(e) => {
                                                    e.target.style.display = 'none'; // Hide broken image icon
                                                    const parent = e.target.parentNode;
                                                    if (parent && !parent.querySelector('.photo-error-placeholder')) {
                                                        const errorMsg = document.createElement('p');
                                                        errorMsg.className = 'photo-error-placeholder';
                                                        errorMsg.textContent = 'Fotoğraf yüklenemedi.';
                                                        errorMsg.style.color = 'red';
                                                        errorMsg.style.textAlign = 'center';
                                                        errorMsg.style.padding = '20px';
                                                        parent.appendChild(errorMsg);
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}
                                    
                                    <div className="post-patient-info" style={styles.patientInfoCard}>
                                        {p.patient?.name && p.patient.name !== "Bilinmiyor" && (
                                            <div style={styles.infoRow}>
                                            <span style={styles.label}>Ad Soyad:</span>
                                            <span style={styles.value}>{p.patient.name}</span>
                                            </div>
                                        )}
                                        {p.patient?.age && p.patient.age !== "N/A" && (
                                            <div style={styles.infoRow}>
                                            <span style={styles.label}>Yaş:</span>
                                            <span style={styles.value}>{p.patient.age}</span>
                                            </div>
                                        )}
                                        {p.patient?.gender && p.patient.gender !== "N/A" && (
                                            <div style={styles.infoRow}>
                                            <span style={styles.label}>Cinsiyet:</span>
                                            <span style={styles.value}>{p.patient.gender}</span>
                                            </div>
                                        )}
                                        {p.patient?.heightCm && (
                                            <div style={styles.infoRow}>
                                            <span style={styles.label}>Boy:</span>
                                            <span style={styles.value}>{p.patient.heightCm} cm</span>
                                            </div>
                                        )}
                                        {p.patient?.weightKg && (
                                            <div style={styles.infoRow}>
                                            <span style={styles.label}>Kilo:</span>
                                            <span style={styles.value}>{p.patient.weightKg} kg</span>
                                            </div>
                                        )}
                                        {p.patient?.burnCause && p.patient.burnCause !== "Bilinmiyor" && (
                                            <div style={styles.infoRow}>
                                            <span style={styles.label}>Yanık Nedeni:</span>
                                            <span style={styles.value}>{p.patient.burnCause}</span>
                                            </div>
                                        )}
                                        {p.patient?.burnOccurrenceDate && moment(p.patient.burnOccurrenceDate).isValid() && (
                                            <div style={styles.infoRow}>
                                            <span style={styles.label}>Yanık Tarihi:</span>
                                            <span style={styles.value}>{moment(p.patient.burnOccurrenceDate).format("DD MMMM YYYY")}</span>
                                            </div>
                                        )}
                                    </div>


                                    {/* Voice Recordings Section */}
                                    <div className="voice-recordings-section" style={styles.voiceRecordingsSection}>
                                        <h4 style={styles.sectionTitle}>🎤 Sesli Yorumlar</h4>
                                        {(p.voiceRecordings && p.voiceRecordings.length > 0) ? (
                                            p.voiceRecordings.map((recording) => (
                                                <div key={recording.voiceRecordingID} className="voice-recording-item" style={styles.voiceRecordingItem}>
                                                    <span className="recording-doctor-name" style={styles.recordingDoctorName}>
                                                        Dr. {recording.doctorName || "Bilinmeyen Doktor"}:
                                                    </span>
                                                    {recording.createdAt && (
                                                        <span className="post-timestamp recording-timestamp" style={{...styles.postTimestamp, marginLeft: '5px'}}>
                                                            {moment(recording.createdAt).format('DD MMM, HH:mm')}
                                                        </span>
                                                    )}
                                                    <audio controls src={`http://localhost:5005/${recording.filePath.startsWith('/') ? recording.filePath.substring(1) : recording.filePath}`} className="audio-player" style={styles.audioPlayerForum} />
                                                    {currentDoctor === recording.doctorName && (
                                                        <button
                                                            onClick={() => deleteRecording(p.forumPostID, recording.voiceRecordingID)}
                                                            className="delete-audio-button"
                                                            style={styles.deleteAudioButtonForum}
                                                            title="Ses Kaydını Sil">
                                                            <FontAwesomeIcon icon={faTrashAlt} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        ) : (<p className="no-content-text" style={styles.noContentText}>Henüz sesli yorum yok.</p>)}
                                        <div className="record-controls-container" style={styles.recordControlsContainer}>
                                            <button
                                                onClick={() => toggleRecording(p.forumPostID)}
                                                disabled={!supportedMimeType || (recording && recordingPostId !== p.forumPostID)}
                                                className={`record-action-button ${recording && recordingPostId === p.forumPostID ? 'recording-active' : ''}`}
                                                style={{
                                                    ...styles.recordActionButton,
                                                    ...(recording && recordingPostId === p.forumPostID ? styles.recordActionButtonRecordingActive : {}),
                                                    ...(!supportedMimeType || (recording && recordingPostId !== p.forumPostID) ? styles.recordActionButtonDisabled : {}) // Ensure disabled style applies if recording for another post
                                                }}
                                                title={(recording && recordingPostId === p.forumPostID) ? "Kaydı Durdur" : "Sesli Yorum Kaydet"}
                                            >
                                                <FontAwesomeIcon icon={(recording && recordingPostId === p.forumPostID) ? faStopCircle : faMicrophone} />
                                            </button>
                                            {recording && recordingPostId === p.forumPostID && (
                                                <>
                                                    <span className="record-instruction-text" style={styles.recordInstructionText}>Kaydediliyor...</span>
                                                    <FontAwesomeIcon icon={faSpinner} spin style={{ marginLeft: '10px', color: '#e74c3c' }} />
                                                </>
                                            )}
                                            {!supportedMimeType && <span style={{marginLeft: '10px', fontSize: '12px', color: '#7f8c8d'}}>Kayıt formatı desteklenmiyor.</span>}
                                        </div>
                                    </div>

                                    {/* Comments Section */}
                                    <div className="comments-section" style={styles.commentsSection}>
                                        <h4 style={styles.sectionTitle}>💬 Yazılı Yorumlar</h4>
                                        {(p.comments && p.comments.length > 0) ? (
                                            p.comments.map((comment) => (
                                                <div key={comment.commentID} className="comment-item-container" style={styles.commentItemContainer}>
                                                    <div className="comment-content-text" style={styles.commentContentText}>
                                                        {editingCommentId === comment.commentID ? (
                                                            <input 
                                                                type="text" 
                                                                value={editedCommentContent} 
                                                                onChange={(e) => setEditedCommentContent(e.target.value)} 
                                                                className="comment-edit-input" 
                                                                style={styles.commentEditInput} 
                                                                autoFocus 
                                                                onBlur={() => { 
                                                                    // Optional: Add a small delay or check if save was clicked before auto-canceling
                                                                    // For now, simple blur will cancel if not saved
                                                                    // if (editingCommentId === comment.commentID) { setEditingCommentId(null); } 
                                                                }} 
                                                                onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateComment(comment.commentID, editedCommentContent); else if (e.key === 'Escape') setEditingCommentId(null);}}
                                                            />
                                                        ) : ( <p className="comment-text-p" style={styles.commentTextP}><strong>Dr. {comment.doctorName || "Bilinmeyen Doktor"}:</strong> {comment.content}</p> )}
                                                        {comment.createdAt && (<span className="post-timestamp comment-timestamp" style={{...styles.postTimestamp, display: 'block', marginTop: '4px'}}>{moment(comment.createdAt).format('DD MMM YYYY, HH:mm')}</span>)}
                                                    </div>
                                                    {currentDoctor === comment.doctorName && (
                                                        <div className="comment-action-buttons" style={styles.commentActionButtons}>
                                                            {editingCommentId === comment.commentID ? (
                                                                <button onClick={() => handleUpdateComment(comment.commentID, editedCommentContent)} className="comment-save-button" style={{...styles.commentActionButton, ...styles.commentSaveButton}} title="Kaydet"><FontAwesomeIcon icon={faCheck} /></button>
                                                            ) : (
                                                                <button onClick={() => { setEditingCommentId(comment.commentID); setEditedCommentContent(comment.content);}} className="comment-edit-button" style={{...styles.commentActionButton, ...styles.commentEditButton}} title="Düzenle"><FontAwesomeIcon icon={faPencilAlt} /></button>
                                                            )}
                                                            <button onClick={() => handleDeleteComment(comment.commentID)} className="comment-delete-button" style={{...styles.commentActionButton, ...styles.commentDeleteButton}} title="Sil"><FontAwesomeIcon icon={faTrashAlt} /></button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (<p className="no-content-text" style={styles.noContentText}>Henüz yazılı yorum yok.</p>)}
                                        
                                        <div style={styles.commentInputWrapper}>
                                            <CommentInput postId={p.forumPostID} onAddComment={handleAddComment} currentDoctor={currentDoctor} />
                                        </div>
                                    </div>
                                </div>
                                </div>
                            );
                    })
                ) : (
                    <p className="no-posts-text" style={styles.noPostsText}>{routePostId ? "Bu gönderi bulunamadı veya yüklenirken bir sorun oluştu." : "Henüz forumda hiç gönderi yok."}</p>
                )}
            </div>
        </div>
    );
};

const CommentInput = ({ postId, onAddComment, currentDoctor }) => {
    const [comment, setComment] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!currentDoctor) {
            alert("Yorum yapabilmek için doktor bilgisi gereklidir. Lütfen giriş yapın veya sayfayı yenileyin.");
            return;
        }
        if (!comment.trim()) {
            alert("Yorum içeriği boş bırakılamaz.");
            return;
        }
        onAddComment(postId, comment);
        setComment("");
    };

    return (
        <form onSubmit={handleSubmit} style={styles.commentInputForm}>
            <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Yorumunuzu yazın..."
                required
                style={styles.commentInputField}
                disabled={!currentDoctor} // Disable if no current doctor info
            />
            <button type="submit" style={styles.commentSubmitButton} disabled={!currentDoctor || !comment.trim()}>
                Gönder
            </button>
        </form>
    );
};

// It's highly recommended to keep styles in a separate DoctorForum.css file for better organization
// For this example, they are inline as requested
const styles = {
    // Ana Container ve Header
    forumContainer: { fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",  background: "ecf0f1", borderRadius: "8px",padding: "20px", maxWidth: "900px", margin: "0 auto", minHeight: "calc(100vh - 50px)" /* Example for full height */ },
    pageContainer: {  width: "100%", background: "#ecf0f1" },
    forumHeaderBar: { display: "flex", flexDirection: "column", alignItems: "center"},
    //backToForumButton: { padding: "8px 15px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "13px", fontWeight: "500", transition: "background-color 0.2s ease" },
    errorMessageBox: { backgroundColor: "#f8d7da", color: "#721c24", border: "1px solid #f5c6cb", padding: "12px", borderRadius: "5px", marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    closeErrorButton: { backgroundColor: "transparent", border: "1px solid #721c24", color: "#721c24", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", marginLeft: "10px" },
    loadingContainer: { textAlign: "center", marginTop: "50px", color: "#495057", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' },
    loadingText: { fontSize: "18px", marginTop: "10px" },
    errorText: { textAlign: "center", fontSize: "16px", color: "#dc3545", marginTop: "30px", padding: "15px", backgroundColor: "#f8d7da", border: "1px solid #f5c6cb", borderRadius: "5px" },
    forumFeed: { display: "flex", flexDirection: "column", gap: "20px" },
    noPostsText: { textAlign: "center", color: "#6c757d", fontSize: "16px", marginTop: "30px", padding: "15px" },

    // Forum Post Kartı
    forumPostCard: { backgroundColor: "#ecf0f1", border: "1px solid #dee2e6", borderRadius: "8px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.8)", overflow: "hidden" },
    forumPostHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 15px", backgroundColor: "#ecf0f1", borderBottom: "1px solid #e9ecef" },
    postDoctorName: { fontWeight: "600", color: "#0056b3", margin: 0, fontSize: "1em" },
    postTimestamp: { fontSize: "0.75em", color: "#6c757d", margin: 0 },
    
    
    patientInfoCard: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f9f9f9',
    padding: '16px',
    borderRadius: '12px',
    marginTop: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    fontSize: '15px',
    maxWidth: '100%',
    gap: '10px',
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '2px',
  },
  value: {
    color: '#555',
  },


    postImageContainer: { 
        width: "100%", 
        maxHeight: "400px", // Increased maxHeight a bit
        overflow: "hidden", 
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ecf0f1", // Light background for image area
        borderBottom: "none",
    },
    postImage: {
        display: "block", 
        width: "auto",   
        height: "auto",  
        maxWidth: "100%", 
        maxHeight: "380px", // Slightly less than container to avoid scrollbars
        objectFit: "contain", // Ensures image aspect ratio is maintained
        borderRadius: "0",
    },
    
    postPatientInfo: { 
        padding: "15px", 
        fontSize: "13px", 
        borderBottom: "1px solid #e9ecef", 
        backgroundColor: "#fcfdff", // Very light blue tint
        display: 'flex',
        flexWrap: 'wrap',
        columnGap: '20px', // Horizontal space between patient info items
        rowGap: '5px'    // Vertical space between rows of patient info
    },
    postPatientInfoP: {
         margin: "5px 0", 
         lineHeight: "1.6",
         color: "#495057", // Slightly darker text for readability
    },
    sectionTitle: { marginTop: "15px", marginBottom: "10px", fontSize: "16px", fontWeight: "600", color: "#343a40", paddingBottom: "6px", borderBottom: "1px solid #dee2e6" },
    noContentText: { fontSize: "12px", color: "#6c757d", fontStyle: "italic", padding: "10px 0", textAlign: "center" },

    // Ses Kayıtları
    voiceRecordingsSection: { padding: "0 15px 15px 15px", borderBottom: "1px solid #e9ecef" },
    voiceRecordingItem: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "5px", border: "1px solid #e9ecef" },
    recordingDoctorName: { fontWeight: "500", fontSize: "12px", color: "#495057", flexShrink: 0 },
    audioPlayerForum: { flexGrow: 1, height: "35px", minWidth: "180px"}, // Slightly taller audio player
    deleteAudioButtonForum: { backgroundColor: "#e74c3c", color: "white", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, transition: "background-color 0.2s", '&:hover': { backgroundColor: "#c0392b" } },
    recordControlsContainer: { display: "flex", alignItems: "center", marginTop: "12px", gap: "10px" },
    recordActionButton: {
        backgroundColor: "#28a745", // Green for start
        color: "white",
        border: "none",
        borderRadius: "50%",
        width: "35px", // Slightly larger button
        height: "35px",
        cursor: "pointer",
        fontSize: "15px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background-color 0.2s, opacity 0.2s",
    },
    recordActionButtonRecordingActive: { backgroundColor: "#dc3545" }, // Red for stop
    recordActionButtonDisabled: { backgroundColor: "#adb5bd", cursor: "not-allowed", opacity: 0.6 },
    recordInstructionText: { fontSize: "12px", color: "#e74c3c", fontWeight: "500" },

    // Yorumlar
    commentsSection: { padding: "15px" },
    commentItemContainer: { marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px dashed #ced4da", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" },
    commentContentText: { flexGrow: 1 },
    commentTextP: { margin: "0 0 5px 0", fontSize: "13px", lineHeight: "1.5", wordBreak: "break-word", color: "#212529" },
    commentActionButtons: { display: "flex", gap: "8px", flexShrink: 0, marginTop: "3px" },
    commentActionButton: { background: "none", border: "none", cursor: "pointer", padding: "5px", fontSize: "14px", transition: "color 0.2s" },
    commentEditButton: { color: "#ffc107", '&:hover': { color: "#e0a800" } },
    commentSaveButton: { color: "#28a745", '&:hover': { color: "#1e7e34" } },
    commentDeleteButton: { color: "#dc3545", '&:hover': { color: "#bd2130" } },
    commentEditInput: { width: "calc(100% - 18px)", padding: "8px", border: "1px solid #ced4da", borderRadius: "4px", fontSize: "13px", boxSizing: "border-box", marginBottom: "5px" },
    
    commentInputWrapper: {
        display: 'flex',
        justifyContent: 'center', // Center the form
        marginTop: '20px', 
        padding: '0', // Remove horizontal padding if form has its own
    },
    commentInputForm: { 
        display: "flex", 
        gap: "10px", 
        width: "100%", 
        maxWidth: "600px", // Max width for the comment form
    },
    commentInputField: { 
        flexGrow: 1, 
        padding: "10px 12px", 
        border: "1px solid #ced4da", 
        borderRadius: "5px", 
        fontSize: "14px",
        '&:focus': { borderColor: '#80bdff', boxShadow: '0 0 0 0.2rem rgba(0,123,255,.25)'}
    },
    commentSubmitButton: { 
        padding: "10px 18px", 
        backgroundColor: "#7ba9db", 
        color: "white", 
        border: "none", 
        borderRadius: "5px", 
        cursor: "pointer", 
        fontSize: "14px", 
        fontWeight: "500", 
        transition: "background-color 0.2s ease",
        '&:hover': { backgroundColor: "#0056b3" },
        '&:disabled': { backgroundColor: "#6c757d", cursor: "not-allowed" }
    },
    backButton: {
        position: "absolute",
        top: "10px",
        left: "30px",
        backgroundColor:"#7ba9db",
        color: "white",
        border: "none",
        padding: "12px 10px",
        width: "100px",
        fontSize: "15px",
        borderRadius: "6px",
        cursor: "pointer",
      },
};
export default DoctorForum;