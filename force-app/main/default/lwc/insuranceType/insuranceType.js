import { LightningElement, track, wire } from 'lwc';
import getFormTypes from '@salesforce/apex/FormTypeController.getFormTypes';
import deleteInsuranceTypesAndAccounts from '@salesforce/apex/InsuranceTypeController.deleteInsuranceTypesAndAccounts';
// import saveGoLiveRecords from '@salesforce/apex/FormTypeControllerForUpdate.saveGoLiveRecords'; 
import updateGoLiveStatuses from '@salesforce/apex/FormTypeControllerForUpdate.updateGoLiveStatuses'; 
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import { NavigationMixin } from 'lightning/navigation';

export default class InsuranceType extends NavigationMixin(LightningElement) {
    @track insuranceTypes = [];
    @track error;
    @track showTestingComponent = true;
    @track isDeleteDisabled = true;
    @track showAddInsurance = false; 
    @track showTable = true; 
    @track messageFromParent = '';
    @track head = true;
    @track showSaveButton = false; 
    @track isSelectAllChecked = false; 
    @track showHelloComponent = false;
    @track checkboxval;
    @track TestFileUploderRpa=true;

    selectedRecords = new Set();
    selectedAccountIds = new Set();
    selectedGoLiveIds = new Set(); 

    wiredFormTypesResult;

    @wire(getFormTypes)
    wiredFormTypes(result) {
        this.wiredFormTypesResult = result;
        if (result.data) {
            this.insuranceTypes = result.data.map((item, index) => ({
                ...item,
                serialNumber: index + 1,
                name: item.Name,
                Go_Live__c: item.Go_Live__c 
            }));
            this.error = undefined;
        } else if (result.error) {
            this.error = result.error;
            this.insuranceTypes = [];
        }
    }

    // Add New Form Mapping Handler
    handleAddInsurance() {
        this.showTable = false;
        this.head = false;
        this.showAddInsurance = true; 
        this.messageFromParent = 'Screen1';
    }

    // Edit Handler
    handleEdit(event) {
        // this.showHelloComponent = true;
        this.showAddInsurance = true;
        this.showTable = false;
        this.head = false;
    }

    // Go Live Checkbox Handler
    // handleRowGolive(event) {
    //     this.showSaveButton=true;
    //     const recordId = event.target.dataset.id;        
    //     if (event.target.checked) {
    //         this.selectedGoLiveIds.add(recordId);
    //     } else {
    //         this.selectedGoLiveIds.delete(recordId);
    //     }

    //    this.showSaveButton = this.selectedGoLiveIds.size > 0;
    // }

    // Save Go Live Records
    // handleSave() {
    //     saveGoLiveRecords({ recordIds: Array.from(this.selectedGoLiveIds) })
    //         .then(() => {
    //             this.showToast('Success', 'Go Live records saved successfully.', 'success');
    //             this.selectedGoLiveIds.clear();
    //             this.showSaveButton = false;
    //             this.refreshTable();
    //         })
    //         .catch((error) => {
    //             this.showToast('Error', 'Failed to save Go Live records: ' + error.body.message, 'error');
    //         });
    // }

    // Delete Handler
    handleDelete() {
        const insuranceIds = Array.from(this.selectedRecords);
        const accountIds = Array.from(this.selectedAccountIds);

        deleteInsuranceTypesAndAccounts({ insuranceIds, accountIds })
            .then(() => {
                this.insuranceTypes = this.insuranceTypes.filter(
                    (record) => !this.selectedRecords.has(record.Id)
                );
                this.selectedRecords.clear();
                this.selectedAccountIds.clear();
                this.isDeleteDisabled = true;
                this.showToast('Success', 'Records deleted successfully.', 'success');
                this.isSelectAllChecked = false; 
            })
            .catch((error) => {
                this.showToast('Error', 'Failed to delete records: ' + error.body.message, 'error');
            });
    }

    // Select All Handler
    handleSelectAll(event) {
        const checked = event.target.checked;
        const checkboxes = this.template.querySelectorAll('input[type="checkbox"]');
        const recordIds = [];
        checkboxes.forEach((checkbox) => {
            const recordId = checkbox.dataset.id;
            if (recordId) {
                recordIds.push(recordId); 
                this.resetCheckboxToDefault(recordId);
            }
            checkbox.checked = checked;
            if (checked) {
                this.selectedRecords.add(recordId);
            } else {
                this.selectedRecords.delete(recordId);
            }
        });
        this.isDeleteDisabled = this.selectedRecords.size === 0;
        this.showSaveButton= false;
    }

    // Back from Child Component
    handleBackFromChild() {
        this.showTable = true;
        this.head = true;
        this.showAddInsurance = false; 
        this.showHelloComponent = false;
        this.refreshTable();
    }

    // Refresh the table data
    refreshTable() {
        refreshApex(this.wiredFormTypesResult);
    }

    // Show Toast Notification
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant,
        });
        this.dispatchEvent(event);
    }

    // Row Selection Handler for Deletion
    // handleRowSelection(event) {
    //     this.showSaveButton=false;
    //     const recordId = event.target.dataset.id;
    //     const accountId = event.target.dataset.accountId;
        
    //     if (event.target.checked) {
    //         this.selectedRecords.add(recordId);
    //         this.selectedAccountIds.add(accountId);
    //     } else {
    //         this.selectedRecords.delete(recordId);
    //         this.selectedAccountIds.delete(accountId);
    //     }

    //     this.isDeleteDisabled = this.selectedRecords.size === 0;
    // }

/////handeling update for checkbox 
@track checkboxChanges = new Map(); 
@track insuranceTypes; 

// handleRowGolive(event) {
//     this.showSaveButton=true;
//     console.log('Event:', event);

//     const recordId = event.target.dataset.id; 
//     const goLiveChecked = event.target.checked; 

//     console.log('Record ID:', recordId);
//     console.log('Go Live Checked:', goLiveChecked);
//     if (recordId) {
//         if (this.checkboxChanges.has(recordId)) {
//             this.checkboxChanges.set(recordId, goLiveChecked); 
//         } else {
//             this.checkboxChanges.set(recordId, goLiveChecked); 
//         }
//         this.disableSaveButton = this.checkboxChanges.size === 0;
//     } else {
//         console.error('Error: Record ID is undefined');
//     }
// }
handleRowGolive(event) {
   // this.showSaveButton = true;
    const recordId = event.target.dataset.id; 
    const goLiveChecked = event.target.checked;
    const originalRecord = this.insuranceTypes.find((record) => record.Id === recordId); 
    const goLiveCheckbox = this.template.querySelector(`lightning-input.go-live-checkbox[data-id="${recordId}"]`);
    if (goLiveCheckbox.checked != originalRecord.Go_Live__c) {
        this.showSaveButton = true;
    } else {
        this.showSaveButton = false;
        this.isDeleteDisabled=true;
    }

    console.log('Record ID:', recordId);
    console.log('Go Live Checked:', goLiveChecked);

    if (recordId) {
        this.checkboxChanges.set(recordId, goLiveChecked);
        this.disableSaveButton = this.checkboxChanges.size === 0;
        const inputCheckbox = this.template.querySelector(`input[data-id="${recordId}"]`);
        if (inputCheckbox) {
            inputCheckbox.checked = false; 
        } else {
            console.error('Input checkbox not found for recordId:', recordId);
        }
    } else {
        console.error('Error: Record ID is undefined');
    }
}

handleSave() {
    const changesArray = [];
    this.checkboxChanges.forEach((value, key) => {
        changesArray.push({ recordId: key, goLive: value });
    });

    updateGoLiveStatuses({
        recordIds: changesArray.map(item => item.recordId), // List of IDs
        goLives: changesArray.map(item => item.goLive) // List of Boolean values
    })
    .then(() => {
        console.log('All changes saved successfully');
        this.checkboxChanges.clear(); 
        this.showSaveButton = false; 
        this.showToast('Success', 'Go Live records saved successfully.', 'success');
        this.refreshTable();

    })
    .catch(error => {
        console.error('Error saving changes:', error);
        this.showToast('Error', 'Failed to save Go Live records: ' + error.body.message, 'error');
    });
}
    
    handleRowSelection(event) {
        this.showSaveButton=false;
        const recordId = event.target.dataset.id;
        const accountId = event.target.dataset.accountId;
        
        if (event.target.checked) {
            this.selectedRecords.add(recordId);
            this.selectedAccountIds.add(accountId);
            this.resetCheckboxToDefault(recordId);
        } else {
            this.selectedRecords.delete(recordId);
            this.selectedAccountIds.delete(accountId);
        }

        this.isDeleteDisabled = this.selectedRecords.size === 0;
    }

resetCheckboxToDefault(recordId) {
    const originalRecord = this.insuranceTypes.find((record) => record.Id === recordId);

    if (originalRecord) {
        const goLiveCheckbox = this.template.querySelector(`lightning-input.go-live-checkbox[data-id="${recordId}"]`);
        
        if (goLiveCheckbox) {
            goLiveCheckbox.checked = originalRecord.Go_Live__c;
            console.log(`Checkbox for recordId ${recordId} reverted to: ${originalRecord.Go_Live__c}`);
        } else {
            console.error('Go Live checkbox not found for recordId:', recordId);
        }
    } else {
        console.error('Original record not found for recordId:', recordId);
    }
}
handleNotifyfrompasp(event) {
    if (event.detail.message === 'homeScreen') {
        console.log(event.detail.message);
        this.showTable = true;
        this.head = true;
        this.showAddInsurance = false;
    }
}

handleTest(){
    this.TestFileUploderRpa=false;
}
}