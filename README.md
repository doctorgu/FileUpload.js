# FileUpload.js

Simple file upload using jquery (Need [jQuery](https://jquery.com/))

## Options

- uploadId: Element id of container for file and button

- listId: Element id of container for upload and download file list

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

## Functions

- startUpload: Start uploading files

- getFilesAdded: Get all files added

- getZippedAsync: Get all files zipped in one file

## Example

- [index.html](routes/index.html)

## Download

- [FileUpload.js](public/javascripts/FileUpload.js)
