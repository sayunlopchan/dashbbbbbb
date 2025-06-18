const Event = require("../models/Event.model");
const asyncHandler = require("../utils/asyncHandler");
const generateEventId = require("../utils/idgenerator/generateEventId");
const eventService = require("../services/event.service");
const fs = require('fs');
const path = require('path');

// In-memory store for tracking recent event creation requests
const recentEventRequests = new Map();

// Helper function to generate a request key
const generateRequestKey = (req) => {
  const userId = req.user ? req.user._id : 'anonymous';
  const { title, organizer, startTime } = req.body;
  return `${userId}-${title}-${organizer}-${startTime}`;
};

// Helper function to check if request is duplicate
const isDuplicateRequest = (requestKey) => {
  const now = Date.now();
  const requestTime = recentEventRequests.get(requestKey);
  
  if (requestTime && (now - requestTime) < 5000) { // 5 seconds window
    return true;
  }
  
  // Store the current request time
  recentEventRequests.set(requestKey, now);
  
  // Clean up old entries (older than 10 seconds)
  for (const [key, time] of recentEventRequests.entries()) {
    if (now - time > 10000) {
      recentEventRequests.delete(key);
    }
  }
  
  return false;
};

// Create a new event
const createEvent = asyncHandler(async (req, res) => {
  // Temporarily disable authentication check for testing
  // if (!req.user) {
  //   return res.status(401).json({
  //     success: false,
  //     message: "Authentication required to create an event",
  //   });
  // }

  console.log('CreateEvent called');
  console.log('Request body:', req.body);
  console.log('Request files:', req.files);
  console.log('Request user:', req.user);

  const { 
    title, 
    organizer,
    category,
    location, 
    startTime, 
    endTime, 
    description, 
    tags
  } = req.body;

  // Validate required fields
  if (!title || !organizer || !category || !location || !startTime || !endTime || !description) {
    return res.status(400).json({
      success: false,
      message: "Missing required event details",
    });
  }

  // Check for duplicate request
  const requestKey = generateRequestKey(req);
  if (isDuplicateRequest(requestKey)) {
    return res.status(429).json({
      success: false,
      message: "Duplicate request detected. Please wait a moment before trying again.",
    });
  }

  // Validate category
  const validCategories = ["fitness", "competition", "workshop", "social", "other"];
  if (!validCategories.includes(category)) {
    return res.status(400).json({
      success: false,
      message: "Invalid event category",
    });
  }

  // Handle uploaded files - store file paths
  let images = [];
  if (req.files && req.files.length > 0) {
    console.log(`Processing ${req.files.length} uploaded files`);
    console.log('Files object:', req.files);
    
    images = req.files.map(file => {
      console.log(`File details:`, {
        originalname: file.originalname,
        filename: file.filename,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size
      });
      
      // Verify file was actually saved
      if (!fs.existsSync(file.path)) {
        console.error(`File not found at path: ${file.path}`);
        throw new Error(`Failed to save file: ${file.originalname}`);
      }
      
      console.log(`✓ File successfully saved: ${file.filename} at ${file.path}`);
      
      return {
        filename: file.filename,
        originalName: file.originalname,
        path: file.path
      };
    });
    
    console.log(`Successfully processed ${images.length} images`);
  } else {
    console.log('No files uploaded or req.files is empty');
    console.log('req.files:', req.files);
  }

  // Ensure description is an array
  const descriptionArray = Array.isArray(description)
    ? description
    : [description];

  // Use username or full name as authorName
  const authorName = req.user ? (req.user.fullName || req.user.username || req.user.email) : 'Test User';

  if (!authorName) {
    return res.status(400).json({
      success: false,
      message: "Unable to determine event author name",
    });
  }

  const eventId = await generateEventId();

  // Prepare event data for service
  const eventData = {
    eventId,
    title,
    organizer,
    category,
    location,
    startTime,
    endTime,
    description: descriptionArray,
    tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
    images,
    authorName,
    participantCount: 0
  };

  // Use the event service to create the event (this will trigger email notifications)
  const event = await eventService.createEventService(eventData, req.user ? req.user._id : null);

  // Verify all images are accessible
  if (images.length > 0) {
    console.log('Verifying saved images...');
    images.forEach(img => {
      if (fs.existsSync(img.path)) {
        console.log(`✓ Image verified: ${img.filename}`);
      } else {
        console.error(`✗ Image not found: ${img.filename}`);
      }
    });
  }

  // Return event data with file paths
  const eventResponse = event.toObject();
  eventResponse.images = eventResponse.images.map(img => ({
    filename: img.filename,
    originalName: img.originalName,
    path: img.path
  }));

  res.status(201).json({
    success: true,
    message: "Event created successfully",
    event: eventResponse,
  });
});

// Get all events
const getAllEvents = asyncHandler(async (req, res) => {
  // Get all events without pagination
  const events = await Event.find({}).sort({ startTime: -1 });

  res.status(200).json({
    success: true,
    docs: events,
    pagination: {
      total: events.length,
      page: 1,
      limit: events.length,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  });
});

// Get event by EventId
const getEventById = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const event = await Event.findOne({ eventId });

  if (!event) {
    return res.status(404).json({
      success: false,
      message: "Event not found",
    });
  }

  // Return event data with file paths
  const eventResponse = event.toObject();
  eventResponse.images = eventResponse.images.map(img => ({
    filename: img.filename,
    originalName: img.originalName,
    path: img.path
  }));

  res.status(200).json({
    success: true,
    event: eventResponse,
  });
});

// Add a new route to get event image
const getEventImage = asyncHandler(async (req, res) => {
  const { eventId, imageId } = req.params;

  const event = await Event.findOne({ eventId });
  if (!event) {
    return res.status(404).json({
      success: false,
      message: "Event not found",
    });
  }

  const image = event.images.find(img => img.filename === imageId);
  if (!image) {
    return res.status(404).json({
      success: false,
      message: "Image not found",
    });
  }

  // Serve the image file from filesystem
  const imagePath = path.join(process.cwd(), 'uploads', image.filename);
  
  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({
      success: false,
      message: "Image file not found",
    });
  }

  res.sendFile(imagePath);
});

// Update event
const updateEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { 
    title, 
    organizer,
    category,
    location, 
    startTime, 
    endTime, 
    description, 
    tags
  } = req.body;

  console.log('UpdateEvent called for eventId:', eventId);
  console.log('Request body:', req.body);
  console.log('Request files:', req.files);

  const event = await Event.findOne({ eventId });

  if (!event) {
    return res.status(404).json({
      success: false,
      message: "Event not found",
    });
  }

  console.log('Current event images:', event.images);

  // Validate category if provided
  if (category) {
    const validCategories = ["fitness", "competition", "workshop", "social", "other"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event category",
      });
    }
  }

  // Handle uploaded files
  if (req.files && req.files.length > 0) {
    console.log(`Adding ${req.files.length} new images`);
    // Add new images
    const newImages = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path
    }));
    event.images.push(...newImages);
    console.log('New images added:', newImages);
  } else {
    console.log('No new images uploaded');
  }

  console.log('Updated event images:', event.images);

  // Update fields if provided
  if (title) event.title = title;
  if (organizer) event.organizer = organizer;
  if (category) event.category = category;
  if (location) event.location = location;
  if (startTime) event.startTime = startTime;
  if (endTime) event.endTime = endTime;

  // Ensure description is an array if provided
  if (description) {
    event.description = Array.isArray(description)
      ? description
      : [description];
  }

  if (tags) event.tags = tags.split(',').map(tag => tag.trim());

  await event.save();

  // Return event data with file paths
  const eventResponse = event.toObject();
  eventResponse.images = eventResponse.images.map(img => ({
    filename: img.filename,
    originalName: img.originalName,
    path: img.path
  }));

  res.status(200).json({
    success: true,
    message: "Event updated successfully",
    event: eventResponse,
  });
});

// Delete event
const deleteEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const event = await Event.findOne({ eventId });

  if (!event) {
    return res.status(404).json({
      success: false,
      message: "Event not found",
    });
  }

  console.log('🗑️ Deleting event:', {
    eventId: event.eventId,
    title: event.title,
    imageCount: event.images?.length || 0
  });

  // Delete associated images from filesystem
  if (event.images && event.images.length > 0) {
    console.log(`🗑️ Deleting ${event.images.length} images from filesystem`);
    
    const deletedImages = [];
    const failedImages = [];

    for (const image of event.images) {
      if (image.filename) {
        try {
          const imagePath = path.join(process.cwd(), 'uploads', image.filename);
          console.log(`🗑️ Attempting to delete image: ${imagePath}`);
          
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            deletedImages.push(image.filename);
            console.log(`✅ Successfully deleted image: ${image.filename}`);
          } else {
            console.warn(`⚠️ Image file not found: ${imagePath}`);
            failedImages.push({ filename: image.filename, reason: 'File not found' });
          }
        } catch (error) {
          console.error(`❌ Failed to delete image ${image.filename}:`, error.message);
          failedImages.push({ filename: image.filename, reason: error.message });
        }
      }
    }

    console.log('📊 Image deletion summary:', {
      total: event.images.length,
      deleted: deletedImages.length,
      failed: failedImages.length,
      deletedFiles: deletedImages,
      failedFiles: failedImages
    });
  } else {
    console.log('ℹ️ No images to delete for this event');
  }

  // Delete the event from database
  await event.deleteOne();
  console.log(`✅ Event deleted successfully: ${event.eventId}`);

  res.status(200).json({
    success: true,
    message: "Event deleted successfully",
  });
});

// Debug endpoint to check uploads directory
const checkUploadsDirectory = asyncHandler(async (req, res) => {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  
  try {
    const exists = fs.existsSync(uploadsDir);
    let files = [];
    
    if (exists) {
      files = fs.readdirSync(uploadsDir);
    }
    
    res.status(200).json({
      success: true,
      uploadsDirectory: uploadsDir,
      exists: exists,
      fileCount: files.length,
      files: files
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint for file upload (no authentication required)
const testFileUpload = asyncHandler(async (req, res) => {
  console.log('Test file upload endpoint called');
  console.log('Request body:', req.body);
  console.log('Request files:', req.files);
  
  if (req.files && req.files.length > 0) {
    const uploadedFiles = req.files.map(file => ({
      originalname: file.originalname,
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size
    }));
    
    res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      files: uploadedFiles,
      count: req.files.length
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'No files uploaded',
      body: req.body
    });
  }
});

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventImage,
  checkUploadsDirectory,
  testFileUpload
};
