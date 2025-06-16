(() => {
  let dataExcel = new Map();
  let checkedFilters = {};
  let QRS = null;
  let sessionName = null;
  const isLogin = async () => {
    try {
      const response = await fetch("/api/session", {
        method: "GET",
        credentials: "include",
      });
      const result = await response.json();
      if (result.success) {
        sessionName = result.data;
      }
    } catch (error) {}
  };

  const selectTemplat = async () => {
    const templatesList = document.getElementById("templatesList");
    const data = { sessionName: sessionName };
    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      //   if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      templatesList.innerHTML = "";
      if (result.data && result.success) {
        const data = result.data;
        const templateForm = document.getElementById("templateForm");
        const templateItem = document.createElement("div");
        templateItem.className = "template-item";
        templateItem.innerHTML = data
          .map((d) => {
            const message = d.message || "(tidak ada pesan)";
            return DOMPurify.sanitize(`
            <div style="border: 1px solid #ddd; padding: 5px; margin: 10px;">
              <h4 style="margin: 0 0 5px 0;">${d.name}</h4>
              <p style="margin: 0; font-size: 14px; color: #666;">Jenis Pesan: "${
                d.type
              }"</p>
              ${
                d.key_message
                  ? `<p style="margin: 0; font-size: 14px; color: #666;">Trigger: "${d.key_message}"</p>`
                  : ""
              }
              <p style="margin: 0; font-size: 14px; color: #666;">Pesan: "${message}"</p>
              <p style="margin: 0; font-size: 12px; color: #999;">Tipe: ${
                d.direction == "in" ? "Pesan Masuk" : "Pesan Keluar"
              }</p>
              <div class="template-actions" style="margin-top: 5px;">
                <button value="${d.id}" class="template-edit">Edit</button>
                <button value="${d.id}"  class="template-delete">Hapus</button>
              </div>
            </div>`);
          })
          .join(""); // gabungkan semua jadi satu string

        templatesList.prepend(templateItem);
        templateForm.style.display = "none";
        const Eedit = document.querySelectorAll(".template-edit");
        const Edelete = document.querySelectorAll(".template-delete");
        eventEditDelete(Eedit, Edelete);
      } else {
        const templateItem = document.createElement("div");
        templateItem.className = "template-item";
        templateItem.innerHTML =
          DOMPurify.sanitize(`<div style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px;">
        <h4 style="margin: 0 0 5px 0;">${result.error}</h4>
        </div>`);
        templateItem.innerHTML = "";
        templatesList.prepend(templateItem);
        templateForm.style.display = "none";
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const readsTemplateMessage = async (id) => {
    try {
      const tamplateData = {
        id: id,
        sessionName: sessionName,
      };
      const response = await fetch("/api/readsTemplate", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tamplateData),
      });
      const result = await response.json();
      if (result.success) {
        return result.data;
      } else {
        return false;
      }
    } catch (error) {
      console.log(error);
    }
  };
  // const formatDateToString = (date) => {
  //   const monthNames = [
  //     "Januari",
  //     "Februari",
  //     "Maret",
  //     "April",
  //     "Mei",
  //     "Juni",
  //     "Juli",
  //     "Agustus",
  //     "September",
  //     "Oktober",
  //     "November",
  //     "Desember",
  //   ];

  //   const dateObj = new Date(date);
  //   const day = dateObj.getDate();
  //   const month = monthNames[dateObj.getMonth()];
  //   const years = dateObj.getFullYear();

  //   return `${day} ${month} ${years}`;
  // };
  const formatMonthYears = (date) => {
    const [years, month] = date.split("-");
    const monthNames = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    const monthName = monthNames[parseInt(month) - 1];
    return `${monthName} ${years}`;
  };

  const formatToRupiah = (number) => {
    return new Intl.NumberFormat("id-ID").format(number);
  };

  const compileMessageBulk = async (message, data, periode) => {
    try {
      let messages = [];
      const formatPeriode = formatMonthYears(periode);
      const processedData = data.map((item) => ({
        ...item,
        periode: formatPeriode,
      }));
      for (const dt of processedData) {
        const response = await fetch("/api/compile", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            templateMessage: message,
            filleds: dt,
          }),
        });
        const result = await response.json();
        if (result.success) {
          messages.push(result.data);
        }
      }
      if (messages.length > 0) {
        return messages.join("\n----------\n");
      } else {
        return false;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const eventInputChange = (ElementEvent, selectionTemplate, message) => {
    ElementEvent.onchange = null;
    ElementEvent.onchange = () => {
      if (this.value !== "") {
        selectTemplatByType(selectionTemplate, "personal");
        message.value = "";
      }
    };
  };

  const onclickMessageTemplate = () => {
    const selectionTemplate2 = document.getElementById(
      "selectionTemplateMessage2"
    );
    const monthPicker = document.getElementById("monthPicker");
    const fileExcel = document.getElementById("fileUpload");
    const btn = document.querySelectorAll(".btnTemplates");
    const message = document.getElementById("bulkMessage");
    const message3 = document.getElementById("groupMessage");
    const formMultiple = btn[0].closest("#bulk");
    for (const b of btn) {
      b.onclick = null;
      b.onclick = async () => {
        if (formMultiple && (!fileExcel.files[0] || !dataExcel.get("excel"))) {
          alert("Silahkan upload file excel terlebih dahulu!");
          return;
        } else if (formMultiple && !monthPicker.value) {
          alert("Silahkan pilih periode pembayaran terlebih dahulu!");
          return;
        }
        const data = await readsTemplateMessage(b.value);
        btn.forEach((item) => item.classList.remove("activeToggleTemplates"));
        if (data.type == "personal" && formMultiple) {
          const compile = await compileMessageBulk(
            data.message,
            dataExcel.get("filtered"),
            monthPicker.value
          );
          if (compile) {
            message.value = compile;
            b.classList.add("activeToggleTemplates");
          } else {
            alert("Data Pelanggan kosong!");
          }
        } else {
          message3.value = data.message;
          b.classList.add("activeToggleTemplates");
        }
      };
    }
    eventInputChange(fileExcel, selectionTemplate2, message);
    eventInputChange(monthPicker, selectionTemplate2, message);
  };

  const selectTemplatByType = async (selectionTemplate, type) => {
    if (sessionName) {
      try {
        const data = { sessionName: sessionName, type: type };
        const response = await fetch("/api/", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        //   if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        selectionTemplate.innerHTML = "";
        const dataTemplate = result.data;
        if (dataTemplate && result.success) {
          selectionTemplate.innerHTML = dataTemplate
            .map((d) => {
              return DOMPurify.sanitize(
                `<Button type="button" value="${d.id}" class='btnTemplates' style="border: 1px solid #999; padding: 0 10px; border-radius: 5px; color: #999; background-color: unset;">${d.name}</Button>`
              );
            })
            .join("");
          onclickMessageTemplate();
        } else {
          selectionTemplate.innerHTML = DOMPurify.sanitize(
            `<p style="color:#ddd">Template kosong!</p>`
          );
        }
      } catch (error) {
        console.log(error.message);
      }
    } else {
      selectionTemplate.innerHTML = DOMPurify.sanitize(
        `<p style="color:#ddd">Template kosong!</p>`
      );
    }
  };

  const updateORInsertTemplate = async (
    messageDirectionToggle,
    isInsert = true,
    id = 0
  ) => {
    try {
      const name = document.getElementById("templateName").value.trim();
      const jenisPesan = document.getElementById("jenisPesan").value.trim();
      const trigger =
        document.getElementById("templateTrigger").value.trim() || null;
      const message = document.getElementById("templateMessage").value.trim();
      const direction = messageDirectionToggle.checked == true ? "in" : "out";
      const fileUploadTemplate = document.getElementById("fileUploadTemplate");
      const uploadButtonTamplate = document.getElementById(
        "uploadButtonTamplate"
      );

      // Validasi berbeda untuk pesan masuk/keluar
      if (!name || !jenisPesan || !message) {
        alert("Harap isi semua field wajib!");
        return;
      }

      // Hanya validasi trigger jika pesan masuk
      if (messageDirectionToggle.checked && !trigger) {
        alert("Harap isi trigger untuk pesan masuk!");
        return;
      }
      const isInputFile =
        fileUploadTemplate.tagName === "INPUT" &&
        fileUploadTemplate.type === "file";
      const isUploadMode = uploadButtonTamplate.value !== "change";
      const isUpload = toggleUploadTemplate();

      if (
        !messageDirectionToggle.checked &&
        isUpload &&
        isInputFile &&
        isUploadMode
      ) {
        alert("Silakan upload Excel terlebih dahulu!");
        return;
      }
      try {
        if (sessionName) {
          if (isInsert && id == 0) {
            const data = {
              sessionName: validateInput(sessionName),
              name: validateInput(name),
              keyMessage:
                messageDirectionToggle.checked == true
                  ? validateInput(trigger)
                  : null,
              message: validateInput(message),
              direction: direction,
              type: validateInput(jenisPesan),
              placeholder:
                !isInputFile && !messageDirectionToggle.checked
                  ? validateInput(fileUploadTemplate.value.trim())
                  : null,
            };
            const response = await fetch("/api/template", {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(data),
            });
            const result = await response.json();
            if (result.success) {
              await selectTemplat();
            }
            alert(result.message);
          } else {
            const data = {
              id: id,
              sessionName: validateInput(sessionName),
              name: validateInput(name),
              keyMessage:
                messageDirectionToggle.checked == true
                  ? validateInput(trigger)
                  : null,
              message: validateInput(message),
              direction: direction,
              type: validateInput(jenisPesan),
              placeholder:
                !isInputFile && !messageDirectionToggle.checked
                  ? validateInput(fileUploadTemplate.value.trim())
                  : null,
            };
            const response = await fetch("/api/template", {
              method: "PUT",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(data),
            });
            const result = await response.json();
            if (result.success) {
              await selectTemplat();
            }
            alert(result.message);
          }
        } else {
          alert("Silahkan Login terlebih dahulu");
        }
      } catch (error) {
        console.log(error);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const toggleSaveButton = (isInsert) => {
    const btnInsert = document.getElementById("insertBtn");
    const btnUpdate = document.getElementById("updateBtn");
    if (isInsert) {
      btnInsert.style.display = "block";
      btnUpdate.style.display = "none";
    } else {
      btnInsert.style.display = "none";
      btnUpdate.style.display = "block";
    }
  };

  const toggleInputTrigger = () => {
    const messageDirectionToggle = document.getElementById(
      "messageDirectionToggle"
    );
    const toggleLabel = document.getElementById("toggleLabel");
    const triggerField = document.getElementById("toggleTrigger");
    const triggerInput = document.getElementById("templateTrigger");
    if (messageDirectionToggle.checked == true) {
      toggleLabel.textContent = "Pesan Masuk";
      triggerField.style.display = "block";
      triggerInput.required = true;
    } else {
      toggleLabel.textContent = "Pesan Keluar";
      triggerField.style.display = "none";
      triggerInput.required = false;
    }
  };

  const checktoggleMessage = (element, idAndClassToggle) => {
    const toggleContent = Array.from(
      document.querySelectorAll(idAndClassToggle)
    );
    const inputOrSelectToggle = document.querySelectorAll(
      `${idAndClassToggle} input, ${idAndClassToggle} select`
    );
    const message = document.getElementById("bulkMessage");
    const message3 = document.getElementById("groupMessage");
    if (!element.checked) {
      toggleContent.forEach((t) => {
        t.classList.add("hiddenToggle");
      });
      inputOrSelectToggle.forEach((i) => {
        i.required = false;
        i.value = "";
      });
      if (idAndClassToggle.includes("#bulk")) {
        message.disabled = false;
      } else if (idAndClassToggle.includes("#group")) {
        message3.disabled = false;
      }
    } else {
      toggleContent.forEach((t) => {
        t.classList.remove("hiddenToggle");
      });
      inputOrSelectToggle.forEach((i) => {
        i.required = true;
      });
      if (idAndClassToggle.includes("#bulk")) {
        message.disabled = true;
      } else if (idAndClassToggle.includes("#group")) {
        message3.disabled = true;
      }
    }
  };

  const eventEditDelete = async (elementEdit, elementDelete) => {
    try {
      const templateForm = document.getElementById("templateForm");
      const messageDirectionToggle = document.getElementById(
        "messageDirectionToggle"
      );

      const templateName = document.getElementById("templateName");
      const typeMessage = document.getElementById("jenisPesan");
      const triggerMessage = document.getElementById("templateTrigger");
      const message = document.getElementById("templateMessage");
      const btnUpdate = document.getElementById("updateBtn");

      elementEdit.forEach(async (edit) => {
        edit.onclick = null;
        edit.onclick = async () => {
          const id = edit.value;
          const tamplateData = {
            id: id,
            sessionName: sessionName,
          };
          try {
            const response = await fetch("/api/readsTemplate", {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(tamplateData),
            });
            const result = await response.json();
            if (result.success) {
              templateName.value = result.data.name;
              typeMessage.value = result.data.type;
              triggerMessage.value = result.data.key_message;
              message.value = result.data.message;
              messageDirectionToggle.checked = result.data.direction === "in";
              showPlaceholderTemplate(result.data.placeholder);
              toggleInputTrigger();
              toggleUploadTemplate();
              templateForm.style.display = "block";
              toggleSaveButton(false);
              btnUpdate.onclick = null;
              (btnUpdate.onclick = () => {
                updateORInsertTemplate(messageDirectionToggle, false, id);
              }),
                { once: true };
            }
          } catch (error) {
            console.log(error);
          }
        };
      });

      elementDelete.forEach(async (del) => {
        del.onclick = null;
        del.onclick = async () => {
          const isTrue = confirm("Apakah Anda yakin ingin Menhapus data ini?");
          if (isTrue) {
            const id = del.value;
            const tamplateData = {
              id: id,
              sessionName: sessionName
            };
            const response = await fetch(
              "/api/template",
              {
                method: "DELETE",
                credentials: "include",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(tamplateData),
              },
              { once: true }
            );
            const result = await response.json();
            if (result.success) {
              await selectTemplat();
            }
            alert(result.message);
          }
        };
      });
    } catch (error) {
      console.log(error);
    }
  };

  const toggleUploadTemplate = () => {
    const typeMessage = document.getElementById("jenisPesan");
    const uploadTamplate = document.getElementById("uploadTamplate");
    const messageDirectionToggle = document.getElementById(
      "messageDirectionToggle"
    );
    if (typeMessage.value == "personal" && !messageDirectionToggle.checked) {
      uploadTamplate.style.display = "block";
      return true;
    } else {
      uploadTamplate.style.display = "none";
      return false;
    }
  };

  const showPlaceholderTemplate = async (data = null) => {
    const btnUpload = document.getElementById("uploadButtonTamplate");
    const fileExcel = document.getElementById("fileUploadTemplate");
    const labelFile = document.querySelector(`label[for="${fileExcel.id}"]`);
    const textFormat = document.getElementById("textFromatUpload");
    if (btnUpload.value == "upload" && data) {
      const textarea = document.createElement("textarea");
      textarea.id = fileExcel.id;
      textarea.name = fileExcel.name;
      textarea.rows = 4;
      textarea.cols = 50;
      textarea.classList.add(fileExcel.className);
      fileExcel.parentNode.replaceChild(textarea, fileExcel);
      btnUpload.value = "change";
      btnUpload.innerText = "Ganti Placeholder";
      labelFile.textContent =
        "Gunakan placeholder di isi Pesan untuk otomatis mengganti data saat kirim pesan massal.";
      textFormat.style.display = "none";
      const dataArray = Array.isArray(data) ? data : [data];
      textarea.value = dataArray.join(", ");
      textarea.disabled = true;
    } else {
      if (data == null) {
        const input = document.createElement("input");
        input.id = fileExcel.id;
        input.name = fileExcel.name;
        input.type = "file";
        input.accept = ".xlsx,.xls";
        const textarea = document.getElementById(fileExcel.id);
        input.classList.add(fileExcel.className);
        textarea.parentNode.replaceChild(input, textarea);

        btnUpload.value = "upload";
        btnUpload.innerText = "Upload";
        labelFile.textContent = "Upload File Excel";
        textFormat.style.display = "block";
      } else {
        const dataArray = Array.isArray(data) ? data : [data];
        fileExcel.value = dataArray.join(", ");
      }
    }
    await uploadFileTemplate();
  };

  const uploadFileTemplate = async () => {
    const btnUpload = document.getElementById("uploadButtonTamplate");
    const fileExcel = document.getElementById("fileUploadTemplate");
    btnUpload.onclick = null;
    btnUpload.onclick = async () => {
      if (btnUpload.value == "upload") {
        if (!fileExcel.files[0]) {
          alert("Pilih File terlebih dahulu");
          return;
        }
        const file = fileExcel.files[0];
        if (file) {
          const formData = new FormData();
          formData.append("excel", file);
          try {
            const response = await fetch("api/preview-excel-template", {
              method: "POST",
              credentials: "include",
              body: formData,
            });
            const result = await response.json();
            if (result.success) {
              showPlaceholderTemplate(result.data);
            } else {
              console.log(result.error);
            }
          } catch (error) {
            console.log(error);
          }
        } else {
          alert("Pilih file terlebih dahulu.");
        }
      } else {
        showPlaceholderTemplate();
      }
    };
  };

  const initializeAllFunction = () => {
    const togglePersonalMessage2 = document.getElementById(
      "toggleMultipleMessage"
    );
    const typeMessage = document.getElementById("jenisPesan");
    const message = document.getElementById("bulkMessage");
    const message3 = document.getElementById("groupMessage");
    const toggleGrupMessage = document.getElementById("toggleGrupMessage");
    const selectionTemplate2 = document.getElementById(
      "selectionTemplateMessage2"
    );
    const selectionTemplate3 = document.getElementById(
      "selectionTemplateMessage3"
    );

    const addTemplateBtn = document.getElementById("addTemplateBtn");
    const templateForm = document.getElementById("templateForm");
    const cancelTemplateBtn = document.getElementById("cancelTemplateBtn");
    const btnInsert = document.getElementById("insertBtn");
    // const templatesList = document.getElementById("templatesList");
    const messageDirectionToggle = document.getElementById(
      "messageDirectionToggle"
    );
    // Inisialisasi awal
    messageDirectionToggle.checked = true; // Default pesan masuk
    togglePersonalMessage2.checked = true;
    toggleGrupMessage.checked = true;
    checktoggleMessage(togglePersonalMessage2, "#bulk .toggleContent");
    checktoggleMessage(toggleGrupMessage, "#group .toggleContent");
    toggleUploadTemplate();
    toggleInputTrigger();
    typeMessage.onchange = null;
    typeMessage.onchange = () => {
      toggleUploadTemplate();
    };
    messageDirectionToggle.onchange = null;
    messageDirectionToggle.onchange = () => {
      toggleInputTrigger();
      toggleUploadTemplate();
    };
    togglePersonalMessage2.onchange = null;
    togglePersonalMessage2.onchange = () => {
      checktoggleMessage(togglePersonalMessage2, "#bulk .toggleContent");
      getLabelFileExcel(dataExcel.get("filtered"));
      message.value = "";
      selectTemplatByType(selectionTemplate2, "personal");
    };
    toggleGrupMessage.onchange = null;
    toggleGrupMessage.onchange = () => {
      checktoggleMessage(toggleGrupMessage, "#group .toggleContent");
      message3.value = "";
      selectTemplatByType(selectionTemplate3, "group");
    };
    toggleSaveButton(true);
    // Tampilkan form saat tombol plus diklik ###
    addTemplateBtn.onclick = null;
    addTemplateBtn.onclick = function () {
      if (sessionName) {
        templateForm.style.display = "block";
        // Reset form
        document.getElementById("templateName").value = "";
        document.getElementById("jenisPesan").value = "";
        document.getElementById("templateTrigger").value = "";
        document.getElementById("templateMessage").value = "";
        toggleSaveButton(true);
        toggleInputTrigger();
        toggleUploadTemplate();
        showPlaceholderTemplate();
      } else {
        alert("Silahkan login terlebih dahulu!.");
      }
    };
    cancelTemplateBtn.onclick = null;
    cancelTemplateBtn.onclick = function () {
      templateForm.style.display = "none";
    };
    btnInsert.onclick = null;
    btnInsert.onclick = () => {
      updateORInsertTemplate(messageDirectionToggle, true);
    };

    const fileExcel = document.getElementById("fileUpload");
    fileExcel.onchange = null;
    fileExcel.onchange = () => {
      const placeholderBulk = document.getElementById("placeholderBulk");
      makeTable();
      getLabelFileExcel(dataExcel.get("filtered"));
      placeholderBulk.value = "";
      checkedFilters = {};
    };
    selectTemplatByType(selectionTemplate2, "personal");
    reanderFileExcel();
    getLabelFileExcel(dataExcel.get("filtered"));
  };

  async function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    const selectionTemplate2 = document.getElementById(
      "selectionTemplateMessage2"
    );
    const selectionTemplate3 = document.getElementById(
      "selectionTemplateMessage3"
    );
    const message = document.getElementById("bulkMessage");
    const message3 = document.getElementById("groupMessage");
    message.value = "";
    message3.value = "";
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].classList.remove("active");
    }

    tablinks = document.getElementsByClassName("tab");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].classList.remove("active");
    }
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
    if (tabName == "template-pesan" && sessionName) {
      await selectTemplat();
      await uploadFileTemplate();
    } else if (tabName == "bulk") {
      selectTemplatByType(selectionTemplate2, "personal");
      reanderFileExcel();
      getLabelFileExcel(dataExcel.get("filtered"));
    } else if (tabName == "group") {
      selectionTemplate2.innerHTML = "";
      selectTemplatByType(selectionTemplate3, "group");
      await getGroups();
    }
  }

  const applyFilterAndRenderTable = (originalData) => {
    const filtered = originalData.filter((item) => {
      return Object.entries(checkedFilters).every(([key, values]) => {
        if (!values.length) return true;
        return values.includes(String(item[key]));
      });
    });
    dataExcel.set("filtered", filtered);
    reanderFilterTable(filtered);
  };

  let currentlyOpenDrop = null; // menyimpan dropDown yang sedang terbuka

  const updateThBorder = (elementFilter) => {
    const hasChecked =
      elementFilter.querySelectorAll('input[type="checkbox"]:checked').length >
      0;
    const thElement = elementFilter.closest("th");
    const spanElemen = thElement.querySelector("span");
    spanElemen.style.display = "inline-block";
    if (spanElemen) {
      if (hasChecked) {
        spanElemen.style.borderBottom = "2px solid #25d366";
      } else {
        spanElemen.style.border = "none";
      }
    }
  };
  // Fungsi buat isi dropdown checkbox berdasarkan kolom dan data
  const makeFilterTable = (keyFilter, data, index) => {
    const fieldFilter = [
      ...new Set(data.map((item) => String(item[keyFilter]))),
    ];
    const selectedValues = (checkedFilters[keyFilter] || []).map(String);
    const bulkMessage = document.getElementById("bulkMessage");
    const btnDeleteMessage = document.getElementById("btnDeleteMessage");
    const toggleMultipleMessage = document.getElementById(
      "toggleMultipleMessage"
    );
    const selectionTemplate2 = document.getElementById(
      "selectionTemplateMessage2"
    );
    const elementFilter = document.getElementById(`drop${index}`);

    if (!elementFilter) {
      console.error(`Elemen drop${index} tidak ditemukan`);
      return;
    }

    // Buat checkbox HTML
    const checkboxes = fieldFilter
      .map(
        (item, i) => `
    <label for="filter-${index}-${i}" style="display:flex;align-items: center; justify-content: left; cursor:pointer; margin-bottom:4px;">
      <input id="filter-${index}-${i}" type="checkbox" style="width: 20px" value="${item}" ${
          selectedValues.includes(item) ? "checked" : ""
        } />
      <p style="text-wrap: nowrap">${item}</p>
    </label>
  `
      )
      .join("");

    elementFilter.innerHTML = DOMPurify.sanitize(checkboxes);

    elementFilter
      .querySelectorAll('input[type="checkbox"]')
      .forEach((input) => {
        input.onchange = null;
        input.onchange = (e) => {
          e.stopPropagation(); // Cegah penutupan dropdown saat checkbox diklik

          const val = e.target.value;
          const isChecked = e.target.checked;

          if (!checkedFilters[keyFilter]) checkedFilters[keyFilter] = [];

          if (isChecked) {
            if (!checkedFilters[keyFilter].includes(val)) {
              checkedFilters[keyFilter].push(val);
            }
          } else {
            checkedFilters[keyFilter] = checkedFilters[keyFilter].filter(
              (v) => v !== val
            );
          }
          applyFilterAndRenderTable(dataExcel.get("excel"));
          updateThBorder(elementFilter);
          bulkMessage.value = "";
          if (toggleMultipleMessage.checked) {
            selectTemplatByType(selectionTemplate2, "personal");
          } else {
            btnDeleteMessage.click();
          }
        };
        input.onclick = null;
        input.onclick = (e) => {
          e.stopPropagation();
        };
      });
    // stopPropagation di semua label
    elementFilter.querySelectorAll("label").forEach((label) => {
      label.onclick = null;
      label.onclick = (e) => {
        e.stopPropagation(); // Cegah bubbling dari label yang bisa menutup dropdown
      };
    });
  };

  const reanderFilterTable = (data) => {
    const bodyTable = document.querySelector("#bodyTableExcel");
    const theadTable = Object.keys(dataExcel.get("excel")[0]);
    const element = `${data
      .map(
        (item) => `
          <tr>${theadTable.map((v) => `<td>${item[v]}</td>`).join("")}
          </tr>
        `
      )
      .join("")}`;
    bodyTable.innerHTML = element;
  };

  // Fungsi utama membuat tabel dan event dropdown
  const makeTable = (data = null) => {
    const containerTable = document.getElementById("customerTable");

    if (!data || data.length === 0) {
      containerTable.innerHTML = DOMPurify.sanitize(
        "<p>Data masih kosong. Silahkan Upload file excel!</p>"
      );
      return;
    }
    const theadTable = Object.keys(data[0]);

    const element = `
    <table class="table border border-black" style="min-width: max-content">
      <thead>
        <tr>
          ${theadTable
            .map(
              (item, i) => `
            <th scope="col" data-key="${item}" data-index="${i}">
              <span>${item} <i class="fa-solid fa-caret-down"></i></span>
              <div class="dropDownTable" id="drop${i}" style="display:none; position:absolute; background:white; border:1px solid #ccc; padding:8px; z-index:100;"></div>
            </th>
          `
            )
            .join("")}
        </tr>
      </thead>
      <tbody class="table-success" id="bodyTableExcel">
        ${data
          .map(
            (item) => `
          <tr>
            ${theadTable
              .map(
                (v) => `
              <td>${item[v]}</td>
            `
              )
              .join("")}
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;

    containerTable.innerHTML = DOMPurify.sanitize(element);

    const thElements = containerTable.querySelectorAll("th[data-key]");

    thElements.forEach((th) => {
      th.onclick = null;
      th.onclick = (e) => {
        const index = th.getAttribute("data-index");
        const key = th.getAttribute("data-key");

        // Tutup dropdown yang terbuka jika klik th lain
        if (
          currentlyOpenDrop &&
          currentlyOpenDrop !== th.querySelector(".dropDownTable")
        ) {
          currentlyOpenDrop.style.display = "none";
        }

        const dropdown = th.querySelector(".dropDownTable");

        // Toggle tampilannya
        if (dropdown.style.display === "block") {
          dropdown.style.display = "none";
          currentlyOpenDrop = null;
        } else {
          dropdown.style.display = "block";
          makeFilterTable(key, dataExcel.get("excel"), index);
          currentlyOpenDrop = dropdown;
        }

        e.stopPropagation();
      };
    });

    document.onclick = null;
    document.onclick = (e) => {
      if (
        currentlyOpenDrop &&
        !e.target.closest(".dropDownTable") &&
        !e.target.closest("th")
      ) {
        currentlyOpenDrop.style.display = "none";
        currentlyOpenDrop = null;
      }
    };
  };

  const reanderFileExcel = () => {
    const btnUpload = document.getElementById("uploadButton");
    const fileExcel = document.getElementById("fileUpload");
    btnUpload.onclick = null;
    btnUpload.onclick = async () => {
      if (!sessionName) {
        alert("Silahkan login terlebih dahulu!");
        return;
      }
      const file = fileExcel.files[0];
      if (file) {
        const formData = new FormData();
        formData.append("excel", file);
        try {
          const response = await fetch("api/preview-excel", {
            method: "POST",
            credentials: "include",
            body: formData,
          });

          const result = await response.json();
          if (result.success) {
            dataExcel.set("excel", result.data);
            dataExcel.set("filtered", result.data);
            makeTable(result.data);
            getLabelFileExcel(result.data);
          } else {
            console.log(result.error);
          }
        } catch (error) {
          console.log(error);
        }
      } else {
        alert("Pilih file terlebih dahulu.");
      }
    };
  };
  const getLabelFileExcel = (data) => {
    if (data) {
      const divLabel = document.getElementById("divPlaceholderBulk");
      const bulkMessage = document.getElementById("bulkMessage");
      const btnDeleteMessage = document.getElementById("btnDeleteMessage");
      const monthPicker = document.getElementById("monthPicker");
      const togglePersonalMessage2 = document.getElementById(
        "toggleMultipleMessage"
      );
      const submitBtn = document.getElementById("btnSubmitBulk");
      if (!togglePersonalMessage2.checked) {
        const label = Object.keys(dataExcel.get("excel")[0]).map((v) => {
          return `{${v}}`;
        });
        btnDeleteMessage.style.display = "none";
        bulkMessage.disabled = false;
        submitBtn.type = "button";
        submitBtn.innerText = "Render Pesan";
        if (!label.includes("{periode}")) {
          label.push("{periode}");
        }
        document.getElementById("placeholderBulk").value = label.join(", ");
        divLabel.style.display = "block";
        submitBtn.onclick = null;
        submitBtn.onclick = async (event) => {
          if (submitBtn.type == "button" && bulkMessage.value.trim() != "") {
            event.preventDefault();
            const isTrue = confirm(
              "Yakin ingin merender pesan? \nPastikan pesannya sudah selesai ditulis, karena tidak bisa diedit setelah dirender."
            );
            if (isTrue) {
              const tempMessage = bulkMessage.value;
              const compile = await compileMessageBulk(
                tempMessage,
                dataExcel.get("filtered"),
                monthPicker.value
              );
              if (!compile) {
                alert("Data Pelanggan kosong!");
                return;
              }
              bulkMessage.value = compile;
              bulkMessage.disabled = true;
              btnDeleteMessage.style.display = "block";
              btnDeleteMessage.onclick = null;
              btnDeleteMessage.onclick = () => {
                bulkMessage.value = "";
                submitBtn.type = "button";
                submitBtn.innerText = "Render Pesan";
                btnDeleteMessage.style.display = "none";
                bulkMessage.disabled = false;
              };
              submitBtn.type = "submit";
              submitBtn.innerText = "Kirim Pesan";
            }
          } else if (
            submitBtn.type == "button" &&
            bulkMessage.value.trim() == ""
          ) {
            alert("Pesan tidak boleh kosong!");
          }
        };
      } else {
        document.getElementById("placeholderBulk").value = "";
        divLabel.style.display = "none";
        btnDeleteMessage.style.display = "none";
        submitBtn.type = "submit";
        submitBtn.innerText = " Kirim Pesan";
      }
    }
  };
  // Validasi nomor WhatsApp indo
  function validatePhoneNumber(number) {
    const regex = /^[1-9][0-9]{7,11}$/;
    return regex.test(number);
  }

  const startDynamicLoading = (duration) => {
    const loadingContainer = document.getElementById("loadingContainer");
    const progressText = document.getElementById("progressText");
    const progressBar = document.getElementById("progressBar");
    const content = document.getElementById("content");

    // Reset dan tampilkan loader
    loadingContainer.style.display = "block";
    content.style.display = "none";
    progressBar.style.width = "0%";

    const startTime = Date.now();
    const endTime = startTime + duration;

    function updateLoading() {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);

      // Update progress bar dan text
      progressBar.style.width = `${progress}%`;
      progressText.textContent = `Loading... ${Math.round(progress)}%`;

      if (currentTime < endTime) {
        requestAnimationFrame(updateLoading);
      } else {
        // Sembunyikan loader dan tampilkan konten
        loadingContainer.style.display = "none";
        content.style.display = "block";
      }
    }

    updateLoading();
  };
  // Event listeners
  const validateInput = (input) => {
    const data = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
    });
    return data;
  };

  document
    .getElementById("bulkForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      if (!sessionName) {
        alert("Silahkan login terlebih dahulu!");
        return;
      }
      const message = document.getElementById("bulkMessage");
      if (message.value == "") {
        alert("Pesan tidak boleh kosong!");
        return;
      }
      if (!dataExcel.get("filtered")) {
        return alert("Silahkan upload data pelanggan terlebih dahulu.");
      }
      const delay = 300;
      const phoneNumber = dataExcel.get("filtered").map((n) => {
        const no = parseInt(n["Nomor HP"]);
        return `62${String(validateInput(no))}`;
      });

      const currentDelay = delay * phoneNumber.length + 3300;
      startDynamicLoading(currentDelay);
      const formData = {
        sessionName: validateInput(sessionName),
        number: phoneNumber,
        message: document
          .getElementById("bulkMessage")
          .value.split("\n----------\n"),
        delay: delay,
      };
      try {
        const response = await fetch("/api/send-bulk-message", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
        const results = await response.json();
        if (results.success) {
          alert(
            "Pesan berhasil terkirim ke nomor WA: " +
              JSON.stringify(
                results.results.map((r) => {
                  return r.no;
                }),
                null,
                2
              )
          );
        } else {
          if (results.results) {
            alert(
              "Terjadi kesalahan saat mengirim pesan ke nomor WA: " +
                JSON.stringify(
                  results.results.map((r) => {
                    return r.no;
                  }),
                  null,
                  2
                ) +
                ".\nDetail Kesalahan: " +
                JSON.stringify(
                  results.results.map((r) => {
                    return r.error;
                  }),
                  null,
                  2
                ) || results.error
            );
          } else {
            alert(results.error);
          }
        }
      } catch (error) {
        console.log(error);
      }
    });

  // Form submission untuk grup
  document
    .getElementById("groupForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      const message3 = document.getElementById("groupMessage");
      if (!sessionName) {
        alert("Silahkan login terlebih dahulu!");
        return;
      }
      if (getCheckedGroupValues().length == 0) {
        alert("Pilih minimal satu group!");
        return;
      }
      if (message3.value == "") {
        alert("Pesan tidak boleh kosong!");
        return;
      }
      const delay = 300 * getCheckedGroupValues().length;
      startDynamicLoading(delay);
      const formData = {
        sessionName: validateInput(sessionName),
        groupsId: getCheckedGroupValues().map((item) =>
          validateInput(item.value)
        ),
        message: validateInput(document.getElementById("groupMessage").value),
      };

      try {
        const response = await fetch("/api/send-group", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (result.success == true) {
          alert(
            `Pesan berhasil terkirim ke grup = { ${getCheckedGroupValues()
              .map((item) => item.labelText)
              .join(", ")} }`
          );
        } else {
          alert(
            "Terjadi masalah saat mengirim pesan ke grup.\nDetail masalah: " +
              result.error
          );
        }
      } catch (error) {
        console.log(error);
      }
    });
  const logout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      const result = await response.json();

      if (result.success) {
        window.location.href = "/auth";
      } else {
        console.log(result.message);
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const deleteGroups = async () => {
    try {
      const response = await fetch("/api/group", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionName: sessionName }),
      });
      const result = await response.json();
      if (result.success) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return true;
    }
  };

  //Script untuk template Pesan
  let intervalId = null;
  document.addEventListener("DOMContentLoaded", async () => {
    await isLogin();
    initializeAllFunction();
    const tabButtons = document.querySelectorAll(".tab");
    tabButtons.forEach((button) => {
      button.addEventListener("click", function (evt) {
        const tabName = this.getAttribute("data-tab");
        openTab(evt, tabName);
      });
    });

    const clearExistingInterval = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
    if (!sessionName) {
      let result = confirm(
        "Ayo login terlebih dahulu untuk bisa mengunakan WhatsApp Gateway ini."
      );
      if (result) {
        window.location.href = "/auth";
      }
      clearExistingInterval();
      return;
    } else {
      const btn = document.getElementById("btnNavLogin");
      btn.innerHTML = DOMPurify.sanitize(
        `<i style="transform: rotate(180deg); color:red;" class="fa-solid fa-right-to-bracket m-1"></i> <span style="color:red;">Logout</span>`
      );
      btn.onclick = null;
      btn.onclick = async () => {
        let isTrue = confirm("Apakah anda yakin ingin logout? ");
        if (isTrue) {
          await logout();
        }
      };
    }
    const btnChangeDevice = document.getElementById("btnChangeDevice");

    const updateStatusQr = (element, text, isConnected) => {
      const span = element.querySelector("span");
      const icon = element.querySelector("i");

      span.innerText = text;
      icon.classList.toggle("fa-check-circle", isConnected);
      icon.classList.toggle("fa-times-circle", !isConnected);
      element.classList.toggle("connected", isConnected);
      element.classList.toggle("not-connected", !isConnected);
    };

    const getQrCode = async () => {
      if (!sessionName) return;

      const data = { sessionName: sessionName };
      try {
        const response = await fetch("/api/qr", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await response.json();

        if (result.success) {
          const imgQR = document.getElementById("imgQr");
          const eStatusQr = document.querySelector(".connection-status");
          const btnChangeDevice = document.getElementById("btnChangeDevice");
          const containerBtnChange =
            document.getElementById("containerBtnChange");

          if (!imgQR || !eStatusQr || !btnChangeDevice) {
            console.error("Elemen tidak ditemukan!");
            return;
          }
          QRS = result.statusQR;
          if (result.statusQR === "ready") {
            imgQR.src = result.qr;
            imgQR.classList.remove("hidden");
            containerBtnChange.classList.add("hidden");
            updateStatusQr(eStatusQr, "Terputus", false);
          } else if (result.statusQR === "qrReadSuccess") {
            imgQR.src = "";
            imgQR.classList.add("hidden");
            containerBtnChange.classList.remove("hidden");
            updateStatusQr(eStatusQr, "Terhubung", true);
          } else if (result.statusQR === "not_ready") {
            imgQR.src = "";
            imgQR.classList.add("hidden");
            containerBtnChange.classList.add("hidden");
            updateStatusQr(eStatusQr, "Menunggu QR Code...", false);
          }
        }
      } catch (error) {
        console.error("Error in getQrCode:", error);
      }
    };
    if (sessionName) {
      clearExistingInterval();
      await getQrCode();
      intervalId = setInterval(getQrCode, 10000);
      document.onvisibilitychange = null;
      document.onvisibilitychange = async () => {
        if (document.visibilityState === "visible") {
          clearExistingInterval();
          await getQrCode();
          intervalId = setInterval(getQrCode, 10000);
        } else {
          clearExistingInterval();
        }
      };
      btnChangeDevice.onclick = null;
      btnChangeDevice.onclick = async () => {
        let isTrue = confirm("Apakah anda yakin ingin menganti perangkat bot?");

        if (isTrue) {
          clearExistingInterval();
          await deleteGroups();
          const containerBtnChange =
            document.getElementById("containerBtnChange");
          containerBtnChange.classList.add("hidden");
          simulateLoading(
            "imgQr",
            "loadingSpinnerQr",
            "containerLoadingQR",
            15000
          );
          try {
            const data = {
              sessionName: sessionName,
            };
            const response = await fetch("/api/", {
              method: "PUT",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(data),
            });
            const result = await response.json();
            if (result.success) {
              alert(
                "Penggantian perangkat berhasil. Silahkan scan QR Codenya ulang."
              );
              intervalId = setInterval(getQrCode, 10000);
            } else {
              alert("Terjadi kesalahan saat ganti perangkat: " + result.error);
              containerBtnChange.classList.remove("hidden");
            }
          } catch (error) {
            console.log(error);
          }
        }
      };

      const btnDeleteDevice = document.getElementById("btnDeleteDevice");
      btnDeleteDevice.onclick = null;
      btnDeleteDevice.onclick = async () => {
        const isTrue = confirm(
          `Apakah Anda yakin ingin menghapus sesi ${sessionName}?\nSemua data sesi ${sessionName} akan dihapus.`
        );
        if (isTrue) {
          const containerBtnChange =
            document.getElementById("containerBtnChange");
          containerBtnChange.classList.add("hidden");
          simulateLoading(
            "imgQr",
            "loadingSpinnerQr",
            "containerLoadingQR",
            15000
          );
          try {
            const response = await fetch("/api/sessions", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ sessionName: sessionName }),
            });
            const result = await response.json();
            if (result.success) {
              containerBtnChange.classList.add("hidden");
              alert(
                "Anda akan di arahkan ke halaman login, silahkan login ulang."
              );
              await logout();
            } else {
              console.log(result.error);
            }
          } catch (error) {
            console.log(error);
          }
        }
      };
    } else {
      clearExistingInterval();
    }
    loadGroups();
    const monthPicker = document.getElementById("monthPicker");
    const now = new Date();
    const defaultMonth = now.toISOString().slice(0, 7);
    monthPicker.value = defaultMonth;
  });
  const loadGroups = async () => {
    try {
      const reloadGroup = document.getElementById("reloadGroup");
      reloadGroup.onclick = null;
      reloadGroup.onclick = async () => {
        simulateLoading(
          "groupCheckbox",
          "loadingGroupSpinner",
          "containerLoadingGroup"
        );
        await getGroups();
      };
    } catch (error) {
      console.log(error.message);
    }
  };

  const showSpinner = (idLoadingSpinner) => {
    document.getElementById(idLoadingSpinner).style.display = "flex";
  };

  const hideSpinner = (idLoadingSpinner) => {
    document.getElementById(idLoadingSpinner).style.display = "none";
  };

  const simulateLoading = (
    idContent,
    idLoadingSpinner,
    idContainerLoading,
    duration = 2000
  ) => {
    const container = document.getElementById(idContainerLoading);
    container.innerHTML =
      DOMPurify.sanitize(`<div id="${idLoadingSpinner}" class="justify-content-center" style="display: none">
  <div class="spinner-border" role="status" style="width: 4rem; height: 4rem; color:#25d366;">
    <span class="visually-hidden">Loading...</span>
  </div>
</div>`);

    setTimeout(() => {
      showSpinner(idLoadingSpinner);
      document.getElementById(idContent).style.display = "none";

      setTimeout(() => {
        hideSpinner(idLoadingSpinner);
        document.getElementById(idContent).style.display = "block";
      }, duration);
    }, 0);
  };

  const getGroups = async () => {
    try {
      const groupCheckboxesID = document.querySelector("#groupCheckbox");
      if (QRS != "qrReadSuccess") {
        const element = `
  <div class="checkbox-item">
  <p>Grup kosong! Silahkan scan QR Cose terlebih dahulu.</p>
  </div>`;
        groupCheckboxesID.innerHTML = DOMPurify.sanitize(element);
        return;
      }
      const response = await fetch("api/group", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionName: sessionName }),
      });
      const result = await response.json();
      if (result.success) {
        const element = `
  <div class="checkbox-item select-all">
    <input type="checkbox" id="selectAll" class="checkbox-input">
    <label for="selectAll" class="checkbox-label">Pilih Semua</label>
  </div>
  ${result.data
    .map(
      (d, i) => `
      <div class="checkbox-item">
        <input type="checkbox" id="group${i}" name="bulkGroup" value="${d.waId}" class="checkbox-input group-checkbox">
        <label for="group${i}" class="checkbox-label">${d.name}</label>
      </div>
    `
    )
    .join("")}
`;

        groupCheckboxesID.innerHTML = DOMPurify.sanitize(element);
        const selectAllCheckbox = document.getElementById("selectAll");
        const groupCheckboxes = document.querySelectorAll(".group-checkbox");
        selectAllCheckbox.onchange = null;
        selectAllCheckbox.onchange = function () {
          groupCheckboxes.forEach((checkbox) => {
            checkbox.checked = selectAllCheckbox.checked;
          });
        };

        groupCheckboxes.forEach((checkbox) => {
          checkbox.onchange = null;
          checkbox.onchange = function () {
            const allChecked = Array.from(groupCheckboxes).every(
              (cb) => cb.checked
            );
            selectAllCheckbox.checked = allChecked;
          };
        });
      } else {
        const element = `
  <div class="checkbox-item">
  <p>${result.error}</p>
  </div>`;
        groupCheckboxesID.innerHTML = DOMPurify.sanitize(element);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getCheckedGroupValues = () => {
    const checkboxes = document.querySelectorAll(
      'input[name="bulkGroup"]:checked'
    );
    return Array.from(checkboxes).map((checkbox) => {
      let labelText = "";
      if (checkbox.id) {
        const label = document.querySelector(`label[for="${checkbox.id}"]`);
        if (label) {
          labelText = label.textContent.trim();
        }
      }

      return {
        value: checkbox.value,
        labelText: labelText || "Nama group tidak di ketahui!",
      };
    });
  };

  window.addEventListener("pagehide", () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });
  window.addEventListener("beforeunload", () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });
})();
