import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faBell, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate(); // Initialize useNavigate
     useEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = `
            .notification-page-container {
            max-width: 900px;
            margin: 40px auto;
            background-color: #ecf0f1;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
            padding: 30px;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
                
            }

            .notifications-header h2 {
                display: flex;
                align-items: center;
                font-size: 24px;
                font-weight: bold;
                color: #2d3748;
                margin-bottom: 24px;
            }

            .bell-icon {
                margin-right: 10px;
                color: #718096;
            }

            .empty-notification-box {
                text-align: center;
                padding: 32px;
                background-color: #ecf0f1;
                color: #718096;
                border-radius: 8px;
            }

            .notification-list {
                display: grid;
                gap: 16px;
                grid-template-columns: 1fr;
            }

            .notification-content {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
            }

            .postCard {
                border: 1px solid #ccc;
                border-radius: 8px;
                padding: 15px;
                margin-top: 15px;
                margin-bottom: 15px;
                background-color: #ecf0f1;
                text-align: left;
                position: relative;
                overflow: hidden;
                width: 100%;
                max-width: 700px;
                transition: opacity 0.3s ease;
            }

            .postCard.read {
                opacity: 0.6;
            }

            .editButton,
            .goToPostButton {
                padding: 3px;
                background-color: #28a745;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                width: 25px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: absolute;
                bottom: 5px;
                right: 5px;
                font-size: 0.8em;
            }

            .goToPostButton {
                right: 40px;
                background-color: #007bff;
            }

            .timestamp {
                font-size: 0.7em;
                color: #777;
                position: absolute;
                top: 5px;
                right: 5px;
            }
            .back-button {
            position: absolute;
            top: 10px;
            left: 30px;
            background-color: #7ba9db;
            color: white;
            border: none;
            padding: 12px 10px;
            width: 100px;
            font-size: 15px;
            border-radius: 6px;
            cursor: pointer;
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);


    useEffect(() => {
        const fetchNotifications = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("Token bulunamadı! Kullanıcı giriş yapmamış olabilir.");
                return;
            }
            try {
                const response = await fetch("http://localhost:5005/api/notifications", {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });
                if (!response.ok) throw new Error(`HTTP hata! Durum: ${response.status}`);
                const data = await response.json();
                setNotifications(data);
            } catch (error) {
                console.error("Bildirimler alınamadı:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    const markAsRead = async (notificationId) => {
        try {
            const response = await fetch(
                `http://localhost:5005/api/notifications/${notificationId}/read`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            if (response.ok) {
                setNotifications((prev) =>
                    prev.map((notif) =>
                        notif.notificationID === notificationId ? { ...notif, isRead: true } : notif
                    )
                );
            } else {
                console.error("Bildirim güncellenemedi.");
            }
        } catch (error) {
            console.error("Güncelleme hatası:", error);
        }
    };

    // Function to navigate to DoctorForum
    const goToPost = (postId) => {
        if (!postId) {
            console.error("Post ID bulunamadı!");
            return;
        }
        navigate(`/doctorForum/${postId}`); // İlgili post sayfasına yönlendir
    };

    if (loading) return <div className="text-center p-4">Yükleniyor...</div>;

  return (
    <div className="notification-page-container">
        <button className="back-button" onClick={() => navigate("/menu-page")}>
        ← Geri
        </button>
        <div className="notifications-header">
            <h2>
                <FontAwesomeIcon icon={faBell} className="bell-icon" />
                Bildirimler
            </h2>
        </div>

        {notifications.length === 0 ? (
            <div className="empty-notification-box">
                Hiç bildiriminiz yok.
            </div>
        ) : (
            <div className="notification-list">
                {notifications.map((notif) => (
                    <div key={notif.notificationID} className={`postCard ${notif.isRead ? 'read' : ''}`}>
                        <div className="notification-content">
                            <div className="notification-text">
                                <h3>{notif.title}</h3>
                                <p>{notif.message}</p>
                            </div>
                            <span className="timestamp">
                                {moment(notif.createdAt).format('DD.MM.YYYY HH:mm')}
                            </span>
                            {!notif.isRead && (
                                <button className="editButton" onClick={() => markAsRead(notif.notificationID)}>
                                    <FontAwesomeIcon icon={faCheck} />
                                </button>
                            )}
                            <button className="goToPostButton" onClick={() => goToPost(notif.forumPostID)}>
                                <FontAwesomeIcon icon={faExternalLinkAlt} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}

    </div>

    );
};

export default Notifications;