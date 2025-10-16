# Care Home Image Upload Feature

## Overview
Added image upload functionality to care homes, allowing business owners to upload and display photos of their care facilities.

## Changes Made

### 1. Database Migration
**File:** `supabase/migrations/006_add_care_home_images.sql`
- Added `image_url` TEXT column to `care_homes` table
- Created `care-home-images` storage bucket (public)
- Set up Row Level Security policies for the storage bucket:
  - Authenticated users can upload, update, and delete images
  - Public users can view images

**To Apply:** Run the SQL in `supabase/RUN_THIS_SQL_FOR_IMAGES.sql` in your Supabase SQL Editor

### 2. Care Homes Listing Page
**File:** `src/app/care-homes/page.tsx`
- Updated `CareHome` interface to include `image_url` field
- Added image display at the top of each care home card
- Images are displayed as a 48-height banner above the card header
- Fallback handling if image fails to load

**Display Location:** Top of each care home card before the header

### 3. New Care Home Form
**File:** `src/app/care-homes/new/page.tsx`
- Added image upload input with drag-and-drop functionality
- Image preview before upload
- File validation (type and size - max 5MB)
- Automatic upload to Supabase storage on form submission
- Image URL saved to database after successful upload
- Loading states for image upload process

**Features:**
- Drag and drop or click to upload
- Image preview with remove option
- Accepts: PNG, JPG, JPEG, WEBP
- Max file size: 5MB

### 4. Care Home Detail Page
**File:** `src/app/care-homes/[id]/page.tsx`
- Updated `CareHome` interface to include `image_url` field
- Added hero banner display when image exists
- Image shown as full-width banner (height: 64 on mobile, 80 on desktop)
- Care home name and badges overlay on the image with gradient
- Fallback to original layout when no image

**Display Location:** Full-width hero banner at the top of the page with overlaid text

## User Flow

### Adding a Care Home with Image:
1. Business owner navigates to "Add Care Home"
2. Fills in care home details
3. Optional: Uploads care home photo
   - Click or drag image into upload area
   - Preview appears with option to remove
4. Submits form
5. Image is uploaded to Supabase storage
6. Image URL is saved to database
7. Redirected to care homes list

### Viewing Care Homes:
1. **List View:** Care home images appear as banners at the top of each card
2. **Detail View:** Care home image appears as a full-width hero banner with name overlaid

## Technical Details

### Storage Structure:
- **Bucket Name:** `care-home-images`
- **File Naming:** `{careHomeId}-{timestamp}.{extension}`
- **Access:** Public read, authenticated write

### Image Handling:
- Client-side preview using FileReader API
- Upload after care home creation using care home ID
- Automatic URL generation using Supabase's `getPublicUrl()`
- Error handling for failed uploads and missing images

## Next Steps (Optional Enhancements)

1. **Edit Care Home:** Add image upload/change functionality to edit form
2. **Image Management:** Allow replacing or removing existing images
3. **Image Optimization:** Add automatic resizing/compression
4. **Multiple Images:** Support gallery of multiple images per care home
5. **Image Cropping:** Add image cropping tool before upload

## Files Modified
- `supabase/migrations/006_add_care_home_images.sql` (new)
- `supabase/RUN_THIS_SQL_FOR_IMAGES.sql` (new)
- `src/app/care-homes/page.tsx`
- `src/app/care-homes/new/page.tsx`
- `src/app/care-homes/[id]/page.tsx`

## Testing Checklist
- [ ] Run SQL migration in Supabase
- [ ] Create new care home with image
- [ ] Verify image appears on listing page
- [ ] Verify image appears on detail page
- [ ] Test without image (should work normally)
- [ ] Test file validation (wrong type, too large)
- [ ] Test image upload failure handling
