<%
/* =================================================================
 * @FileName  : DetailViewFileExample.jsp
 * @date: 2023. 1. 16.
 * @author : shpark
 * @설명 : 파일 업로드 예제
 * =================================================================
 * 수정일         작성자             내용     
 * -----------------------------------------------------------------------
 * 2023. 1. 16.        개발자명           파일생성
 * 2023. 2. 14.        bhs                UI수정    
 * =================================================================
 */ 
%>
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@include file="/WEB-INF/jsp/kcure/portal/com/global_import.jsp"%>
<script src="/js/plugin/js.zip/jszip.min.js"></script>
<script src="/js/FileUpload.js"></script>

<style type="text/css">
#boardUpload1[data-type=file] {
	display: flex;
	column-gap: 10px;
}

#boardUpload1[data-type=file] div.list {
	display: flex;
	column-gap: 10px;
}

#boardUpload1[data-type=file] input.upload {
	padding: 0 5px;
}

#boardUpload1iv[data-type=file] div.list .cancel,
#boardUpload1[data-type=file] div.list .delete
{
	margin: 0 5px;
	padding: 0 5px;
}

#boardUpload1[data-type=file] div.list a {
	display: inline;
}
</style>

<style type="text/css">
#boardUpload2[data-type=file] {
	display: flex;
	column-gap: 10px;
}

#boardUpload2[data-type=file] div.list {
	display: flex;
	column-gap: 10px;
}

#boardUpload2[data-type=file] input.upload {
	padding: 0 5px;
}

#boardUpload2iv[data-type=file] div.list .cancel,
#boardUpload2[data-type=file] div.list .delete
{
	margin: 0 5px;
	padding: 0 5px;
}

#boardUpload2[data-type=file] div.list a {
	display: inline;
}
</style>

<style type="text/css">
#boardUpload3[data-type=file] {
	display: flex;
	column-gap: 10px;
}

#boardUpload3[data-type=file] div.list {
	display: flex;
	flex-direction: column;
	column-gap: 10px;
}

#boardUpload3[data-type=file] input.upload {
	padding: 0 5px;
}

#boardUpload3iv[data-type=file] div.list .cancel,
#boardUpload3[data-type=file] div.list .delete
{
	margin: 0 5px;
	padding: 0 5px;
}

#boardUpload3[data-type=file] div.list a {
	display: inline;
}
</style>

<script>
$(document).ready(() => {
	const fu1 = FileUpload({
		uploadId: "boardUpload1",
		url: "/portal/example/file/nonCheck/uploadFile.do",
		useZip: false,
		useDrop: false,
		maxNumberOfFiles: 2,
		maxSize: 90000,
		label: "Upload1",
		zipFileName: "content.zip",
	});
	const fu2 = FileUpload({
		uploadId: "boardUpload2",
		url: "/portal/example/file/nonCheck/uploadFile.do",
		useZip: false,
		useDrop: true,
		maxNumberOfFiles: 2,
		maxSize: 1000000,
		label: "Upload2",
		zipFileName: "content.zip",
		renderHeader: (uploadId, label) => {
			return `
			<input type="file" id="` + uploadId + `File" multiple />
			<input type="button" id="` + uploadId + `Button" class="upload" value="` + label + `" onclick="uploadButtonClick('` + uploadId + `')" />`;
		},
		renderUpload: (file, index, files) => {
			return `<span>` + file.name + `<button class="cancel" data-index="` + index + `">Cancel</button></span>`;
		},
		renderUploadEmpty: () => {
			return "Empty Upload";
		},
		renderDownload: (file, index, files) => {
			const { name, url, deleteUrl } = file;
			const htmlA = `<a href="` + url + `">` + name + `</a>`;
			const htmlButton = `<button class="delete" data-index="` + index + `" data-url="` + deleteUrl + `">Delete</button>`;
			return `<span>` + htmlA + htmlButton + `</span>`; 
		},
		renderDownloadEmpty: () => {
			return "Empty Download";
		},
	});
	const fu3 = FileUpload({
		uploadId: "boardUpload3",
		listId: "boardUpload3List",
		url: "/portal/example/file/nonCheck/uploadFile.do",
		useZip: true,
		useDrop: true,
		maxNumberOfFiles: 0,
		maxSize: 0,
		label: "Upload3",
		zipFileName: "content.zip",
		renderHeader: (uploadId, label) => {
			return `
			<label id="` + uploadId + `Button" for="` + uploadId + `File">
				<div class="btn_upload">파일 업로드하기</div>
				<input type="file" name="` + uploadId + `File" id="` + uploadId + `File" multiple>
				<input type="hidden" name="attdNmSpcd" id="attdNmSpcd" value="01">
			</label>`
		},
		renderUpload: (file, index, files) => {
			$("#boardUpload3Button").hide();
			return `<div>` + file.name + `<button class="cancel" data-index="` + index + `">X</button></div>`;
		},
		renderUploadEmpty: () => {
			$("#boardUpload3Button").show();
		},
		renderDownload: (file, index, files) => {
			const { name, url, deleteUrl } = file;
			const htmlA = `<a href="` + url + `">` + name + `</a>`;
			const htmlButton = `<button class="delete" data-index="` + index + `" data-url="` + deleteUrl + `">X</button>`;
			return `<div>` + htmlA + htmlButton + `</div>`; 
		},
		renderDownloadEmpty: () => {
			return "";
		},
	});
	
	// submit 전에 파일 업로드하고 atchFileId 가져오기 
	$("#uploadButton1").click(e => {
		event.preventDefault();
		
		fu1.startUpload($("#frm")[0], resp => {
			const atchFileId = resp.files[0].atchFileId; 
			console.log(atchFileId);
		});
	});

	// submit할 때 폼의 데이터에 파일 추가해서 같이 보내기
	$("#frm").submit(e => {
		event.preventDefault();
		
		const files = [...fu1.getFilesAdded(), ...fu2.getFilesAdded(), ...fu3.getFilesAdded()];
		
		const uploadZipped = $("#uploadZipped").prop("checked");
		if (uploadZipped) {
			const zipFileName = "content.zip";
			getZippedAsync(files).then(blob => {
				const file = new File([blob], zipFileName, { type: "application/zip", lastModified: new Date().getTime() });		
				const data = new FormData(e.target);
				data.append(zipFileName, file);
				
				$.ajax({
					type:"POST",
					url: "/portal/example/file/nonCheck/submitWithFile.do",
					processData: false,
					contentType: false,
					dataType: "json",
					data,
					success: function(resp){
						console.log(resp);
					},
					err: function(err){
						console.log("err:", err);
					}
				});
			})
		} else {
			const data = new FormData(e.target);
			for (const file of files) {
				data.append(file.name, file);
			}
			
			$.ajax({
				type:"POST",
				url: "/portal/example/file/nonCheck/submitWithFile.do",
				processData: false,
				contentType: false,
				dataType: "json",
				data,
				success: function(resp){
					console.log(resp);
				},
				err: function(err){
					console.log("err:", err);
				}
			});
		}
	});
})
</script>

<form id="frm" method="POST" action="/file/nonCheck/uploadFile.do" enctype="multipart/form-data">
	<input type="hidden" name="utlcRgstSeq" value="123" />
	
	<div id="boardUpload1"></div>
	
	<button id="uploadButton1">Upload File Before Submit</button>
	
	<div id="boardUpload2"></div>
	
	<div id="boardUpload3"></div>
	<div class="list" id="boardUpload3List"></div>
	
	<label>uploadZipped<input type="checkbox" id="uploadZipped" /></label>
	<input type="submit" value="Save" />
</form>

<input type="hidden" name="current_menu_name_info" value="InsertFileExample" />
