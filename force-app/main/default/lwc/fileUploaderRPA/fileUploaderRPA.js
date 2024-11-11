import { LightningElement, track } from 'lwc';
import uploadFileToDocparser from '@salesforce/apex/DocparserFileUploadController2.uploadFileToDocparser';
import getParsedDataUsingDocId from '@salesforce/apex/GetParsedData2.getParsedDataUsingDocId';
import getWebhookData from '@salesforce/apex/nfileUPloadRpaExe.getWebhookData';
export default class FileUploaderRPA extends LightningElement {
    @track keyValueLst = []; 
    showText = true;
    showSpinner = false; 
    showTable = false; 
    showViewButton = false; // To display 'View' button after file upload
    showRunButton = false;  // To display 'Run' button after file upload
    showFilePreview = false; // To display the file preview only after 'View' button click
    isImageFile = false; // To check if the uploaded file is an image
    @track selectedFiles = []; // Track all uploaded files
    currentFileUrl = ''; // Track the URL for the latest uploaded file
    documentId; // Store the uploaded documentId
    @track showButtons=false;
    @track showuploader=true;
    @track showSubmit=false;
   // Handle file upload event webhooks
    handleUploadFinished(event) {
        const uploadedFiles = event.detail.files;
    
       // Check if any files were uploaded
        if (uploadedFiles.length > 0) {
            // Only keep track of the latest uploaded file and clear previously selected files
            this.selectedFiles = uploadedFiles.map(file => ({
                documentId: file.documentId,
                name: file.name,
                fileType: file.name.split('.').pop().toLowerCase() // Get the file type
            }));   

            // Update the latest file's documentId
            this.documentId = uploadedFiles[0].documentId; 

            console.log('Files uploaded:', this.selectedFiles);

            // Determine whether the latest file is an image or a PDF
            const fileType = this.selectedFiles[0].fileType;
            this.isImageFile = (fileType === 'png' || fileType === 'jpg' || fileType === 'jpeg');

            // Set the current file URL for viewing later, but do not show preview yet
            this.currentFileUrl = `/sfc/servlet.shepherd/document/download/${this.documentId}`;

            // Display the 'View' and 'Run' buttons after upload
            this.showViewButton = true; 
            this.showuploader = false;
            this.showFilePreview = false; // Don't show preview yet
            this.showButtons=true;
        } else {
            console.log('No file was uploaded');
        }
    }
    
   // method using dockparse
    // handleUploadFinished(event) {
    //     const uploadedFiles = event.detail.files;

    //     // Check if any files were uploaded
    //     if (uploadedFiles.length > 0) {
    //         this.selectedFiles = uploadedFiles.map(file => ({
    //             documentId: file.documentId,
    //             name: file.name,
    //             fileType: file.name.split('.').pop().toLowerCase()
    //         }));
    //         this.documentId = uploadedFiles[0].documentId;
    //         this.isImageFile = (this.selectedFiles[0].fileType === 'png' || this.selectedFiles[0].fileType === 'jpg' || this.selectedFiles[0].fileType === 'jpeg');
    //         this.currentFileUrl = `/sfc/servlet.shepherd/document/download/${this.documentId}`;

    //         this.showViewButton = true;
    //         this.showFilePreview = false;

    //         // Call uploadFile method to upload to Docparser and display console message
    //         this.uploadFile(this.documentId);
    //     } else {
    //         console.log('No file was uploaded');
    //     }
    // }

    uploadFile(documentId) {
        uploadFileToDocparser({ contentDocumentId: documentId })
            .then(result => {
                this.docParserId = result;
                console.log('File uploaded successfully to Docparser', result);

                // Show the 'Run' button after the file has been uploaded
               // this.showRunButton = true;
            })
            .catch(error => {
                console.error('Error uploading file to Docparser', error);
                this.showSpinner = false;
            });
    }

    // Method to handle 'View' button click to display the uploaded file
    handleViewFile() {
        if (this.selectedFiles.length > 0) {
            this.showFilePreview = true;
            this.showRunButton = true;
        }
    }

   // getting data from webhooks 
     @track webhookDataList = [];
    handleRunFile() {
        this.showSpinner = true;
        getWebhookData()
            .then(response => {
                const parsedData = JSON.parse(response); // Parse the response JSON

                // Map the parsed data into key-value pairs
                this.webhookDataList = Object.entries(parsedData).map(([key, value]) => {
                    this.showSpinner = false;
                    this.showTable = true;
                    this.showButtons=true;
                    this.showSubmit=true;
                    return { key: key,value: value || 'No data found',childTable:false };
                });
            })
            .catch(error => {
                console.error('Error fetching webhook data:', error);
            });
    }
    // handleRunFile(){
    //     this.showSpinner = true;

    //     this.intervalId = setInterval(() => {
    //         this.callApexMethod();
    //     }, 5000);
    // }
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
                    value: value || 'No data found',
                    childTable:false 
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


    // @track childTable=true;
    // callchildTable(event) {
    //     const rowKey = event.currentTarget.getAttribute('data-key'); 
    //     // console.log('Inside call table >>> ' + rowKey);
    //     this.keyValueLst = this.keyValueLst.map(item => {
    //         if (item.key === rowKey) {
    //             item.childTable = !item.childTable;
    //         }
    //         return item;
    //     });
    // }
    @track childTable=true;
    callchildTable(event) {
        const rowKey = event.currentTarget.getAttribute('data-key'); 
        // console.log('Inside call table >>> ' + rowKey);
        this.webhookDataList = this.webhookDataList.map(item => {
            if (item.key === rowKey) {
                item.childTable = !item.childTable;
            }
            return item;
        });
    }

    handleback(){
        this.showuploader = true;
        this.showFilePreview=false;
        this.showViewButton=false;
        this.showRunButton=false;
        this.showButtons=false;
        this.showTable=false;
    }

}