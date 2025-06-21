
function toggleForms() {
  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");
  loginForm.classList.toggle("hidden");
  registerForm.classList.toggle("hidden");
}
(() => {
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const response = await fetch("/api/session", {
        method: "GET",
        credentials: "include",
      });
      const result = await response.json();
      if (result.success) {
        window.location.href = "/";
      }
    } catch (error) {
      console.log(error);
    }
  });

  //Form Registrasi
  document.getElementById("regForm").onsubmit = async (e) => {
    e.preventDefault();

    // Reset errors
    document
      .querySelectorAll("#regForm .error")
      .forEach((el) => (el.style.display = "none"));

    // Get values
    const nama = document.getElementById("nama").value.trim();
    const rEmail = document.getElementById("rEmail").value.trim();
    const password = document.getElementById("password").value;
    let valid = true;

    // Validations
    if (nama.length < 3) {
      document.getElementById("namaError").style.display = "block";
      valid = false;
    }

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(rEmail)) {
      document.getElementById("telError").style.display = "block";
      valid = false;
    }

    if (password.length < 8) {
      document.getElementById("passError").style.display = "block";
      valid = false;
    }

    if (valid) {
      const userData = {
        username: nama,
        email: rEmail,
        password: password,
      };

      try {
        const response = await fetch("/api/regis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });
        const result = await response.json();

        if (result.success) {
          alert(result.message);
          document.getElementById("regForm").reset();
          if(result?.redirectTo){
            localStorage.setItem('redirectTo', result.redirectTo);
            window.location.href = result.redirectTo;
          }
          toggleForms();
        } else {
          alert(result.error);
        }
      } catch (error) {
        console.log(error);
      }
    }
  };
  // Form Login
  document.getElementById("loginFormElement").onsubmit = async (e) => {
    e.preventDefault();
    // Reset errors
    document
      .querySelectorAll("#loginFormElement .error")
      .forEach((el) => (el.style.display = "none"));

    // Get values
    const loginId = document.getElementById("loginId").value.trim();
    const password = document.getElementById("loginPassword").value;
    let valid = true;

    // Validations
    if (loginId.length === 0) {
      document.getElementById("loginError").style.display = "block";
      valid = false;
    }

    if (password.length === 0) {
      document.getElementById("loginPassError").style.display = "block";
      valid = false;
    }

    if (valid) {
      const data = {
        identify: loginId,
        password: password,
      };
      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await response.json();
        if (result.success) {
          alert(result.message);
          window.location.href = "/";
        } else {
          alert(result.message);
          const redirectTo = localStorage.getItem('redirectTo');
          if(redirectTo){
            window.location.href = redirectTo;
          }
        }
      } catch (error) {
        console.log(error);
      }
    }
  };
})();
