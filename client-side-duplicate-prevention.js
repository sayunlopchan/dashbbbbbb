/**
 * Client-side duplicate prevention for event creation
 * This script prevents double-clicking and multiple form submissions
 */

class DuplicatePrevention {
  constructor() {
    this.submitting = false;
    this.submitTimeout = null;
  }

  /**
   * Prevent duplicate form submissions
   * @param {HTMLFormElement} form - The form element
   * @param {Function} submitHandler - The original submit handler
   */
  preventDuplicateSubmission(form, submitHandler) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (this.submitting) {
        console.log('Form submission already in progress, ignoring duplicate click');
        return;
      }

      this.submitting = true;
      
      // Disable submit button
      const submitButton = form.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = 'Creating Event...';
      
      try {
        await submitHandler(e);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        // Re-enable submit button after 3 seconds
        this.submitTimeout = setTimeout(() => {
          this.submitting = false;
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }, 3000);
      }
    });
  }

  /**
   * Prevent double-clicking on buttons
   * @param {HTMLButtonElement} button - The button element
   * @param {Function} clickHandler - The original click handler
   */
  preventDoubleClick(button, clickHandler) {
    button.addEventListener('click', async (e) => {
      if (this.submitting) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Button click ignored - already processing');
        return;
      }

      this.submitting = true;
      button.disabled = true;
      
      const originalText = button.textContent;
      button.textContent = 'Processing...';
      
      try {
        await clickHandler(e);
      } catch (error) {
        console.error('Button click error:', error);
      } finally {
        // Re-enable button after 3 seconds
        this.submitTimeout = setTimeout(() => {
          this.submitting = false;
          button.disabled = false;
          button.textContent = originalText;
        }, 3000);
      }
    });
  }

  /**
   * Reset the prevention state (useful for manual reset)
   */
  reset() {
    this.submitting = false;
    if (this.submitTimeout) {
      clearTimeout(this.submitTimeout);
      this.submitTimeout = null;
    }
  }
}

// Usage examples:

// Example 1: Prevent duplicate form submissions
/*
const duplicatePrevention = new DuplicatePrevention();

document.addEventListener('DOMContentLoaded', () => {
  const eventForm = document.getElementById('eventForm');
  
  if (eventForm) {
    duplicatePrevention.preventDuplicateSubmission(eventForm, async (e) => {
      // Your form submission logic here
      const formData = new FormData(eventForm);
      
      try {
        const response = await fetch('/api/events', {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
          alert('Event created successfully!');
          eventForm.reset();
        } else {
          alert('Error: ' + result.message);
        }
      } catch (error) {
        alert('Network error: ' + error.message);
      }
    });
  }
});
*/

// Example 2: Prevent double-clicking on buttons
/*
const duplicatePrevention = new DuplicatePrevention();

document.addEventListener('DOMContentLoaded', () => {
  const createEventButton = document.getElementById('createEventBtn');
  
  if (createEventButton) {
    duplicatePrevention.preventDoubleClick(createEventButton, async (e) => {
      // Your button click logic here
      try {
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventData)
        });
        
        const result = await response.json();
        
        if (result.success) {
          alert('Event created successfully!');
        } else {
          alert('Error: ' + result.message);
        }
      } catch (error) {
        alert('Network error: ' + error.message);
      }
    });
  }
});
*/

// Example 3: Global prevention for all submit buttons
/*
const duplicatePrevention = new DuplicatePrevention();

document.addEventListener('DOMContentLoaded', () => {
  const submitButtons = document.querySelectorAll('button[type="submit"]');
  
  submitButtons.forEach(button => {
    duplicatePrevention.preventDoubleClick(button, async (e) => {
      // Let the form handle the submission naturally
      // This just prevents multiple clicks
    });
  });
});
*/

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DuplicatePrevention;
} 