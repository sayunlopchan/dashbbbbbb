# Duplicate Event Prevention System

## Overview
This system prevents duplicate events from being created when users double-click the create event button or submit the form multiple times. It implements multiple layers of protection at both server-side and client-side.

## 🛡️ **Protection Layers**

### **1. Server-Side Duplicate Detection**
- **Location**: `src/services/event.service.js`
- **Method**: Database query to check for existing events
- **Criteria**: Same title, organizer, and start time within 5 minutes
- **Response**: Error message if duplicate detected

### **2. Request Deduplication**
- **Location**: `src/controllers/event.controller.js`
- **Method**: In-memory tracking of recent requests
- **Window**: 5-second window to prevent duplicate requests
- **Response**: HTTP 429 (Too Many Requests) for duplicates

### **3. Client-Side Prevention**
- **Location**: `client-side-duplicate-prevention.js`
- **Method**: Button disabling and form submission prevention
- **Features**: Visual feedback and automatic re-enabling

## 🔧 **How It Works**

### **Server-Side Logic**

#### **1. Database Duplicate Check**
```javascript
// Check for duplicate events (same title, organizer, and start time within 5 minutes)
const startTimeDate = new Date(startTime);
const fiveMinutesBefore = new Date(startTimeDate.getTime() - 5 * 60 * 1000);
const fiveMinutesAfter = new Date(startTimeDate.getTime() + 5 * 60 * 1000);

const existingEvent = await Event.findOne({
  title: title.trim(),
  organizer: organizer.trim(),
  startTime: {
    $gte: fiveMinutesBefore,
    $lte: fiveMinutesAfter
  }
});

if (existingEvent) {
  throw new Error(`An event with the same title "${title}" by "${organizer}" at this time already exists.`);
}
```

#### **2. Request Deduplication**
```javascript
// Generate unique request key
const requestKey = `${userId}-${title}-${organizer}-${startTime}`;

// Check if request is duplicate within 5 seconds
if (isDuplicateRequest(requestKey)) {
  return res.status(429).json({
    success: false,
    message: "Duplicate request detected. Please wait a moment before trying again."
  });
}
```

### **Client-Side Logic**

#### **Button Prevention**
```javascript
// Disable button and show loading state
button.disabled = true;
button.textContent = 'Creating Event...';

// Re-enable after 3 seconds
setTimeout(() => {
  button.disabled = false;
  button.textContent = originalText;
}, 3000);
```

## 📋 **Error Responses**

### **Duplicate Event Error**
```json
{
  "success": false,
  "message": "An event with the same title \"Fitness Workshop\" by \"John Doe\" at this time already exists. Please check for duplicates."
}
```

### **Duplicate Request Error**
```json
{
  "success": false,
  "message": "Duplicate request detected. Please wait a moment before trying again."
}
```

## 🎯 **Implementation Guide**

### **Frontend Integration**

#### **1. Include the Prevention Script**
```html
<script src="client-side-duplicate-prevention.js"></script>
```

#### **2. Apply to Event Form**
```javascript
const duplicatePrevention = new DuplicatePrevention();

document.addEventListener('DOMContentLoaded', () => {
  const eventForm = document.getElementById('eventForm');
  
  if (eventForm) {
    duplicatePrevention.preventDuplicateSubmission(eventForm, async (e) => {
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
```

#### **3. Apply to Individual Buttons**
```javascript
const createEventButton = document.getElementById('createEventBtn');

if (createEventButton) {
  duplicatePrevention.preventDoubleClick(createEventButton, async (e) => {
    // Your event creation logic here
  });
}
```

## ⚙️ **Configuration Options**

### **Server-Side Settings**

#### **Duplicate Detection Window**
- **Current**: 5 minutes before/after start time
- **Modify**: Change the `5 * 60 * 1000` value in milliseconds

#### **Request Deduplication Window**
- **Current**: 5 seconds
- **Modify**: Change the `5000` value in `isDuplicateRequest` function

### **Client-Side Settings**

#### **Button Re-enable Delay**
- **Current**: 3 seconds
- **Modify**: Change the `3000` value in the setTimeout

#### **Loading Text**
- **Current**: "Creating Event..." / "Processing..."
- **Modify**: Change the button textContent values

## 🔍 **Testing the System**

### **1. Test Duplicate Detection**
1. Create an event with specific title, organizer, and time
2. Try to create another event with the same details within 5 minutes
3. Should receive duplicate error message

### **2. Test Request Deduplication**
1. Double-click the create event button rapidly
2. First request should succeed, subsequent requests should be blocked
3. Should receive "Duplicate request detected" message

### **3. Test Client-Side Prevention**
1. Click create event button
2. Button should be disabled and show loading text
3. Button should re-enable after 3 seconds

## 🚨 **Troubleshooting**

### **Common Issues**

#### **1. Events Still Being Duplicated**
- Check if the duplicate detection query is working
- Verify the time window is appropriate for your use case
- Check if the request deduplication is functioning

#### **2. False Positives**
- Adjust the time window if legitimate events are being blocked
- Check if the duplicate criteria are too strict

#### **3. Client-Side Not Working**
- Ensure the JavaScript file is properly loaded
- Check browser console for errors
- Verify the form/button IDs match

### **Debug Information**

#### **Server Logs**
- Event creation attempts are logged
- Duplicate detection results are logged
- Request deduplication status is logged

#### **Client Logs**
- Form submission attempts are logged
- Button click prevention is logged
- Network errors are logged

## 🔄 **Maintenance**

### **Memory Management**
- The in-memory request store automatically cleans up old entries
- Entries older than 10 seconds are removed
- No manual cleanup required

### **Performance Impact**
- Minimal performance impact from duplicate checks
- Database query is indexed and efficient
- In-memory store is lightweight

## 🔮 **Future Enhancements**

### **Potential Improvements**
1. **Redis-based Deduplication**: Use Redis for distributed request tracking
2. **User Preferences**: Allow users to configure duplicate detection sensitivity
3. **Advanced Matching**: More sophisticated duplicate detection algorithms
4. **Audit Trail**: Log all duplicate attempts for analysis
5. **Admin Override**: Allow admins to bypass duplicate detection when needed 