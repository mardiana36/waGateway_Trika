document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const iconStatus = document.getElementById("iconVerify");
  const titleStatus = document.getElementById("titleStatusVerify");
  const messageStatus = document.getElementById("messageStatusVerify");
  const token = urlParams.get("token");

  iconStatus.classList.replace("fa-check", "fa-circle-exclamation");
  iconStatus.style.color = 'red';
  titleStatus.innerText = "Verifikasi Gagal!";
  messageStatus.innerText = "Token verifikasi tidak ditemukan.";

  if (!token) {
    return; 
  }

  try {
    const response = await fetch(`/api/verify-email?token=${token}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Verifikasi gagal (respon tidak OK)");
    }

    const result = await response.json();
    
    if (!result.success) {
      messageStatus.innerText = result.error || "Verifikasi gagal";
      return;
    }

    iconStatus.classList.replace("fa-circle-exclamation", "fa-check");
    iconStatus.style.color = '#25d366';
    titleStatus.innerText = "Verifikasi Berhasil!";
    messageStatus.innerText = result.message || "Email Anda berhasil diverifikasi!";
    
  } catch (error) {
    console.error("Verification error:", error);
    messageStatus.innerText = error.message || "Terjadi kesalahan saat verifikasi";
  }
});