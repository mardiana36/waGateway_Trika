const resendBtn = document.getElementById("resendBtn");
const countdownText = document.getElementById("countdownText");

const cooldownKey = "resendCooldown";
const cooldownTime = 60;

function startCooldown(secondsLeft) {
  resendBtn.disabled = true;
  countdownText.innerText = `Tunggu ${secondsLeft} detik sebelum mengirim ulang.`;

  const interval = setInterval(() => {
    secondsLeft--;
    if (secondsLeft <= 0) {
      clearInterval(interval);
      resendBtn.disabled = false;
      countdownText.innerText = "";
      localStorage.removeItem(cooldownKey);
    } else {
      countdownText.innerText = `Tunggu ${secondsLeft} detik sebelum mengirim ulang.`;
    }
  }, 1000);
}

function checkCooldown() {
  const lastTime = localStorage.getItem(cooldownKey);
  if (lastTime) {
    const elapsed = Math.floor((Date.now() - parseInt(lastTime)) / 1000);
    const remaining = cooldownTime - elapsed;
    if (remaining > 0) {
      startCooldown(remaining);
    }
  }
}
document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("regisToken");

  if (!token) {
    window.location.href = "/auth";
    return;
  }

  try {
    const response = await fetch(`/api/verifyRegis?regisToken=${token}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Verifikasi registrasi gagal (respon tidak OK)"
      );
    }
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Verifikasi gagal");
    }
  } catch (error) {
    alert("Verification error:", error);
    window.location.href = "/auth";
    return;
  }
  resendBtn.onclick = null;
  resendBtn.onclick = async () => {
    try {
      const response = await fetch("/api/verify-email", {
        method: "POST",
        credentials: "include",
      });
      const result = await response.json();
      if (result.success) {
        alert(result.message);
        if (result?.isVerified) {
          window.location.href = "/auth";
        }
        localStorage.setItem(cooldownKey, Date.now().toString());
        startCooldown(cooldownTime);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      alert(error.message);
    }
  };
  checkCooldown();
});
