import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class MonthlyBudgetForm extends LightningElement {
    handleClear() {
        const inputFields = this.template.querySelectorAll('lightning-input-field');
        if (inputFields) {
            inputFields.forEach(field => {
                field.reset();
            });
        }
    }

    handleError(event) {
        const error = event.detail;
        let message = 'Unknown error';
        if (Array.isArray(error.body)) {
            message = error.body.map(e => e.message).join(', ');
        } else if (error.body && error.body.message) {
            message = error.body.message;
        } else if (error.message) {
            message = error.message;
        }

        const eventToast = new ShowToastEvent({
            title: 'Error',
            message: message,
            variant: 'error'
        });
        this.dispatchEvent(eventToast);
    }
    handleSuccess() {
        const event = new ShowToastEvent({
            title: 'Success',
            message: 'Budget created successfully',
            variant: 'success'
        });
        this.dispatchEvent(event);
        this.handleClear();
    }
}