# User Management - Edit Functionality

## Overview
Business owners can now edit existing users to update their details, change roles, and modify care home assignments retrospectively.

## Features

### ✅ What Can Be Edited

1. **First Name** - Update user's first name
2. **Last Name** - Update user's last name  
3. **Role** - Change between Carer, Manager, or Business Owner
4. **Care Home Assignments** - Add or remove care homes for managers

### ❌ What Cannot Be Edited

1. **Email Address** - Locked for security (shown as disabled field)
2. **User ID** - System-generated, immutable
3. **Creation Date** - Historical data

## User Interface

### Edit Button
- **Location**: Right side of each user card
- **Icon**: Blue pencil/edit icon
- **Color**: Blue (distinguishes from red delete button)
- **Hover**: Blue background highlight

### Edit Dialog
- **Modal popup**: Overlays the page
- **Same layout as Add User**: Familiar interface
- **Pre-filled data**: All current values loaded
- **Email disabled**: Shows but cannot be changed
- **Dynamic care homes**: Only shown for managers

## Role Change Behavior

### Promoting to Manager (e.g., Carer → Manager)
```
Before: John Smith - Carer
Action: Edit → Change role to "Manager"
Result: Care home checkboxes appear
Action: Select care homes
Result: John now manages selected homes
```

### Demoting from Manager (e.g., Manager → Carer)
```
Before: Sarah Jones - Manager (3 homes assigned)
Action: Edit → Change role to "Carer"  
Result: Care home assignments automatically removed
Reason: Carers don't have home-specific access
```

### Changing Care Home Assignments (Manager → Manager)
```
Before: Mike Brown - Manager (Sunrise, Oak Valley)
Action: Edit → Uncheck Oak Valley, Check Green Meadows
Result: Mike now manages (Sunrise, Green Meadows)
Effect: Mike loses access to Oak Valley data
Effect: Mike gains access to Green Meadows data
```

## Data Integrity

### Automatic Cleanup
When changing from manager to another role:
1. System detects role change
2. Queries `manager_care_homes` table
3. Deletes all assignments for that user
4. Ensures data consistency

### Assignment Updates
When updating manager assignments:
1. Delete ALL existing assignments
2. Insert NEW assignments
3. Prevents duplicate/orphaned records
4. Clean slate approach

## Database Operations

### Update Profile
```typescript
await supabase
  .from('profiles')
  .update({
    first_name: 'Updated Name',
    last_name: 'Updated Surname',
    role: 'manager'
  })
  .eq('id', userId)
```

### Remove Old Assignments
```typescript
await supabase
  .from('manager_care_homes')
  .delete()
  .eq('manager_id', userId)
```

### Add New Assignments
```typescript
const assignments = selectedHomes.map(homeId => ({
  manager_id: userId,
  care_home_id: homeId,
  assigned_by: currentUser.id
}))

await supabase
  .from('manager_care_homes')
  .insert(assignments)
```

## Security & Permissions

### Who Can Edit?
- ✅ **Business Owners**: Can edit ALL users
- ❌ **Managers**: Cannot access user management
- ❌ **Carers**: Cannot access user management

### Self-Edit Protection
- **Own account**: Can edit (shows Edit button)
- **Purpose**: Update own name/details
- **Limitation**: Cannot change own role (prevents privilege escalation)
- **Cannot delete**: Own account protected from deletion

## Success & Error Handling

### Success States
- **Green alert**: "User updated successfully!"
- **Auto-refresh**: User list updates immediately
- **Auto-close**: Dialog closes after 1.5 seconds
- **Visual feedback**: Updated data visible instantly

### Error States
- **Red alert**: Shows specific error message
- **Field validation**: Required field warnings
- **Database errors**: "Failed to update user profile"
- **Assignment errors**: "User updated but failed to update care homes"

## Use Cases

### 1. Correcting User Details
**Scenario**: User's name was entered incorrectly
- Click Edit
- Fix first name or last name
- Save
- Name updates everywhere

### 2. Promoting Staff
**Scenario**: Experienced carer becomes manager
- Edit user
- Change role to "Manager"
- Assign care homes
- User gains manager-level access

### 3. Reorganizing Management
**Scenario**: Restructuring which managers oversee which homes
- Edit each manager
- Adjust care home assignments
- Changes apply immediately
- Data access updates in real-time

### 4. Temporary Coverage
**Scenario**: Manager on leave, another manager covers
- Edit covering manager
- Add temporary homes
- Manager can access during coverage
- Remove when original manager returns

### 5. Demoting for Compliance
**Scenario**: Manager role no longer needed
- Edit user
- Change to Carer
- All manager privileges removed
- Care home assignments cleared

## Visual Design

### Edit Dialog Layout
```
┌─────────────────────────────┐
│ Edit User                   │
├─────────────────────────────┤
│ Email: john@example.com     │ (Disabled)
│                             │
│ First Name: [John      ]    │
│ Last Name:  [Smith     ]    │
│                             │
│ Role: [Manager        ▼]    │
│                             │
│ 🏢 Assign Care Homes        │
│ ☑ Sunrise Manor             │
│ ☐ Oak Valley Care           │
│ ☑ Green Meadows            │
│                             │
│     [Cancel]  [Update User] │
└─────────────────────────────┘
```

### User Card with Edit Button
```
┌──────────────────────────────────────┐
│ JS  John Smith                    ✏️ 🗑️ │
│     john@example.com                 │
│     [Manager Badge]                  │
│                                      │
│     🏢 Manages 2 care homes:         │
│     [Sunrise Manor] [Green Meadows]  │
└──────────────────────────────────────┘
```

## Benefits

### 1. **Flexibility**
- No need to delete and recreate users
- Fix mistakes easily
- Adapt to organizational changes

### 2. **Audit Trail**
- `assigned_by` tracks who made changes
- `assigned_at` shows when assigned
- Historical record maintained

### 3. **User Experience**
- Intuitive interface
- Familiar to Add User flow
- Clear visual feedback
- Error handling

### 4. **Data Integrity**
- Automatic cleanup on role changes
- No orphaned assignments
- Consistent state

### 5. **Real-time Updates**
- Changes apply immediately
- No page refresh needed
- Users see updated data instantly

## Testing Scenarios

### Test 1: Edit User Details
- [x] Update first name
- [x] Update last name
- [x] Verify changes in user list
- [x] Check email remains unchanged

### Test 2: Promote to Manager
- [x] Change carer to manager
- [x] Assign care homes
- [x] Verify manager sees only assigned homes
- [x] Verify manager can see assigned homes' clients

### Test 3: Demote from Manager
- [x] Change manager to carer
- [x] Verify care home assignments removed
- [x] Verify user loses manager-specific access
- [x] Verify user can still see all data as carer

### Test 4: Reassign Care Homes
- [x] Edit manager
- [x] Change care home selections
- [x] Verify old assignments removed
- [x] Verify new assignments added
- [x] Verify access changes immediately

### Test 5: Error Handling
- [x] Leave required field empty
- [x] Verify error message shown
- [x] Network error during update
- [x] Partial update failure

## Future Enhancements

Potential additions:
- **Activity log**: Track all changes to users
- **Bulk edit**: Update multiple users at once
- **Password reset**: Allow password changes
- **Account status**: Activate/deactivate accounts
- **Email change**: With verification workflow
- **Role history**: See past role changes

## Conclusion

The edit functionality provides business owners with complete control over user management while maintaining security, data integrity, and a great user experience. Combined with the ability to assign care homes, it creates a flexible, scalable system for managing multi-site care organizations.
