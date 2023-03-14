_fileUploads = new Map();

async function getZippedAsync(files) {
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.name, file);
  }
  return await zip.generateAsync({ type: "blob" });
}
function uploadButtonClick(uploadId) {
  $("#" + uploadId + "File").click();
}

function FileUpload(options) {
  options = {
    listIdUpload: options.uploadId + "ListUpload",
    listIdDownload: options.uploadId + "ListDownload",
    useZip: false,
    useDrop: true,
    maxNumberOfFiles: 0,
    maxSize: 0,
    zipFileName: "content.zip",
    ...options,
  };
  let _filesAdded = [];
  let _filesUploaded = [];

  function hasId(html, id) {
    const r = new RegExp(`id\\s*=\\s*["']${id}["']`);
    return r.test(html);
  }
  function hasClass(html, className) {
    const r = new RegExp(`class\s*=\s*["'][^"']*\\b${className}\\b[^"']*["']`);
    return r.test(html);
  }

  function getTimeBasedUuid() {
    const now = new Date();
    const y = now.getFullYear().toString();
    const m = (now.getMonth() + 1).toString().padStart(2, "0");
    const d = now.getDate().toString().padStart(2, "0");
    const h = now.getHours().toString().padStart(2, "0");
    const n = now.getMinutes().toString().padStart(2, "0");
    const s = now.getSeconds().toString().padStart(2, "0");
    const ms = now.getMilliseconds().toString().padStart(2, "0");
    const rnd = parseInt(Math.random() * 1000, 10)
      .toString()
      .padStart(3, "0");
    return `${y}${m}${d}${h}${n}${s}${ms}${rnd}`;
  }

  function templateListUpload() {
    return `<div id="${options.listIdUpload}" class="list upload"></div>`;
  }
  function templateListDownload() {
    return `<div id="${options.listIdDownload}" class="list download"></div>`;
  }

  function templateHeader() {
    return `
		<input type="file" id="${options.uploadId}File" multiple />
		<input type="button" id="${options.uploadId}Button" class="upload" value="Choose file..." onclick="uploadButtonClick('${options.uploadId}')" />`;
  }
  function getHtmlHeader() {
    const html = options.renderHeader
      ? options.renderHeader(options.uploadId)
      : templateHeader();

    const idFile = `${options.uploadId}File`;
    const idButton = `${options.uploadId}Button`;
    if (!hasId(html, idFile)) {
      throw new Error(`id="${idFile}" was not found in header.`);
    }
    if (!hasId(html, idButton)) {
      throw new Error(`id="${idButton}" was not found in header.`);
    }

    return html;
  }

  function templateUpload(file, index, files) {
    return `<span>${file.name}<button class="cancel" data-index="${index}">X</button></span>`;
  }
  function getHtmlUpload(file, index, files) {
    const html = options.renderUpload
      ? options.renderUpload(file, index, files)
      : templateUpload(file, index, files);
    if (!hasClass(html, "cancel")) {
      throw new Error(`class="cancel" was not found in upload.`);
    }

    return html;
  }

  function templateDownload(file, index, files) {
    const { name, url, deleteUrl } = file;
    const htmlA = `<a download href="${url}">${name}</a>`;
    const htmlButton = `<button class="delete" data-index="${index}" data-url="${deleteUrl}">X</button>`;
    return `<span>` + htmlA + htmlButton + `</span>`;
  }
  function getHtmlDownload(file, index, files) {
    const html = options.renderDownload
      ? options.renderDownload(file, index, files)
      : templateDownload(file, index, files);
    if (!hasClass(html, "delete")) {
      throw new Error(`class="delete" was not found in upload.`);
    }

    return html;
  }

  function validate(filesBe) {
    let sizeAll = 0;

    const files = [..._filesAdded, ..._filesUploaded, ...filesBe];
    let info = { isSize: false, index: -1, value: 0, max: 0, files, msg: "" };
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      sizeAll += file.size;
      if (options.maxSize !== 0 && sizeAll > options.maxSize) {
        info = {
          isSize: true,
          index: i,
          value: sizeAll,
          max: options.maxSize,
        };
        break;
      }
      if (options.maxNumberOfFiles !== 0 && i + 1 > options.maxNumberOfFiles) {
        info = {
          isSize: false,
          index: i,
          value: i + 1,
          max: options.maxNumberOfFiles,
        };
        break;
      }
    }
    if (info.index !== -1) {
      info.files = files.filter((f, i) => i >= info.index);
      if (info.isSize) {
        info.msg = `File size: ${info.value.toLocaleString()} is larger than maximum size: ${info.max.toLocaleString()}.`;
      } else {
        info.msg = `File count: ${info.value.toLocaleString()} is larger than maximum count: ${info.max.toLocaleString()}.`;
      }

      return { valid: false, info };
    }

    return { valid: true, info };
  }

  function addFiles(files) {
    const { valid, info } = validate(files);
    if (!valid) {
      if (options.onInvalid) {
        options.onInvalid(info);
      } else {
        alert(info.msg);
      }
      return;
    }

    if (options.onValid) {
      options.onValid();
    }

    for (const file of files) {
      const found = _filesAdded.find(
        (f) =>
          f.lastModified == file.lastModified &&
          f.size == file.size &&
          f.name == file.name
      );
      if (!found) {
        _filesAdded.push(file);
      }
    }

    showUpload();
  }

  function cancelFile(index) {
    _filesAdded.splice(index, 1);
  }
  function cancelFileByFiles(files) {
    for (const file of files) {
      const index = _filesAdded.findIndex(
        (f) =>
          (f.lastModified && file.lastModified
            ? f.lastModified == file.lastModified
            : true) &&
          f.size == file.size &&
          f.name == file.name
      );
      if (index !== -1) {
        cancelFile(index);
      }
    }
  }
  function deleteFile(index) {
    _filesUploaded.splice(index, 1);
  }

  function clear() {
    _filesToAdd = [];
    _filesUploaded = [];
    _zip = new JSZip();
  }

  function showUpload() {
    const list = [];
    if (_filesAdded.length) {
      for (let i = 0; i < _filesAdded.length; i++) {
        const file = _filesAdded[i];
        const item = getHtmlUpload(file, i, _filesAdded);
        list.push(item);
      }
    } else {
      if (options.renderEmpty) {
        list.push(options.renderEmpty());
      }
    }
    const html = list.join("");
    $("#" + options.listIdUpload).html(html);
  }
  function showDownload() {
    let html = "";
    const list = [];
    if (_filesUploaded.length) {
      for (let i = 0; i < _filesUploaded.length; i++) {
        const file = _filesUploaded[i];
        const item = getHtmlDownload(file, i, _filesUploaded);
        list.push(item);
      }
    } else {
      if (options.renderEmpty) {
        list.push(options.renderEmpty());
      }
    }
    html = list.join("");
    $("#" + options.listIdDownload).html(html);
  }

  function sendUpload(data, callback) {
    $.ajax({
      type: "POST",
      url: options.url,
      processData: false,
      contentType: false,
      dataType: "json",
      data,
      success: function (resp) {
        callback(resp);
        _filesUploaded = resp.files;
        cancelFileByFiles(_filesUploaded);
        showUpload();
        showDownload();
      },
      err: function (err) {
        callback(err);
      },
    });
  }
  function sendDelete(url, callback) {
    $.ajax({
      type: "POST",
      url,
      processData: false,
      contentType: false,
      dataType: "json",
      success: function (resp) {
        callback(resp);
        showDownload();
      },
      err: function (err) {
        callback(err);
      },
    });
  }

  function startUpload(frm, callback) {
    if (!_filesAdded.length) return;

    const atchFileId = getTimeBasedUuid();

    if (options.useZip) {
      getZippedAsync(_filesAdded).then((blob) => {
        const file = new File([blob], options.zipFileName, {
          type: "application/zip",
          lastModified: new Date().getTime(),
        });
        const data = new FormData(frm);
        data.append(options.zipFileName, file);
        data.append("atchFileId", atchFileId);
        data.append("fileSn", "0");

        sendUpload(data, callback);
      });
    } else {
      const data = new FormData(frm);
      data.append("atchFileId", atchFileId);
      data.append("fileSn", "0");
      for (let i = 0; i < _filesAdded.length; i++) {
        const file = _filesAdded[i];
        data.append(file.name, file);
      }
      sendUpload(data, callback);
    }
  }

  // initialize
  const htmlHeader = getHtmlHeader();
  $("#" + options.uploadId).html(htmlHeader);

  let htmlListDownload = "";
  if (!$("#" + options.listIdDownload).length) {
    htmlListDownload = templateListDownload();
    $("#" + options.uploadId).after(htmlListDownload);
  } else {
    htmlListDownload = $("#" + options.listIdDownload)[0].outerHTML;
  }
  if (
    !hasClass(htmlListDownload, "list") ||
    !hasClass(htmlListDownload, "download")
  ) {
    throw new Error(
      `class="list" or class="download" was not found in ${options.listIdDownload}.`
    );
  }

  let htmlListUpload = "";
  if (!$("#" + options.listIdUpload).length) {
    htmlListUpload = templateListUpload();
    $("#" + options.uploadId).after(htmlListUpload);
  } else {
    htmlListUpload = $("#" + options.listIdUpload)[0].outerHTML;
  }
  if (
    !hasClass(htmlListUpload, "list") ||
    !hasClass(htmlListUpload, "upload")
  ) {
    throw new Error(
      `class="list" or class="upload" was not found in ${options.listIdUpload}.`
    );
  }

  showUpload();

  // events
  $(`#${options.listIdUpload}, #${options.listIdDownload}`).bind(
    "click",
    (e) => {
      if ($(e.target).hasClass("cancel")) {
        e.preventDefault();
        const index = parseInt($(e.target).attr("data-index"), 10);
        cancelFile(index);
        showUpload();
      } else if ($(e.target).hasClass("delete")) {
        e.preventDefault();
        const url = $(e.target).attr("data-url");
        const index = parseInt($(e.target).attr("data-index"), 10);
        sendDelete(url, (e) => {
          deleteFile(index);
          showDownload();
        });
      }
    }
  );

  $("#" + options.uploadId + "File").bind("change", (e) => {
    addFiles(e.target.files);
    e.target.value = "";
  });

  if (options.useDrop) {
    $(document).bind("drop dragover", function (e) {
      e.preventDefault();
    });
    $("#" + options.uploadId).bind("drop dragover", (e) => {
      console.log("drop dragover", e);

      const data = e.originalEvent.dataTransfer;
      if (e.type === "drop") {
        let files = [];
        if (data.items) {
          files = [...data.items]
            .filter((item) => item.kind === "file")
            .map((item) => item.getAsFile());
        } else {
          files = [...data.files];
        }
        addFiles(files);
      }
    });
  }

  const callable = {
    uploadId: options.uploadId,
    options: { ...options },

    startUpload,

    getFilesAdded: () => {
      return _filesAdded;
    },

    getZippedAsync,

    setFilesUploaded: (filesUploaded) => {
      _filesUploaded = filesUploaded;
      cancelFileByFiles(_filesUploaded);
    },
    showUpload,
    showDownload,
  };
  _fileUploads.set(options.uploadId, callable);

  return callable;
}
