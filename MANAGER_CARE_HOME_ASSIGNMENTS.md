# Manager Care Home Assignments Feature

## Overview
This feature allows business owners to assign specific care homes to managers. Managers will only see data (care homes, clients, care plans, etc.) for the homes they manage.

## Database Changes

### New Table: `manager_care_homes`
Junction table linking managers to their assigned care homes.

**Columns:**
- `id` (UUID) - Primary key
- `manager_id` (UUID) - Reference to the manager (auth.users)
- `care_home_id` (UUID) - Reference to the care home
- `assigned_at` (TIMESTAMPTZ) - When the assignment was made
- `assigned_by` (UUID) - Business owner who made the assignment

**Migration File:** `supabase/migrations/008_manager_care_home_assignments.sql`

### Row Level Security (RLS)
- Business owners can manage all assignments
- Managers can view their own assignments
- Carers can view assignments (for context)

## Features Implemented

### 1. User Management Page (`/users`)

#### Care Home Assignment UI
- **When adding a manager**: Business owners see a checkbox list of all active care homes
- **Visual selection**: Checkboxes with care home name and address
- **Real-time feedback**: Selected homes are highlighted
- **Role-based display**: Assignment section only appears when "Manager" role is selected

#### Edit User Functionality
- **Edit button**: Blue edit icon on each user card
- **Update details**: Change first name, last name
- **Change role**: Modify user role (carer → manager → business owner)
- **Reassign homes**: Add or remove care home assignments for managers
- **Role transitions**: Automatically removes care home assignments when changing from manager to another role
- **Cannot edit**: Email addresses (security requirement)
- **Real-time updates**: Changes apply immediately

#### User List Display
- **Manager assignments shown**: Each manager's card shows which care homes they manage
- **Visual indicators**: Building icon with count and badge list
- **Example**: "Manages 3 care homes: [Sunrise Care] [Oak Manor] [Green Valley]"
- **Action buttons**: Edit (blue) and Delete (red) icons for each user
- **Protection**: Cannot delete your own account

### 2. Care Homes Page (`/care-homes`)

#### Filtering Logic
- **Business Owners**: See ALL care homes
- **Managers**: Only see care homes assigned to them
- **Carers**: See all care homes (for reference)
- **Empty state**: If manager has no assignments, shows appropriate message

#### Implementation
```typescript
// Managers only see their assigned homes
if (profile?.role === 'manager') {
  const assignments = await getManagerAssignments(profile.id)
  query = query.in('id', assignedHomeIds)
}
```

### 3. Clients Page (`/clients`)

#### Filtering Logic
- **Business Owners**: See ALL clients
- **Managers**: Only see clients in their assigned care homes
- **Carers**: See all clients
- **Care home filter**: Dropdown only shows manager's assigned homes

#### Implementation
```typescript
// Filter clients by manager's assigned homes
if (profile?.role === 'manager') {
  const assignments = await getManagerAssignments(profile.id)
  clientsQuery = clientsQuery.in('care_home_id', assignedHomeIds)
  homesQuery = homesQuery.in('id', assignedHomeIds)
}
```

## User Experience Flow

### Business Owner Creating a Manager

1. Click "Add User" button
2. Fill in email, name
3. Select role: **Manager**
4. Care home assignment section appears
5. Check boxes for care homes this manager will oversee
6. Generate/enter password
7. Click "Create User"
8. Share credentials with the new manager

### Business Owner Editing a User

1. Click the blue **Edit** icon on any user card
2. Update first name, last name if needed
3. Change role if needed (e.g., promote carer to manager)
4. If changing to manager: Select care homes to assign
5. If changing from manager: Care home assignments are automatically removed
6. Click "Update User"
7. Changes apply immediately

### Examples of Role Changes

**Promoting a Carer to Manager:**
1. Click Edit on carer's profile
2. Change role from "Carer" to "Manager"
3. Care home selection checkboxes appear
4. Select care homes to assign
5. Save - User now has manager access to selected homes

**Demoting a Manager to Carer:**
1. Click Edit on manager's profile
2. Change role from "Manager" to "Carer"
3. Care home assignments automatically removed
4. Save - User now has carer-level access

**Reassigning Manager's Homes:**
1. Click Edit on manager's profile
2. Role is already "Manager"
3. Check/uncheck care homes
4. Save - Manager's access updates immediately

### Manager Logging In

1. Manager logs in with provided credentials
2. Dashboard loads
3. **Care Homes page**: Shows only assigned homes
4. **Clients page**: Shows only clients in assigned homes  
5. **All other data**: Filtered to assigned homes (care plans, handovers, incidents)

### Example Scenario

**Sunrise Care Network** has 5 care homes:
- Sunrise Manor (London)
- Oak Valley (Manchester)
- Green Meadows (Birmingham)
- Riverside Care (Leeds)
- Hillside House (Bristol)

**Manager: Sarah Johnson**
- Assigned to: Sunrise Manor, Oak Valley
- Can see: Only clients, care plans, incidents from these 2 homes
- Cannot see: Data from Green Meadows, Riverside, or Hillside

**Manager: Mike Brown**
- Assigned to: Green Meadows, Riverside Care, Hillside House
- Can see: Data from these 3 homes only
- Cannot see: Data from Sunrise Manor or Oak Valley

## Data Isolation Benefits

### 1. **Security**
- Managers can't access data outside their responsibility
- Reduces risk of unauthorized data access
- Clear audit trail of who manages what

### 2. **Compliance**
- GDPR: Data minimization - users only see what they need
- CQC: Clear management structure and responsibilities
- Data protection: Reduced exposure to sensitive information

### 3. **Usability**
- Managers see only relevant data
- Less clutter in dropdowns and lists
- Faster page loads (less data to fetch)
- Better focus on assigned homes

### 4. **Organizational Structure**
- Clear reporting lines
- Easy to see manager responsibilities
- Scalable as organization grows
- Supports regional management structures

## Future Enhancements

### Potential Additions:
1. **Bulk assignment**: Assign multiple managers to one home
2. **Temporary assignments**: Time-limited access for cover managers
3. **Assignment history**: Track changes over time
4. **Notifications**: Alert managers when assigned to new homes
5. **Manager dashboard**: Overview of all assigned homes with KPIs
6. **Reports**: Manager-specific reports for their homes
7. **Delegation**: Managers assign specific staff to their homes

## Testing Checklist

- [ ] Business owner can assign homes when creating manager
- [ ] Business owner can see all homes and clients
- [ ] Manager only sees assigned care homes
- [ ] Manager only sees clients in assigned homes
- [ ] Manager with no assignments sees empty state
- [ ] Carer sees all homes and clients
- [ ] Care home filter shows only relevant homes for managers
- [ ] User list displays manager assignments correctly
- [ ] Database constraints prevent invalid assignments
- [ ] RLS policies work correctly for all roles

## Database Migration Instructions

Run the migration to add the new table:

```bash
supabase db push
```

Or manually run:
```sql
-- See: supabase/migrations/008_manager_care_home_assignments.sql
```

## API Usage Examples

### Get Manager's Assigned Homes
```typescript
const { data } = await supabase
  .from('manager_care_homes')
  .select('care_home_id, care_homes(*)')
  .eq('manager_id', managerId)
```

### Assign Care Home to Manager
```typescript
await supabase
  .from('manager_care_homes')
  .insert({
    manager_id: userId,
    care_home_id: homeId,
    assigned_by: currentUser.id
  })
```

### Remove Assignment
```typescript
await supabase
  .from('manager_care_homes')
  .delete()
  .eq('manager_id', userId)
  .eq('care_home_id', homeId)
```

## Notes

- **Backwards Compatible**: Existing managers without assignments can be assigned homes later
- **Flexible**: Same pattern can be applied to other data (care plans, incidents, etc.)
- **Scalable**: Works for organizations with 1-1000+ care homes
- **Performance**: Indexed for fast lookups

This feature provides a robust foundation for multi-site care management with proper data isolation and security.
