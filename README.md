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

**Catatan:**

- API ini hanya akan mengembalikan response ketika QR Code sudah discan dan terhubung dengan WhatsApp

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

## `2. API Delete Session`

**Catatan:**

- API ini digunakan untuk menghapus sesi yang ada dalam database dan folder tokens yang di buat otomatis oleh library `@wppconnect-team/wppconnect`

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

## `3. API Change Device`

**Catatan:**

- Api ini digunakan untuk memutuskan tautan WhatsApp dan menampilkan QR Code ulang yang dapat discan mengunakan nomor WhatsApp yang diinginkan.

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
| sessionName | bot1 | string | ya | Nama dari sesi yang akan di diganti tauntan WhatsAppnya. |

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

  const response = await fetch("/api/b/", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (result.success) {
    // lakukan sesuatu ketika berhasil pergantian perangkat
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
  "success": true
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
    "error": "Internal server error"
  }
  ```

## `4. API Get QR Code`

**Catatan:**

- Api ini di gunakan untuk mengambil dan mengecek status dari QR Code yang di hasilkan oleh library `@wppconnect-team/wppconnect`

**Endpoint:**

- URL: `http://localhost:3000/api/b/qr`
- Method : `POST`

**Header:**
| Key | Value | Keterangan |
|-----|-------|------------|
| Authorization | Bearer {API_TOKEN} | Ganti {API_TOKEN} dengan token yang didapat |
| Content-Type | application/json | Memberi tahu server bahwa data yang dikirim dalam request body dalam format JSON (JavaScript Object Notation). |

**Body:**
| Parameter | Contoh nilai | Tipe | Wajib | Keterangan |
|-----------|--------------|------|-------|------------|
| sessionName | bot1 | string | ya | Nama dari sesi yang akan di diganti tauntan WhatsAppnya. |

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

  const response = await fetch("/api/b/qr", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (result.success) {
    // lakukan sesuatu ketika berhasil
  } else {
    alert(result.error);
  }
} catch (error) {
  alert(error.message);
}
```

**Response Berhasil:**

- Jika QR Code belum discan

```json
{
  "success": true,
  "qr": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAA...", //berisi data qr base64Qr (Sebuah string Base64 yang merepresentasikan gambar QR code.)
  "statusQR": "ready"
}
```

- Jika QR Code sudah discan dan tidak ada masalah saat scan (dari library `@wppconnect-team/wppconnect`)

```json
{
  "success": true,
  "statusQR": "qrReadSuccess"
}
```

- Jika QR Code masih dalam proses pembuatan

```json
{
  "success": true,
  "statusQR": "not_ready"
}
```

- Jika server gagal mengautentikasi QR Code (dari library `@wppconnect-team/wppconnect`)

```json
{
  "success": true,
  "statusQR": "qrReadError"
}
```

- Jika browser berhenti saat pemindaian kode QR sedang berlangsung (dari library `@wppconnect-team/wppconnect`)

```json
{
  "success": true,
  "statusQR": "qrReadFail"
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

- Jika error server:
  ```json
  {
    "success": false,
    "error": "Internal server error"
  }
  ```

## `4. API Send Bulk Mesage`

**Catatan:**

- API ini di gunakan untuk melakukan pengiriman pesan secara masal berdasarkan nomor WhatsApp.

**Endpoint:**

- URL: `http://localhost:3000/api/b/send-bulk-message`
- Method : `POST`

**Header:**
| Key | Value | Keterangan |
|-----|-------|------------|
| Authorization | Bearer {API_TOKEN} | Ganti {API_TOKEN} dengan token yang didapat |
| Content-Type | application/json | Memberi tahu server bahwa data yang dikirim dalam request body dalam format JSON (JavaScript Object Notation). |

**Body:**
| Parameter | Contoh nilai | Tipe | Wajib | Keterangan |
|-----------|--------------|------|-------|------------|
| sessionName | bot1 | string | ya | Nama dari sesi yang akan di diganti tauntan WhatsAppnya. |
| number | ["0857476353656", "6285765654321"] | array | ya | Nomor WhatsApp tujuan pengiriman pesan. |
| message | ["Pesan nomo 1", "Pesan nomor 2"] | array | ya | Isi dari pesan yang akan di kirim. |
| delay | 300 | number | tidak | Secara default nilainya 300 (satuan ms). ini adalah delay pengiriman pesan ke masing-masing nomor WhatsApp tujuan. |

**Contoh Body (JSON):**

```json
{
  "sessionName": "bot1",
  "number": ["0857476353656", "6285765654321"],
  "message": ["Pesan nomo 1", "Pesan nomor 2"],
  "delay": 400
}
```

**Contoh Request (JavaScript):**

```javascript
try {
  const data = {
    sessionName: "bot1",
    number: ["0857476353656", "6285765654321"],
    message: ["Pesan nomo 1", "Pesan nomor 2"],
    delay: 400,
  };
  const token = "api_token_anda";

  const response = await fetch("/api/b/send-bulk-message", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (result.success) {
    // lakukan sesuatu ketika berhasil
  } else {
    alert(result.error);
  }
} catch (error) {
  alert(error.message);
}
```

**Response Berhasil:**

- Jika Berhasil mengirim pesan

```json
{
  "success": true,
  "results": [
    {
      "no": "62857476353656",
      "status": "success",
      "message": "Pesan nomo 1"
    },
    {
      "no": "6285765654321",
      "status": "success",
      "message": "Pesan nomor 2"
    }
  ]
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

- Jika message tipe datanya bukan string atau array:

  ```json
  {
    "success": false,
    "error": "Tipe data message harus String atau array."
  }
  ```

- Jika number tipe datanya bukan string atau array:

  ```json
  {
    "success": false,
    "error": "Tipe data number harus String atau array."
  }
  ```

- Jika QR Code belum di scan atau terautentikasi:

  ```json
  {
    "success": false,
    "error": "WhatsApp Gateway belum terautentikasi! Silahkan scan QR code terlebih dahulu."
  }
  ```

- Jika gagal pada saat mengirim pesan:

  ```json
  {
    "success": true,
    "results": [
      {
        "no": "6285+476353656",
        "status": "failed",
        "message": "Pesan nomo 1",
        "error": "wid error: invalid wid"
      },
      {
        "no": "62+6285765654321",
        "status": "failed",
        "message": "Pesan nomor 2",
        "error": "wid error: invalid wid"
      }
    ]
  }
  ```

- Jika error server:
  ```json
  {
    "success": false,
    "error": "Internal server error"
  }
  ```
