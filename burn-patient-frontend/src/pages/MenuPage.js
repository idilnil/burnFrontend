import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
// import axios from "axios"; // Kullanılmıyorsa kaldırın, api kullanılıyor
import { FaUserCircle, FaBars, FaTimes } from "react-icons/fa"; // Mobil menü ikonları eklendi
import api from "../api/axiosConfig";

const MenuPage = () => {
  const [doctorName, setDoctorName] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobil menü için state eklendi
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/"); // Düzeltildi
      return;
    }

    api
      .get("api/doctor/name", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setDoctorName(response.data.name);
      })
      .catch((error) => {
        console.error("Doktor adı alınamadı:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("isDoctorLoggedIn"); // Bu anahtar kullanılıyorsa
        navigate("/"); // Düzeltildi
      });
  }, [navigate]);

  // Bu state'ler bu bileşende doğrudan kullanılmıyor gibi görünüyor,
  // ama handleLogout içinde set ediliyorlar.
  const [, setIsAdminLoggedIn] = useState(false);
  const [, setIsDoctorLoggedIn] = useState(false);

  const handleLogout = (role) => {
    localStorage.removeItem("token");
    if (role === "admin") {
      setIsAdminLoggedIn(false);
      localStorage.setItem("isAdminLoggedIn", "false");
      navigate("/login/admin");
    } else {
      setIsDoctorLoggedIn(false);
      localStorage.setItem("isDoctorLoggedIn", "false");
      navigate("/login/doctor");
    }
  };

  useEffect(() => {
    if (!document.getElementById("menu-page-style")) {
      const style = document.createElement("style");
      style.id = "menu-page-style";
      style.innerHTML = `
      /* ================================= */
      /* == BAŞLANGIÇTAKİ MASAÜSTÜ CSS'İ == */
      /* ================================= */
      .menu-page-container {
        display: flex;
        height: 100vh;
        background-color: #ecf0f1; /* sağ alan*/
        font-family: Arial, sans-serif;
        position: relative;
      }

      .sidebar {
        width: 220px;
        background-color: #E0E0E0; /*menu*/
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
        display: flex;
        flex-direction: column;
        padding-top: 30px;
        box-sizing: border-box;
      }

      .menu {
        display: flex;
        flex-direction: column;
        gap: 0;
        padding-left: 20px;
      }

      .menu-item {
        color: black;
        font-size: 18px;
        text-decoration: none;
        padding: 12px 0;
        cursor: pointer;
        border-left: 4px solid transparent;
        transition: border-color 0.3s ease, background-color 0.3s ease;
      }

      .divider {
        border: none;
        height: 1px;
        background-color:black;; /* Açık mavi çizgi */
        margin: 0 20px 0 20px;
      }

      .menu-item:hover {
        border-left: 4px solid #7ba9db; /* Hoverda mavi çizgi vurgusu */
        background-color: #BDBDBD;
      }

      .content {
        flex-grow: 1;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .welcome-box {
        position: absolute;
        top: 50px;
        left: 250px;
        background-color: #CFD8DC; /* hoşgeldiniz*/
        padding: 10px 60px;
        border-radius: 8px;
        color: black;
        text-align: absolute;
        font-size: 30px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
        user-select: none;
        border: 0px solid ;
      }
        
      .info-box {
        position: absolute;
        top: 150px;
        left: 250px;
        padding: 5px 10px;
        background-color: #ecf0f1;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
        border-radius: 5px;   
        font-size: 12px;
        color: black;
        text-align: left; /* Yazıyı sola hizalar */

      }  

      /* Profil kısmı sağ üst */
      .profile-section {
        position: absolute;
        top: 20px;
        right: 20px;
        color: white;
        cursor: pointer;
      }

      .profile-icon {
        font-size: 36px;
        color: #7ba9db;
      }

      .dropdown-menu {
        position: absolute;
        top: 40px;
        right: 0;
        background-color: white;
        border: 1px solid #7ba9db;
        border-radius: 6px;
        box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.2);
        z-index: 999;
        padding: 10px;
        min-width: 160px;
      }

      .dropdown-item {
        padding: 8px 12px;
        color: #1976D2;
        font-weight: bold;
      }

      .doctor-name {
        font-size: 16px;
        margin-left: 8px;
        color: black;
      }
      .logout-button {
        position: absolute;
        top: 70px;
        right: 10px;
        background-color: #f44336;
        color: white;
        width: 80px;
        height: 50px;
        padding: 5px;
        border: none;
        cursor: pointer;
        font-size: 14px;
        border-radius: 5px;
      }

      .logout-button:hover {
        background-color: #e53935; /* Red tone on hover */
      }

      /* ======================================= */
      /* == MOBİL UYUMLULUK İÇİN EKLENEN CSS == */
      /* ======================================= */

      .mobile-menu-button {
        display: none; 
        position: fixed;
        top: 15px;
        left: 15px;
        background: #7ba9db;
        color: white;
        border: none;
        padding: 10px; 
        font-size: 24px; 
        cursor: pointer;
        border-radius: 5px;
        line-height: 1; 
        z-index: 1040; 
      }
      
      .page-overlay { 
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
        z-index: 1010; 
      }
      .page-overlay.active {
        display: block;
      }

      @media (max-width: 700px) {
        .menu-page-container { 
            overflow-x: hidden; 
        }
        .sidebar { 
          position: fixed;
          left: 0;
          top: 0;
          height: 100%;
          transform: translateX(-100%); 
          z-index: 1040; 
          padding-top: 60px; /* Mobil menü kapatma butonu için yer */
        }
        .sidebar.open {
          transform: translateX(0); 
        }
        
        .menu-item { 
            display: block; 
            padding-left: 15px; /* Sidebar padding-left'i ile uyumlu */
            padding-right: 15px;
        }
        
        .content {
          padding-left: 15px;
          padding-right: 15px;
          padding-bottom: 15px;
          /* En üstteki sabit eleman (hamburger veya çıkış) 15px top + ~44px yükseklik = ~59px. */
          /* Çıkış butonu sağ üstte, hamburger sol üstte. En alttakine göre ayarla. */
          /* Mobil logout top: 15px, height: ~29px => bottom ~44px */
          /* Mobil hamburger top: 15px, height: ~44px => bottom ~59px */
          padding-top: 75px; /* ~59px + 16px boşluk */
          
          margin-left: 0; 
          display: flex; 
          flex-direction: column;
          align-items: center; 
          justify-content: flex-start; /* İçeriği yukarıdan başlat */
          box-sizing: border-box; 
          width: 100%;   
          height: 100vh; /* Tam ekran yüksekliği */
        }

        .welcome-box,
        .info-box {
          position: static; /* Akışa dahil et */
          width: 95%; 
          max-width: 100%; 
          left: auto; 
          top: auto; 
          margin-left: auto;
          margin-right: auto;
          padding: 20px; 
          text-align: left; 
          z-index: 1; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.3); /* Daha yumuşak gölge */
          max-height: none; /* Mobil için yükseklik kısıtlamasını kaldır */
          overflow-y: visible; /* Kaydırmayı body'e bırak */
        }
        .welcome-box {
          margin-top: 27px; /* Content padding-top'ı zaten boşluk sağlıyor */
          margin-bottom: 15px; 
          font-size: 20px; 
          text-align: center; 
        }
        .info-box {
          font-size: 15px; 
        }  
        .info-box p { 
          font-size: 15px; 
          line-height: 1.7; 
          margin-bottom: 1em; 
        }

        .mobile-menu-button {
          display: flex; 
          align-items: center;
          justify-content: center;
        }
        
        /* Profil kısmı sol üst */
      .profile-section {
        position: absolute;
        top: 60px;
        left: 2%;  
        color: white;
        cursor: pointer;
        z-index: 1030;
      }
        .doctor-name {
          font-size: 13px;
          margin-left: 2px;
          margin-bottom: 2px;
        }

        .dropdown-menu {
        position: fixed; 
        top: 58px;
        left: 2%;  
        background-color: white;
        border: 1px solid #7ba9db;
        border-radius: 6px;
        box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.2);
        z-index: 1030;
        padding: 10px;
        min-width: 160px;
      }

      .dropdown-item {
        padding: 8px 12px;
        color: #1976D2;
        font-weight: bold;
      }

        .logout-button { /* Mobil için logout butonu */
          position: fixed; 
          top: 63px;
          right: 2%;
          width: auto; 
          height: auto;
          padding: 8px 12px; 
          font-size: 13px; 
          z-index: 1030; /* Hamburgerin altında, sidebar'ın üstünde */
        }
          
      }
      `;
      document.head.appendChild(style);
    }
    // Clean up function for style (opsiyonel ama iyi pratik)
    return () => {
      const styleElement = document.getElementById("menu-page-style");
      if (styleElement && styleElement.parentNode) {
        // styleElement.parentNode.removeChild(styleElement); // Gerekirse temizle
      }
    };
  }, []);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="menu-page-container">
      {/* Mobil Menü Butonu (JSX'te .content'ten önce gelmesi z-index sorunlarını azaltabilir) */}
      <button
        className="mobile-menu-button"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label={isMobileMenuOpen ? "Menüyü kapat" : "Menüyü aç"}
        aria-expanded={isMobileMenuOpen}
      >
        {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Mobil menü açıkken arka planı karartmak için overlay */}
      {isMobileMenuOpen && <div className="page-overlay active" onClick={closeMobileMenu}></div>}

      {/* Sidebar (Mobil için class eklendi) */}
      <div className={`sidebar ${isMobileMenuOpen ? "open" : ""}`}>
        <div className="menu">
          {/* Mobil menüdeki linklere tıklandığında menüyü kapat */}
          <Link to="/add-patient" className="menu-item" onClick={closeMobileMenu}>Hasta Yanık Ekleme Formu</Link>
          <hr className="divider" />
          <Link to="/patient-records" className="menu-item" onClick={closeMobileMenu}>Hasta Kayıtları</Link>
          <hr className="divider" />
          <Link to="/doctor-forum" className="menu-item" onClick={closeMobileMenu}>Doktor Forumu</Link>
          <hr className="divider" />
          <Link to="/notifications" className="menu-item" onClick={closeMobileMenu}>Bildirimler</Link>
        </div>
      </div>

      {/* Content */}
      <div className="content">
        <div className="welcome-box">Yanık Ön Tanı ve Karar Destek Platformu</div>
        <div className="info-box">
          <p> SİSTEMİ NASIL KULLANIRIM?</p>
          <p>💻 Yapay Zekâ ile Yanık Analizi</p>
          <p>Hastalarınıza ait yanık fotoğraflarını sisteme yükleyin.
            Sistem, bu görselleri yapay zekâ yardımıyla analiz eder ve yanığın derinliğini belirler ve yüzey alanını
            hesaplar. Bu sayede hızlı ve etkili bir değerlendirme yapabilirsiniz.
            Bunun için sayfanın solunda, menüde bulunan "Hasta Yanık Ekleme Formu" sayfasında bulunan formu kullanmalısınız.
            Formdaki bilgileri eksiksiz doldurduktan sonra sayfanın altındaki "Kaydet" butona basarak bilgileri sisteme yüklemelisiniz.
            Hasta bilgilerini form aracılığıyla başarılı bir şekilde sisteme yükledikten sonra yapay zeka
            sonuçlarına ulaşabilmek için "Hasta Kayıtları" sayfasında ilgili hastanın kaydının yanında bulunan
            "görüntüle" butonuna bastıktan sonra karşınıza çıkan sayfadaki
            "Yapay Zekaya Danış" butonuna basmanız gerekmektedir. Karşınıza çıkan sayfada "Yapay Zekaya Sor" butonuna
            bastıktan sonra yapay zeka sonuçlarına ulaşabilirsiniz. Dilerseniz "Onaylıyorum" butonuna basarak
            sonuçların doğruluğuna onay vererek Yapay zeka modelimizin gelişimine katkı sağlayabilirniz.</p>
          <p>📝Hasta Kaydı</p>
          <p>Yanık fotoğrafını yüklediğiniz tüm hastaların bilgileri, sistemde kayıt altında tutulur.
            Bununla birlikte, bir hastanın her gelişi için sistem üzerinden ayrı bir ziyaret kaydı oluşturabilirsiniz.
            Bu sayede hastanın tüm süreçlerini adım adım takip edebilir, geçmişe yönelik bilgilere kolayca ulaşabilirsiniz.
            Sayfanın solunda, menüde bulunan "Hasta Kayıtları" sayfasında ilgili hastanın kaydınının yanında bulunan
            "görüntüle" butonuna bastığınızda çıkacak sayfada "+" butonuna bastığınızda karşınıza çıkan formu eksiksiz doldurduktan sonra
            "Kaydet" butona basarak hastaya özel ziyaret kaydı oluşturabilirsiniz.</p>
          <p>💬 Doktor Forumu</p>
          <p>Bu alan, diğer doktorlarla fikir alışverişi yapabileceğiniz bir ortamdır.
            Hastaların yanık görselleri üzerinde yazılı ya da sesli yorumlar yapabilirsiniz.
            Görüşlerinizi paylaşabilir, farklı vakalar üzerine tartışabilirsiniz.
            Buraya sayfanın solunda, menüde bulunan "Doktor Forumu" sayfasına giderek ulaşabilirsiniz. Bir yanık fotoğrafını
            doktor forumunda paylaşmak için "Hasta Kayıtları" sayfasında ilgili hastanın yanında yer alan
            "görüntüle" butona bastığınızda karşınıza çıkan sayfada bulunan "Forumda Paylaş" butonunu kullanmalısınız. Bu butona bastığınızda
            ilgili hastanın yanık görseli ve bilgileri forumda diğer doktorların yorumuna açık olarak paylaşılacaktır.</p>
          <p>Ekstra Bilgi: Forumdaki paylaşımlarınıza başka bir doktor yorum yaptığında sistem size bildirim gönderir.
            Bu bildirimleri görmek için sayfanın solunda, menüde bununan "Bildirimler" sayfasına gitmelisiniz.</p>
          <p>⚙️ Hesap Ayarları</p>
          <p>Hesap ayarları sayfasından profil bilgilerinizi kolayca güncelleyebilirsiniz.
            Adınız, e-posta adresiniz gibi bilgileri düzenleyebilir, şifrenizi değiştirebilirsiniz.
            Bunun için adınızın solunda bulunan profil logosunun üzerine geldiğinizde
            ortaya çıkan "Hesap Ayarları" sayfasına gitmelisiniz. </p>
          <p>⏰Randevu Hatırlatma Sistemi</p>
          <p>Hastalara belirli aralıklarla kontrole gelmeleri gerektiğinde sistem otomatik olarak e-posta gönderir.</p>
          <p>🔒 Verilerin Saklanması</p>
          <p>Sisteme kaydedilen hasta bilgileri ve görseller güvenli bir şekilde saklanır.
            Bu veriler yalnızca yetkili kullanıcılar tarafından görüntülenebilir.
            Her şey hem hasta mahremiyetine hem de veri güvenliğine uygun şekilde tasarlanmıştır.</p>
        </div>
      </div>

      {/* Masaüstü için Profile ve Çıkış Butonu */}
      {/* Çıkış Butonu hem masaüstü hem mobil için tek, CSS ile konumu değişiyor */}
      <button className="logout-button" onClick={() => handleLogout("doctor")}>
        Çıkış Yap
      </button>

      {/* Profile (Masaüstünde görünür, mobilde CSS ile gizlenir) */}
      {doctorName && (
        <div
          className="profile-section"
          onMouseEnter={() => setShowDropdown(true)}
          onMouseLeave={() => setShowDropdown(false)}
          onClick={() => setShowDropdown(prev => !prev)} // Mobil için de aç/kapa (ama mobilde gizli)
        >
          <FaUserCircle className="profile-icon" />
          <span className="doctor-name">{doctorName}</span>
          {showDropdown && (
            <div className="dropdown-menu">
              <Link to="/account-settings" className="dropdown-item" onClick={() => setShowDropdown(false)}>Hesap Ayarları</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MenuPage;