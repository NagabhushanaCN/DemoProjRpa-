import { LightningElement, track } from 'lwc';
import uploadFileToDocparser from '@salesforce/apex/DocparserFileUploadController2.uploadFileToDocparser';
import getParsedDataUsingDocId from '@salesforce/apex/GetParsedData2.getParsedDataUsingDocId';

export default class ConfidentScoreLWC extends LightningElement {
    @track keyValueLst = [];
    @track selectedFiles = [];
    showText = true;
    showSpinner = false;
    showTable = false;
    showViewButton = false;
    showRunButton = false;
    showFilePreview = false;
    isImageFile = false;
    currentFileUrl = '';
    documentId;
    intervalId;
    docParserId;

    fileFormats = ['.pdf'];
    recordId;
   
    handleUploadFinished(event) {
        const uploadedFiles = event.detail.files;

        // Check if any files were uploaded
        if (uploadedFiles.length > 0) {
            this.selectedFiles = uploadedFiles.map(file => ({
                documentId: file.documentId,  
                name: file.name,
                fileType: file.name.split('.').pop().toLowerCase()
            }));
            this.documentId = uploadedFiles[0].documentId;
            this.isImageFile = (this.selectedFiles[0].fileType === 'png' || this.selectedFiles[0].fileType === 'jpg' || this.selectedFiles[0].fileType === 'jpeg');
            this.currentFileUrl = `/sfc/servlet.shepherd/document/download/${this.documentId}`;

            this.showViewButton = true;
            this.showRunButton = true;
            this.showFilePreview = false;

            // Call uploadFile method to upload to Docparser and display console message
            this.uploadFile(this.documentId);
        } else {
            console.log('No file was uploaded');
        }
    }

    uploadFile(documentId) {
        uploadFileToDocparser({ contentDocumentId: documentId })
            .then(result => {
                this.docParserId = result;
                console.log('File uploaded successfully to Docparser', result);

                // Show the 'Run' button after the file has been uploaded
                this.showRunButton = true;
            })
            .catch(error => {
                console.error('Error uploading file to Docparser', error);
                this.showSpinner = false;
            });
    }

    handleViewFile() {
        if (this.selectedFiles.length > 0) {
            this.showFilePreview = true;
        }
    }

    handleRunFile() {
        this.showSpinner = true;

        this.intervalId = setInterval(() => {
            this.callApexMethod();
        }, 5000);
    }

    callApexMethod() {
        getParsedDataUsingDocId({ docId: this.docParserId })
            .then(result => {
                let splitResult = result.split('!');
                let dataArray = splitResult[0];
                let statusCode = splitResult[1];

                if (statusCode === '200') {
                    this.clearPolling();
                    this.processParsedData(dataArray);
                    this.showSpinner = false;
                    this.showTable = true;
                } else {
                    console.log('File still processing, status:', statusCode);
                }
            })
            .catch(error => {
                console.error('Error calling Apex method', error);
                this.showSpinner = false;
            });
    }

    processParsedData(dataArray) {
        try {
            let parsedData = JSON.parse(dataArray.replace(/^\[|\]$/g, ''));

            const keysToFilter = ['id', 'document_id', 'date_of_service', 'remote_id', 'media_link'];
            this.keyValueLst = Object.entries(parsedData)
                .filter(([key]) => !keysToFilter.includes(key))
                .map(([key, value]) => ({
                    key: key,
                    value: value || 'No data found'
                }));

            console.log('Parsed key-value data:', this.keyValueLst);
        } catch (error) {
            console.error('Error parsing JSON data:', error);
        }
    }

    clearPolling() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('Polling stopped.');
        }
    }
}