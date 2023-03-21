# FileUpload.js

Simple file upload using jquery (Need [jQuery](https://jquery.com/))

## Options

- uploadId: Element id of container for file and button

- listIdUpload: Element id of container for upload file list

- listIdDownload: Element id of container for download file list

- url: Post URL of upload

- useZip: Compress all selected files to zip format and upload it (Need [jszip.js](https://stuk.github.io/jszip/))

- useDrop: Enable drag & drop files

- maxNumberOfFiles: Maximum number of files

- maxSize: Maximum size of files in byte

- zipFileName: File name of compressed when useZip is true

- renderHeader: Renderer of file and button (Default renderer used when not specified)

- renderUpload: Renderer of upload file list (Default renderer used when not specified)

- renderDownload: Renderer of download file list (Default renderer used when not specified)

- renderEmpty: Renderer for empty files (0 length string used when not specified)

- onInvalid: Event raised when invalid (maxNumberOfFiles or maxSize exceeded)

- onValid: Event raised when valid (maxNumberOfFiles and maxSize not exceeded)

- onDelete: Event raised when download completed

## Functions

- startUpload: Start uploading files

- getFilesAdded: Get all files added

- getZippedAsync: Get all files zipped in one file

- setFilesUploaded: Set uploaded files to appy in showUpload
- showUpload: Show file list to upload

- showDownload: Show file list uploaded

## Example

- [index.html](routes/index.html)

## Download

- [FileUpload.js](public/javascripts/FileUpload.js)
