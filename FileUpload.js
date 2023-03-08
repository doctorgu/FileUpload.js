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
	let _filesAdded = [];
	let _filesUploaded = [];
	let _events = new Map();

	function hasId(html, id) {
		const r = new RegExp(`id\\s*=\\s*["']${id}["']`);
		return r.test(html);
	}
	function hasClass(html, className) {
		const r = new RegExp(`class\s*=\s*["'][^"']*\\b${className}\\b[^"']*["']`);
		return r.test(html);
	}
	
	function templateList() {
		return `<div class="list"></div>`;
	}
	
	function templateHeader() {
		return `
		<input type="file" id="${options.uploadId}File" multiple />
		<input type="button" id="${options.uploadId}Button" class="upload" value="${options.label}" onclick="uploadButtonClick('${options.uploadId}')" />`;
	}
	function getHtmlHeader() {
		const html = options.renderHeader ? options.renderHeader(options.uploadId, options.label) : templateHeader();
		
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
 		const html = options.renderUpload ? options.renderUpload(file, index, files) : templateUpload(file, index, files);
 		if (!hasClass(html, "cancel")) {
 			throw new Error(`class="cancel" was not found in upload.`);
 		}
 		
 		return html;
	}
	
	function templateDownload(file, index, files) {
		const { name, url, deleteUrl } = file;
		const htmlA = `<a href="${url}">${name}</a>`;
		const htmlButton = `<button class="delete" data-index="${index}" data-url="${deleteUrl}">X</button>`;
		return `<span>` + htmlA + htmlButton + `</span>`; 
	}
	function getHtmlDownload(file, index, files) {
 		const html = options.renderDownload ? options.renderDownload(file, index, files) : templateDownload(file, index, files);
 		if (!hasClass(html, "delete")) {
 			throw new Error(`class="delete" was not found in upload.`);
 		}
 		
 		return html;
	}
	
	function validate(filesBe) {
		let sizeAll = 0;
		
		const files = [..._filesAdded, ...filesBe];
		let msg = "";
		let idxBad = -1;
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			
			sizeAll += file.size;
			if (options.maxSize !== 0 && sizeAll > options.maxSize) {
				msg = "File size: " + sizeAll.toLocaleString() + " is larger than maximum size: " + options.maxSize.toLocaleString() + ".";
				idxBad = i;
				break;
			}
			if (options.maxNumberOfFiles !== 0 && i + 1 > options.maxNumberOfFiles) {
				msg = "File count: " + (i + 1).toLocaleString() + " is larger than maximum count: " + options.maxNumberOfFiles.toLocaleString() + ".";
				idxBad = i;
				break;
			}
		}
		if (idxBad !== -1) {
			const filesBad = files.filter((f, i) => i >= idxBad);
			return { valid: false, msg };
		}
	
		return { valid: true, msg: "" };
	}

	function addFiles(files) {
		for (const file of files) {
			const found = _filesAdded.find(f => f.lastModified == file.lastModified 
												&& f.size == file.size 
												&& f.name == file.name);
			if (!found) {
				_filesAdded.push(file);
			}
		}
	}
	function cancelFile(index) {
		_filesAdded.splice(index, 1);	
	}
	function deleteFile(index) {
		_filesUploaded.splice(index, 1);
	}
	function clear() {
		_filesToAdd = [];
		_filesUploaded = [];
		_zip = new JSZip();
	}

	function showFiles(forDownload) {
		let html = "";
		if (!forDownload) {
			const list = [];
			if (_filesAdded.length) {
				for (let i = 0; i < _filesAdded.length; i++) {
					const file = _filesAdded[i];
					const item = getHtmlUpload(file, i, _filesAdded);
					list.push(item);
				}
			} else {
				if (options.renderUploadEmpty) {
					html = options.renderUploadEmpty();
				}
			}
			html = list.join("");
		} else {
			if (_filesUploaded.length) {
				const list = [];
				for (let i = 0; i < _filesUploaded.length; i++) {
					const file = _filesUploaded[i];
					const item = getHtmlDownload(file, i, _filesUploaded);
					list.push(item);
				}
				html = list.join("");
			} else {
				if (options.renderDownloadEmpty) {
					html = options.renderDownloadEmpty();
				}
			}
		}
		$("#" + options.uploadId + " .list, #" + options.listId + ".list").html(html);
	}
	
	function sendUpload(data, callback) {
		$.ajax({
			type:"POST",
			url: options.url,
			processData: false,
			contentType: false,
			dataType: "json",
			data,
			success: function(resp){
				callback(resp);
				_filesUploaded = resp.files;
				_filesAdded = [];
				showFiles(true);
				console.log(resp);
			},
			err: function(err){
				callback(err);
				console.log("err:", err);
			}
		});
	}
	function sendDelete(url, callback) {
		$.ajax({
			type:"POST",
			url,
			processData: false,
			contentType: false,
			dataType: "json",
			success: function(resp){
				callback(resp);
				showFiles(true);
			},
			err: function(err){
				callback(err);
				console.log("err:", err);
			}
		});
	}
	
	function startUpload(frm, callback) {
		const atchFileId = getTimeBasedUuid();
		
		if (options.useZip) {
			getZippedAsync(_filesAdded).then(blob => {
				const file = new File([blob], options.zipFileName, { type: "application/zip", lastModified: new Date().getTime() });		
				const data = new FormData(frm);
				data.append(options.zipFileName, file);
				data.append("atchFileId", atchFileId);
				data.append("fileSn", "0");
				
				sendUpload(data, callback);
			})
		} else {
			const data = new FormData(frm);
			data.append("atchFileId", atchFileId);
			data.append("fileSn", "0");
			for (let i = 0; i < _filesAdded.length; i++) {
				const file = _filesAdded[i]
				data.append(file.name, file);
			}
			sendUpload(data, callback);
		}
	}
	
	// initialize
	$("#" + options.uploadId).attr("data-type", "file");
	
	const htmlHeader = getHtmlHeader();
	$("#" + options.uploadId).html(htmlHeader);
	
	if (options.listId) {
		if (!$("#" + options.listId).hasClass("list")) {
			throw new Error(`class="list" was not found in list.`);
		}
	} else {
		const htmlList = templateList();
		$("#" + options.uploadId).html($("#" + options.uploadId).html() + htmlList);	
	}
	
	// events
	$(document).bind("drop dragover", function (e) {
	    e.preventDefault();
	});
	
	$("#" + options.uploadId + " .list, #" + options.listId + ".list").bind("click", e => {
		if ($(e.target).hasClass("cancel")) {
			e.preventDefault();
			const index = parseInt($(e.target).attr("data-index"), 10);
			cancelFile(index);
			showFiles(false);
		} else if ($(e.target).hasClass("delete")) {
			e.preventDefault();
			const url = $(e.target).attr("data-url");
			const index = parseInt($(e.target).attr("data-index"), 10);
			sendDelete(url, e => {
				deleteFile(index);
				showFiles(true);
			})
		}
	});
	
	$("#" + options.uploadId + "File").bind("change", e => {
		const { valid, msg } = validate(e.target.files);
		if (!valid) {
			alert(msg);
			return;
		}
		
		addFiles(e.target.files);
		e.target.value = "";
		showFiles(false);
	});
	
	$("#" + options.uploadId).bind("drop dragover", e => {
		console.log("drop dragover", e);
		
		const data = e.originalEvent.dataTransfer;
		if (e.type === "drop") {
			let files = [];
			if (data.items) {
				files = [...data.items].filter(item => item.kind === "file").map(item => item.getAsFile());
			} else {
				files = [...data.files]
			}
			const { valid, msg } = validate(files);
			if (!valid) {
				alert(msg);
				return;
			}
			
			addFiles(files);
			showFiles(false);
		}
	});
	
	
	const callable = {
		uploadId: options.uploadId,
		options: { ...options },
		
		startUpload,
		
		getLastAtchFileId: function() {
			return _lastAtchFileId;			
		},
		addEvent: function(name, callback) {
			_events.set(name, callback);			
		},
		getFilesAdded: function() {
			return _filesAdded;
		},
		getZippedAsync,
	}
	_fileUploads.set(options.uploadId, callable);
	
	return callable;
}
