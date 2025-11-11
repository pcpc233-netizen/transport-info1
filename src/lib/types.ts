export interface Database {
  public: {
    Tables: {
      service_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string;
          description: string | null;
          meta_title: string | null;
          meta_description: string | null;
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['service_categories']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['service_categories']['Insert']>;
      };
      locations: {
        Row: {
          id: string;
          name: string;
          parent_id: string | null;
          level: 'city' | 'district' | 'neighborhood';
          latitude: number | null;
          longitude: number | null;
          created_at: string;
        };
      };
      services: {
        Row: {
          id: string;
          category_id: string;
          location_id: string | null;
          name: string;
          service_number: string | null;
          slug: string;
          description: string | null;
          operating_hours: string | null;
          contact_info: any;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          meta_title: string | null;
          meta_description: string | null;
          view_count: number;
          bookmark_count: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          seo_keywords: string[] | null;
          long_description: string | null;
          usage_tips: string | null;
          best_time: string | null;
          average_duration: string | null;
          difficulty_level: 'easy' | 'medium' | 'hard' | null;
          phone: string | null;
          website_url: string | null;
          reservation_url: string | null;
          map_url: string | null;
          thumbnail_url: string | null;
          featured_image: string | null;
          seo_title: string | null;
          seo_description: string | null;
        };
      };
      service_faqs: {
        Row: {
          id: string;
          service_id: string;
          question: string;
          answer: string;
          order_index: number;
          created_at: string;
        };
      };
      service_requirements: {
        Row: {
          id: string;
          service_id: string;
          requirement_type: 'document' | 'fee' | 'time' | 'preparation' | 'other';
          title: string;
          description: string | null;
          details: any;
          order_index: number;
          created_at: string;
        };
      };
      service_guides: {
        Row: {
          id: string;
          service_id: string;
          step_number: number;
          title: string;
          description: string;
          image_url: string | null;
          tips: string | null;
          created_at: string;
        };
      };
      service_fees: {
        Row: {
          id: string;
          service_id: string;
          fee_type: 'regular' | 'express' | 'discount' | 'special';
          name: string;
          amount: number;
          description: string | null;
          conditions: string | null;
          created_at: string;
        };
      };
      service_regulations: {
        Row: {
          id: string;
          service_id: string;
          regulation_type: 'law' | 'policy' | 'notice' | 'warning';
          title: string;
          content: string;
          source_url: string | null;
          effective_date: string | null;
          created_at: string;
        };
      };
      service_related: {
        Row: {
          id: string;
          service_id: string;
          related_service_id: string;
          relation_type: 'alternative' | 'nearby' | 'similar' | 'recommended';
          description: string | null;
          created_at: string;
        };
      };
      schedules: {
        Row: {
          id: string;
          service_id: string;
          day_of_week: string;
          departure_time: string | null;
          arrival_time: string | null;
          route_info: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
        };
      };
      community_posts: {
        Row: {
          id: string;
          service_id: string;
          category_id: string | null;
          author_name: string;
          title: string;
          content: string;
          post_type: 'tip' | 'question' | 'review' | 'update';
          upvote_count: number;
          view_count: number;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['community_posts']['Row'], 'id' | 'created_at' | 'updated_at' | 'upvote_count' | 'view_count' | 'is_verified'>;
      };
      comments: {
        Row: {
          id: string;
          post_id: string | null;
          service_id: string | null;
          author_name: string;
          content: string;
          upvote_count: number;
          parent_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['comments']['Row'], 'id' | 'created_at' | 'upvote_count'>;
      };
      bookmarks: {
        Row: {
          id: string;
          session_id: string;
          service_id: string;
          created_at: string;
        };
      };
    };
  };
}

export type ServiceCategory = Database['public']['Tables']['service_categories']['Row'];
export type Service = Database['public']['Tables']['services']['Row'];
export type Schedule = Database['public']['Tables']['schedules']['Row'];
export type CommunityPost = Database['public']['Tables']['community_posts']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type ServiceFAQ = Database['public']['Tables']['service_faqs']['Row'];
export type ServiceRequirement = Database['public']['Tables']['service_requirements']['Row'];
export type ServiceGuide = Database['public']['Tables']['service_guides']['Row'];
export type ServiceFee = Database['public']['Tables']['service_fees']['Row'];
export type ServiceRegulation = Database['public']['Tables']['service_regulations']['Row'];
export type ServiceRelated = Database['public']['Tables']['service_related']['Row'];
