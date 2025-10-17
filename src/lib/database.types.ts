export type UserRole = 'carer' | 'manager' | 'business_owner';

export type CareHomeType = 'residential' | 'nursing' | 'dementia' | 'learning_disabilities' | 'mental_health';

export type AssessmentType = 'initial' | 'review' | 'incident' | 'health_check' | 'care_plan_review';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'closed';

export type ShiftType = 'day' | 'evening' | 'night';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          avatar_url: string | null;
          role: UserRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      care_homes: {
        Row: {
          id: string;
          name: string;
          address: string;
          postcode: string;
          phone: string | null;
          email: string | null;
          care_home_type: CareHomeType;
          capacity: number;
          current_occupancy: number;
          manager_id: string | null;
          cqc_rating: string | null;
          cqc_registration_number: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          postcode: string;
          phone?: string | null;
          email?: string | null;
          care_home_type: CareHomeType;
          capacity: number;
          current_occupancy?: number;
          manager_id?: string | null;
          cqc_rating?: string | null;
          cqc_registration_number?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          postcode?: string;
          phone?: string | null;
          email?: string | null;
          care_home_type?: CareHomeType;
          capacity?: number;
          current_occupancy?: number;
          manager_id?: string | null;
          cqc_rating?: string | null;
          cqc_registration_number?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          care_home_id: string;
          nhs_number: string | null;
          first_name: string;
          last_name: string;
          date_of_birth: string;
          gender: Gender | null;
          address: string | null;
          postcode: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          emergency_contact_relationship: string | null;
          gp_name: string | null;
          gp_practice: string | null;
          gp_phone: string | null;
          admission_date: string | null;
          discharge_date: string | null;
          room_number: string | null;
          dietary_requirements: string | null;
          allergies: string | null;
          medical_conditions: string | null;
          medications: string | null;
          mobility_notes: string | null;
          communication_notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          care_home_id: string;
          nhs_number?: string | null;
          first_name: string;
          last_name: string;
          date_of_birth: string;
          gender?: Gender | null;
          address?: string | null;
          postcode?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relationship?: string | null;
          gp_name?: string | null;
          gp_practice?: string | null;
          gp_phone?: string | null;
          admission_date?: string | null;
          discharge_date?: string | null;
          room_number?: string | null;
          dietary_requirements?: string | null;
          allergies?: string | null;
          medical_conditions?: string | null;
          medications?: string | null;
          mobility_notes?: string | null;
          communication_notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          care_home_id?: string;
          nhs_number?: string | null;
          first_name?: string;
          last_name?: string;
          date_of_birth?: string;
          gender?: Gender | null;
          address?: string | null;
          postcode?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relationship?: string | null;
          gp_name?: string | null;
          gp_practice?: string | null;
          gp_phone?: string | null;
          admission_date?: string | null;
          discharge_date?: string | null;
          room_number?: string | null;
          dietary_requirements?: string | null;
          allergies?: string | null;
          medical_conditions?: string | null;
          medications?: string | null;
          mobility_notes?: string | null;
          communication_notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      care_plans: {
        Row: {
          id: string;
          client_id: string;
          created_by: string | null;
          title: string;
          description: string | null;
          goals: string | null;
          interventions: string | null;
          start_date: string;
          end_date: string | null;
          review_date: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          created_by?: string | null;
          title: string;
          description?: string | null;
          goals?: string | null;
          interventions?: string | null;
          start_date: string;
          end_date?: string | null;
          review_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          created_by?: string | null;
          title?: string;
          description?: string | null;
          goals?: string | null;
          interventions?: string | null;
          start_date?: string;
          end_date?: string | null;
          review_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      assessments: {
        Row: {
          id: string;
          client_id: string;
          conducted_by: string | null;
          assessment_type: AssessmentType;
          title: string;
          description: string | null;
          findings: string | null;
          recommendations: string | null;
          score: number | null;
          assessment_date: string;
          next_review_date: string | null;
          is_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          conducted_by?: string | null;
          assessment_type: AssessmentType;
          title: string;
          description?: string | null;
          findings?: string | null;
          recommendations?: string | null;
          score?: number | null;
          assessment_date: string;
          next_review_date?: string | null;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          conducted_by?: string | null;
          assessment_type?: AssessmentType;
          title?: string;
          description?: string | null;
          findings?: string | null;
          recommendations?: string | null;
          score?: number | null;
          assessment_date?: string;
          next_review_date?: string | null;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      handovers: {
        Row: {
          id: string;
          care_home_id: string;
          shift_date: string;
          shift_type: ShiftType;
          handover_from: string | null;
          handover_to: string | null;
          general_notes: string | null;
          key_points: string | null;
          follow_up_actions: string | null;
          is_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          care_home_id: string;
          shift_date: string;
          shift_type: ShiftType;
          handover_from?: string | null;
          handover_to?: string | null;
          general_notes?: string | null;
          key_points?: string | null;
          follow_up_actions?: string | null;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          care_home_id?: string;
          shift_date?: string;
          shift_type?: ShiftType;
          handover_from?: string | null;
          handover_to?: string | null;
          general_notes?: string | null;
          key_points?: string | null;
          follow_up_actions?: string | null;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      handover_items: {
        Row: {
          id: string;
          handover_id: string;
          client_id: string;
          notes: string | null;
          priority: Priority | null;
          action_required: boolean;
          action_description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          handover_id: string;
          client_id: string;
          notes?: string | null;
          priority?: Priority | null;
          action_required?: boolean;
          action_description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          handover_id?: string;
          client_id?: string;
          notes?: string | null;
          priority?: Priority | null;
          action_required?: boolean;
          action_description?: string | null;
          created_at?: string;
        };
      };
      incidents: {
        Row: {
          id: string;
          care_home_id: string;
          client_id: string;
          reported_by: string | null;
          incident_type: string;
          severity: IncidentSeverity;
          status: IncidentStatus;
          title: string;
          description: string;
          location: string | null;
          incident_date: string;
          injuries_sustained: string | null;
          witnesses: string | null;
          immediate_action_taken: string | null;
          investigation_notes: string | null;
          preventive_measures: string | null;
          follow_up_required: boolean;
          follow_up_notes: string | null;
          resolved_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          care_home_id: string;
          client_id: string;
          reported_by?: string | null;
          incident_type: string;
          severity: IncidentSeverity;
          status?: IncidentStatus;
          title: string;
          description: string;
          location?: string | null;
          incident_date: string;
          injuries_sustained?: string | null;
          witnesses?: string | null;
          immediate_action_taken?: string | null;
          investigation_notes?: string | null;
          preventive_measures?: string | null;
          follow_up_required?: boolean;
          follow_up_notes?: string | null;
          resolved_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          care_home_id?: string;
          client_id?: string;
          reported_by?: string | null;
          incident_type?: string;
          severity?: IncidentSeverity;
          status?: IncidentStatus;
          title?: string;
          description?: string;
          location?: string | null;
          incident_date?: string;
          injuries_sustained?: string | null;
          witnesses?: string | null;
          immediate_action_taken?: string | null;
          investigation_notes?: string | null;
          preventive_measures?: string | null;
          follow_up_required?: boolean;
          follow_up_notes?: string | null;
          resolved_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      manager_care_homes: {
        Row: {
          id: string;
          manager_id: string;
          care_home_id: string;
          assigned_at: string;
          assigned_by: string | null;
        };
        Insert: {
          id?: string;
          manager_id: string;
          care_home_id: string;
          assigned_at?: string;
          assigned_by?: string | null;
        };
        Update: {
          id?: string;
          manager_id?: string;
          care_home_id?: string;
          assigned_at?: string;
          assigned_by?: string | null;
        };
      };
      user_care_homes: {
        Row: {
          user_id: string;
          care_home_id: string;
          assigned_at: string;
        };
        Insert: {
          user_id: string;
          care_home_id: string;
          assigned_at?: string;
        };
        Update: {
          user_id?: string;
          care_home_id?: string;
          assigned_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_role: {
        Args: {
          user_id: string;
        };
        Returns: UserRole;
      };
      user_has_care_home_access: {
        Args: {
          user_id: string;
          home_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      care_home_type: CareHomeType;
      assessment_type: AssessmentType;
      incident_severity: IncidentSeverity;
      incident_status: IncidentStatus;
    };
  };
}