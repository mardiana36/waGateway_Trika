Project ini dibuat oleh mardiana036 (Backend) dan SuryaPranata (Frontend)

# WhatsApp Gateway

Sebuah sistem WhatsApp Gateway yang memungkinkan pengiriman pesan masal, group, dan otomatis melalui WhatsApp.

## Prasyarat Instalasi

- Node.js (v14 atau lebih baru)
- XAMPP (atau aplikasi database MySQL lainnya)
- Git
- Visual Studio Code (disarankan)

## Instalasi

1. **Instal Node.js dan XAMPP**

   - Download Node.js: [https://nodejs.org/en](https://nodejs.org/en)
   - Download XAMPP: [https://www.apachefriends.org/download.html](https://www.apachefriends.org/download.html)

2. **Clone Repository**
   ```bash
   git clone https://github.com/mardiana36/waGateway_Trika.git
   cd waGateway_Trika
   ```
3. **Instal Dependensi**

   ```bash
   npm install
   ```

4. **Konfigurasi Environment**

   - Salin isi file `.env.example` ke file baru bernama `.env`
   - Isi semua variabel yang diperlukan di file `.env`
   - Untuk `JWT_SECRET`, jalankan perintah berikut dan salin hasilnya:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```

5. **Jalankan XAMPP**

   - Start Apache dan MySQL

6. **Jalankan Aplikasi**

   ```bash
   npm start
   ```

   Jika berhasil, akan muncul pesan:

   ```
   Server running on port 3000
   [INFO] Database 'wa_gateway' berhasil dibuat atau sudah ada.
   [OK] Struktur database dan relasi berhasil dibuat.
   Memulai inisialisasi semua session dari database...
   Tidak ada session yang perlu diinisialisasi
   ```

## Penggunaan API

### Mendapatkan API Token

Dapatkan API Token dari: [https://tokenwa-production.up.railway.app/](https://tokenwa-production.up.railway.app/)

## `1. API Start Session`

**Endpoint:**

- URL: `http://localhost:3000/api/b/sessions`
- Method : `POST`

**Header:**
| Key | Value | Keterangan |
|-----|-------|------------|
| Authorization | Bearer {API_TOKEN} | Ganti {API_TOKEN} dengan token yang didapat |
| Content-Type | application/json | Memberi tahu server bahwa data yang dikirim dalam request body dalam format JSON (JavaScript Object Notation). |

**Body:**
| Parameter | Contoh nilai | Tipe | Wajib | Keterangan |
|-----------|--------------|------|-------|------------|
| sessionName | bot1 | string | ya | Nama dari sesi yang akan di start. |

**Contoh Body (JSON):**

```json
{
  "sessionName": "bot1"
}
```

**Contoh Request (JavaScript):**

```javascript
try {
  const data = { sessionName: "bot1" };
  const token = "api_token_anda";

  const response = await fetch("/api/b/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (result.success) {
    alert(result.message);
  } else {
    alert(result.error);
  }
} catch (error) {
  alert(error.message);
}
```

**Response Berhasil:**

```json
{
  "success": true,
  "message": "Sesi sudah berjalan dan berhasil terautentikasi."
}
```

**Response Gagal:**

- Jika sessionName bukan string:
  ```json
  {
    "success": false,
    "error": "Tipe data sessionName harus String."
  }
  ```
- Jika error server:
  ```json
  {
    "success": false,
    "error": "Internal server error"
  }
  ```

**Catatan:**

- API ini hanya akan mengembalikan response ketika QR Code sudah discan dan terhubung dengan WhatsApp

## `2. API Delete Session`

**Endpoint:**

- URL: `http://localhost:3000/api/b/sessions`
- Method : `DELETE`

**Header:**
| Key | Value | Keterangan |
|-----|-------|------------|
| Authorization | Bearer {API_TOKEN} | Ganti {API_TOKEN} dengan token yang didapat |
| Content-Type | application/json | Memberi tahu server bahwa data yang dikirim dalam request body dalam format JSON (JavaScript Object Notation). |

**Body:**
| Parameter | Contoh nilai | Tipe | Wajib | Keterangan |
|-----------|--------------|------|-------|------------|
| sessionName | bot1 | string | ya | Nama dari sesi yang akan di delete. |

**Contoh Body (JSON):**

```json
{
  "sessionName": "bot1"
}
```

**Contoh Request (JavaScript):**

```javascript
try {
  const data = { sessionName: "bot1" };
  const token = "api_token_anda";

  const response = await fetch("/api/b/sessions", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (result.success) {
    alert(result.message);
  } else {
    alert(result.error);
  }
} catch (error) {
  alert(error.message);
}
```

**Response Berhasil:**

```json
{
  "success": true,
  "message": "Session nama_sesi berhasil dihapus"
}
```

**Response Gagal:**

- Jika sesi belum ada atau belum mulai:

  ```json
  {
    "success": false,
    "error": "Sesi ini belum ada! Silahkan mulai sesinya terlebih dahulu."
  }
  ```

- Jika sessionName tipe datanya bukan string:

  ```json
  {
    "success": false,
    "error": "Tipe data sessionName harus String."
  }
  ```

- Jika QR code belum di scan atau sesi belum terautentikasi :

  ```json
  {
    "success": false,
    "error": "WhatsApp Gateway belum terautentikasi! Silahkan scan QR code terlebih dahulu."
  }
  ```

- Jika error server:
  ```json
  {
    "success": false,
    "error": "Internal server error",
    "debugTip": "Cek apakah semua proses Chromium sudah berhenti"
  }
  ```

**Catatan:**
- API ini digunakan untuk menghapus sesi yang ada dalam database dan folder tokens yang di buat otomatis oleh library `@wppconnect-team/wppconnect`
