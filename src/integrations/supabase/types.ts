export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      AuditLog: {
        Row: {
          action: Database["public"]["Enums"]["AuditAction"]
          details: Json | null
          id: string
          ipAddress: string | null
          resource: Database["public"]["Enums"]["ResourceType"]
          status: Database["public"]["Enums"]["AuditStatus"]
          timestamp: string
          userId: string
        }
        Insert: {
          action: Database["public"]["Enums"]["AuditAction"]
          details?: Json | null
          id?: string
          ipAddress?: string | null
          resource: Database["public"]["Enums"]["ResourceType"]
          status?: Database["public"]["Enums"]["AuditStatus"]
          timestamp?: string
          userId: string
        }
        Update: {
          action?: Database["public"]["Enums"]["AuditAction"]
          details?: Json | null
          id?: string
          ipAddress?: string | null
          resource?: Database["public"]["Enums"]["ResourceType"]
          status?: Database["public"]["Enums"]["AuditStatus"]
          timestamp?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "AuditLog_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Category: {
        Row: {
          createdAt: string
          description: string | null
          id: string
          name: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          description?: string | null
          id?: string
          name: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          description?: string | null
          id?: string
          name?: string
          updatedAt?: string
        }
        Relationships: []
      }
      Client: {
        Row: {
          accountManagerId: string | null
          billingContactId: string | null
          companyName: string
          createdAt: string
          id: string
          industry: string | null
          notes: string | null
          serviceEndDate: string | null
          serviceStartDate: string | null
          status: Database["public"]["Enums"]["ClientStatus"]
          updatedAt: string
          websiteUrl: string | null
        }
        Insert: {
          accountManagerId?: string | null
          billingContactId?: string | null
          companyName: string
          createdAt?: string
          id?: string
          industry?: string | null
          notes?: string | null
          serviceEndDate?: string | null
          serviceStartDate?: string | null
          status?: Database["public"]["Enums"]["ClientStatus"]
          updatedAt?: string
          websiteUrl?: string | null
        }
        Update: {
          accountManagerId?: string | null
          billingContactId?: string | null
          companyName?: string
          createdAt?: string
          id?: string
          industry?: string | null
          notes?: string | null
          serviceEndDate?: string | null
          serviceStartDate?: string | null
          status?: Database["public"]["Enums"]["ClientStatus"]
          updatedAt?: string
          websiteUrl?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Client_accountManagerId_fkey"
            columns: ["accountManagerId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Client_billingContactId_fkey"
            columns: ["billingContactId"]
            isOneToOne: false
            referencedRelation: "Contact"
            referencedColumns: ["id"]
          },
        ]
      }
      ClientService: {
        Row: {
          clientId: string
          createdAt: string
          endDate: string | null
          id: string
          price: number | null
          serviceId: string
          startDate: string
          status: string
          updatedAt: string
        }
        Insert: {
          clientId: string
          createdAt?: string
          endDate?: string | null
          id?: string
          price?: number | null
          serviceId: string
          startDate?: string
          status?: string
          updatedAt?: string
        }
        Update: {
          clientId?: string
          createdAt?: string
          endDate?: string | null
          id?: string
          price?: number | null
          serviceId?: string
          startDate?: string
          status?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "ClientService_clientid_fkey"
            columns: ["clientId"]
            isOneToOne: false
            referencedRelation: "Client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ClientService_serviceid_fkey"
            columns: ["serviceId"]
            isOneToOne: false
            referencedRelation: "Service"
            referencedColumns: ["id"]
          },
        ]
      }
      ClientService_backup: {
        Row: {
          clientid: string | null
          createdat: string | null
          enddate: string | null
          id: string | null
          price: number | null
          serviceid: string | null
          startdate: string | null
          status: string | null
          updatedat: string | null
        }
        Insert: {
          clientid?: string | null
          createdat?: string | null
          enddate?: string | null
          id?: string | null
          price?: number | null
          serviceid?: string | null
          startdate?: string | null
          status?: string | null
          updatedat?: string | null
        }
        Update: {
          clientid?: string | null
          createdat?: string | null
          enddate?: string | null
          id?: string | null
          price?: number | null
          serviceid?: string | null
          startdate?: string | null
          status?: string | null
          updatedat?: string | null
        }
        Relationships: []
      }
      Contact: {
        Row: {
          clientId: string
          contactType: Database["public"]["Enums"]["ContactType"] | null
          createdAt: string
          email: string
          firstName: string
          id: string
          isPrimary: boolean
          lastName: string
          phone: string | null
          preferredContactMethod:
            | Database["public"]["Enums"]["ContactMethod"]
            | null
          role: string | null
          status: Database["public"]["Enums"]["ContactStatus"]
          updatedAt: string
        }
        Insert: {
          clientId: string
          contactType?: Database["public"]["Enums"]["ContactType"] | null
          createdAt?: string
          email: string
          firstName: string
          id?: string
          isPrimary?: boolean
          lastName: string
          phone?: string | null
          preferredContactMethod?:
            | Database["public"]["Enums"]["ContactMethod"]
            | null
          role?: string | null
          status?: Database["public"]["Enums"]["ContactStatus"]
          updatedAt?: string
        }
        Update: {
          clientId?: string
          contactType?: Database["public"]["Enums"]["ContactType"] | null
          createdAt?: string
          email?: string
          firstName?: string
          id?: string
          isPrimary?: boolean
          lastName?: string
          phone?: string | null
          preferredContactMethod?:
            | Database["public"]["Enums"]["ContactMethod"]
            | null
          role?: string | null
          status?: Database["public"]["Enums"]["ContactStatus"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Contact_clientId_fkey"
            columns: ["clientId"]
            isOneToOne: false
            referencedRelation: "Client"
            referencedColumns: ["id"]
          },
        ]
      }
      Content: {
        Row: {
          authorId: string
          body: string
          contentType: Database["public"]["Enums"]["ContentType"] | null
          createdAt: string
          id: string
          publishedAt: string | null
          status: Database["public"]["Enums"]["ContentStatus"]
          tags: string[] | null
          title: string
          updatedAt: string
        }
        Insert: {
          authorId: string
          body: string
          contentType?: Database["public"]["Enums"]["ContentType"] | null
          createdAt?: string
          id?: string
          publishedAt?: string | null
          status?: Database["public"]["Enums"]["ContentStatus"]
          tags?: string[] | null
          title: string
          updatedAt?: string
        }
        Update: {
          authorId?: string
          body?: string
          contentType?: Database["public"]["Enums"]["ContentType"] | null
          createdAt?: string
          id?: string
          publishedAt?: string | null
          status?: Database["public"]["Enums"]["ContentStatus"]
          tags?: string[] | null
          title?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Content_authorId_fkey"
            columns: ["authorId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Invoice: {
        Row: {
          amount: number
          clientId: string
          createdAt: string
          dueDate: string
          id: string
          invoiceNumber: string | null
          lineItems: Json | null
          paidAt: string | null
          paymentMethod: Database["public"]["Enums"]["PaymentMethod"] | null
          status: Database["public"]["Enums"]["InvoiceStatus"]
          updatedAt: string
        }
        Insert: {
          amount: number
          clientId: string
          createdAt?: string
          dueDate: string
          id?: string
          invoiceNumber?: string | null
          lineItems?: Json | null
          paidAt?: string | null
          paymentMethod?: Database["public"]["Enums"]["PaymentMethod"] | null
          status?: Database["public"]["Enums"]["InvoiceStatus"]
          updatedAt?: string
        }
        Update: {
          amount?: number
          clientId?: string
          createdAt?: string
          dueDate?: string
          id?: string
          invoiceNumber?: string | null
          lineItems?: Json | null
          paidAt?: string | null
          paymentMethod?: Database["public"]["Enums"]["PaymentMethod"] | null
          status?: Database["public"]["Enums"]["InvoiceStatus"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Invoice_clientId_fkey"
            columns: ["clientId"]
            isOneToOne: false
            referencedRelation: "Client"
            referencedColumns: ["id"]
          },
        ]
      }
      Lead: {
        Row: {
          assignedToId: string | null
          convertedClientId: string | null
          createdAt: string
          email: string
          followUpDate: string | null
          id: string
          leadSource: Database["public"]["Enums"]["LeadSource"] | null
          name: string
          notes: Json | null
          phone: string | null
          status: Database["public"]["Enums"]["LeadStatus"]
          updatedAt: string
        }
        Insert: {
          assignedToId?: string | null
          convertedClientId?: string | null
          createdAt?: string
          email: string
          followUpDate?: string | null
          id?: string
          leadSource?: Database["public"]["Enums"]["LeadSource"] | null
          name: string
          notes?: Json | null
          phone?: string | null
          status?: Database["public"]["Enums"]["LeadStatus"]
          updatedAt?: string
        }
        Update: {
          assignedToId?: string | null
          convertedClientId?: string | null
          createdAt?: string
          email?: string
          followUpDate?: string | null
          id?: string
          leadSource?: Database["public"]["Enums"]["LeadSource"] | null
          name?: string
          notes?: Json | null
          phone?: string | null
          status?: Database["public"]["Enums"]["LeadStatus"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Lead_assignedToId_fkey"
            columns: ["assignedToId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Lead_convertedClientId_fkey"
            columns: ["convertedClientId"]
            isOneToOne: false
            referencedRelation: "Client"
            referencedColumns: ["id"]
          },
        ]
      }
      Package: {
        Row: {
          availability: Database["public"]["Enums"]["PackageAvailability"]
          createdAt: string
          customFields: Json | null
          description: string | null
          discount: number | null
          id: string
          monthlyPrice: number | null
          name: string
          price: number
          services: string[]
          updatedAt: string
        }
        Insert: {
          availability?: Database["public"]["Enums"]["PackageAvailability"]
          createdAt?: string
          customFields?: Json | null
          description?: string | null
          discount?: number | null
          id?: string
          monthlyPrice?: number | null
          name: string
          price: number
          services: string[]
          updatedAt?: string
        }
        Update: {
          availability?: Database["public"]["Enums"]["PackageAvailability"]
          createdAt?: string
          customFields?: Json | null
          description?: string | null
          discount?: number | null
          id?: string
          monthlyPrice?: number | null
          name?: string
          price?: number
          services?: string[]
          updatedAt?: string
        }
        Relationships: []
      }
      Service: {
        Row: {
          categoryId: string
          createdAt: string
          customFields: Json | null
          description: string | null
          features: string[]
          id: string
          monthlyPrice: number | null
          name: string
          price: number | null
          updatedAt: string
        }
        Insert: {
          categoryId: string
          createdAt?: string
          customFields?: Json | null
          description?: string | null
          features: string[]
          id?: string
          monthlyPrice?: number | null
          name: string
          price?: number | null
          updatedAt?: string
        }
        Update: {
          categoryId?: string
          createdAt?: string
          customFields?: Json | null
          description?: string | null
          features?: string[]
          id?: string
          monthlyPrice?: number | null
          name?: string
          price?: number | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Service_categoryId_fkey"
            columns: ["categoryId"]
            isOneToOne: false
            referencedRelation: "Category"
            referencedColumns: ["id"]
          },
        ]
      }
      ServiceTier: {
        Row: {
          availability: Database["public"]["Enums"]["TierAvailability"]
          createdAt: string
          description: string | null
          features: string[]
          id: string
          monthlyPrice: number | null
          name: string
          price: number
          serviceId: string
          updatedAt: string
        }
        Insert: {
          availability?: Database["public"]["Enums"]["TierAvailability"]
          createdAt?: string
          description?: string | null
          features: string[]
          id?: string
          monthlyPrice?: number | null
          name: string
          price: number
          serviceId: string
          updatedAt?: string
        }
        Update: {
          availability?: Database["public"]["Enums"]["TierAvailability"]
          createdAt?: string
          description?: string | null
          features?: string[]
          id?: string
          monthlyPrice?: number | null
          name?: string
          price?: number
          serviceId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "ServiceTier_serviceId_fkey"
            columns: ["serviceId"]
            isOneToOne: false
            referencedRelation: "Service"
            referencedColumns: ["id"]
          },
        ]
      }
      Session: {
        Row: {
          createdAt: string
          deviceInfo: Json | null
          expiresAt: string
          id: string
          ipAddress: string
          lastRefreshedAt: string | null
          refreshCount: number
          status: Database["public"]["Enums"]["SessionStatus"]
          token: string
          updatedAt: string
          userAgent: string
          userId: string
        }
        Insert: {
          createdAt?: string
          deviceInfo?: Json | null
          expiresAt: string
          id?: string
          ipAddress?: string
          lastRefreshedAt?: string | null
          refreshCount?: number
          status?: Database["public"]["Enums"]["SessionStatus"]
          token: string
          updatedAt?: string
          userAgent?: string
          userId: string
        }
        Update: {
          createdAt?: string
          deviceInfo?: Json | null
          expiresAt?: string
          id?: string
          ipAddress?: string
          lastRefreshedAt?: string | null
          refreshCount?: number
          status?: Database["public"]["Enums"]["SessionStatus"]
          token?: string
          updatedAt?: string
          userAgent?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Session_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Staff: {
        Row: {
          bio: string | null
          createdAt: string
          department: string | null
          hireDate: string | null
          id: string
          notes: string | null
          skills: string[] | null
          title: string | null
          updatedAt: string
          userId: string
        }
        Insert: {
          bio?: string | null
          createdAt?: string
          department?: string | null
          hireDate?: string | null
          id?: string
          notes?: string | null
          skills?: string[] | null
          title?: string | null
          updatedAt?: string
          userId: string
        }
        Update: {
          bio?: string | null
          createdAt?: string
          department?: string | null
          hireDate?: string | null
          id?: string
          notes?: string | null
          skills?: string[] | null
          title?: string | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Staff_userId_fkey"
            columns: ["userId"]
            isOneToOne: true
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      StateTransfer: {
        Row: {
          accessCount: number
          createdAt: string
          data: Json
          expiresAt: string
          id: string
          purpose: string
          status: Database["public"]["Enums"]["StateStatus"]
          userId: string | null
        }
        Insert: {
          accessCount?: number
          createdAt?: string
          data: Json
          expiresAt: string
          id?: string
          purpose: string
          status?: Database["public"]["Enums"]["StateStatus"]
          userId?: string | null
        }
        Update: {
          accessCount?: number
          createdAt?: string
          data?: Json
          expiresAt?: string
          id?: string
          purpose?: string
          status?: Database["public"]["Enums"]["StateStatus"]
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "StateTransfer_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      SupportTicket: {
        Row: {
          category: Database["public"]["Enums"]["TicketCategory"] | null
          clientId: string
          comments: Json | null
          createdAt: string
          description: string | null
          id: string
          priority: Database["public"]["Enums"]["TicketPriority"]
          resolvedAt: string | null
          staffId: string | null
          status: Database["public"]["Enums"]["TicketStatus"]
          title: string
          updatedAt: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["TicketCategory"] | null
          clientId: string
          comments?: Json | null
          createdAt?: string
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["TicketPriority"]
          resolvedAt?: string | null
          staffId?: string | null
          status?: Database["public"]["Enums"]["TicketStatus"]
          title: string
          updatedAt?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["TicketCategory"] | null
          clientId?: string
          comments?: Json | null
          createdAt?: string
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["TicketPriority"]
          resolvedAt?: string | null
          staffId?: string | null
          status?: Database["public"]["Enums"]["TicketStatus"]
          title?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "SupportTicket_clientId_fkey"
            columns: ["clientId"]
            isOneToOne: false
            referencedRelation: "Client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "SupportTicket_staffId_fkey"
            columns: ["staffId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Task: {
        Row: {
          createdAt: string
          description: string | null
          dueDate: string | null
          id: string
          progress: number
          status: string
          title: string
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          description?: string | null
          dueDate?: string | null
          id?: string
          progress?: number
          status?: string
          title: string
          updatedAt?: string
          userId: string
        }
        Update: {
          createdAt?: string
          description?: string | null
          dueDate?: string | null
          id?: string
          progress?: number
          status?: string
          title?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: []
      }
      Token: {
        Row: {
          createdAt: string
          expiresAt: string
          id: string
          lastUsedAt: string | null
          revokedAt: string | null
          securityVersion: number
          token: string
          type: Database["public"]["Enums"]["TokenType"]
          used: boolean
          userId: string
        }
        Insert: {
          createdAt?: string
          expiresAt: string
          id?: string
          lastUsedAt?: string | null
          revokedAt?: string | null
          securityVersion: number
          token: string
          type: Database["public"]["Enums"]["TokenType"]
          used?: boolean
          userId: string
        }
        Update: {
          createdAt?: string
          expiresAt?: string
          id?: string
          lastUsedAt?: string | null
          revokedAt?: string | null
          securityVersion?: number
          token?: string
          type?: Database["public"]["Enums"]["TokenType"]
          used?: boolean
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Token_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          clientId: string | null
          createdAt: string
          email: string
          emailVerified: boolean
          firstName: string | null
          id: string
          lastName: string | null
          passwordHash: string | null
          phoneNumber: string | null
          role: Database["public"]["Enums"]["UserRole"]
          securityVersion: number
          status: Database["public"]["Enums"]["UserStatus"]
          updatedAt: string
        }
        Insert: {
          clientId?: string | null
          createdAt?: string
          email: string
          emailVerified?: boolean
          firstName?: string | null
          id: string
          lastName?: string | null
          passwordHash?: string | null
          phoneNumber?: string | null
          role?: Database["public"]["Enums"]["UserRole"]
          securityVersion?: number
          status?: Database["public"]["Enums"]["UserStatus"]
          updatedAt?: string
        }
        Update: {
          clientId?: string | null
          createdAt?: string
          email?: string
          emailVerified?: boolean
          firstName?: string | null
          id?: string
          lastName?: string | null
          passwordHash?: string | null
          phoneNumber?: string | null
          role?: Database["public"]["Enums"]["UserRole"]
          securityVersion?: number
          status?: Database["public"]["Enums"]["UserStatus"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "User_clientId_fkey"
            columns: ["clientId"]
            isOneToOne: false
            referencedRelation: "Client"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      AuditAction:
        | "LOGIN"
        | "LOGOUT"
        | "REGISTER"
        | "PASSWORD_RESET"
        | "PASSWORD_CHANGE"
        | "PROFILE_UPDATE"
        | "CREATE"
        | "READ"
        | "UPDATE"
        | "DELETE"
        | "EXPORT"
        | "IMPORT"
      AuditStatus: "SUCCESS" | "FAILED"
      ClientStatus: "ACTIVE" | "INACTIVE" | "PAST"
      ContactMethod: "EMAIL" | "PHONE"
      ContactStatus: "ACTIVE" | "INACTIVE"
      ContactType: "PRIMARY" | "BILLING" | "TECHNICAL" | "SUPPORT"
      ContentStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED"
      ContentType: "BLOG_POST" | "RESOURCE" | "FAQ" | "NEWS"
      InvoiceStatus: "PENDING" | "PAID" | "OVERDUE" | "CANCELED"
      LeadSource: "WEBSITE" | "REFERRAL" | "ADVERTISEMENT" | "EVENT" | "OTHER"
      LeadStatus: "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST"
      PackageAvailability: "ACTIVE" | "DISCONTINUED" | "COMING_SOON"
      PaymentMethod: "CREDIT_CARD" | "BANK_TRANSFER" | "PAYPAL"
      ResourceType:
        | "USER"
        | "CLIENT"
        | "STAFF"
        | "SERVICE"
        | "SERVICE_TIER"
        | "PACKAGE"
        | "SESSION"
        | "STATE_TRANSFER"
        | "CONTACT"
      ServiceStatus: "ACTIVE" | "PENDING" | "EXPIRED" | "SUSPENDED"
      SessionStatus: "ACTIVE" | "EXPIRED"
      StateStatus: "ACTIVE" | "USED" | "EXPIRED"
      TicketCategory: "TECHNICAL" | "BILLING" | "GENERAL"
      TicketPriority: "LOW" | "MEDIUM" | "HIGH"
      TicketStatus: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
      TierAvailability: "ACTIVE" | "DISCONTINUED" | "COMING_SOON"
      TokenType: "ACCESS" | "REFRESH" | "PASSWORD_RESET" | "EMAIL_VERIFICATION"
      UserRole: "ADMIN" | "STAFF" | "CLIENT" | "OBSERVER"
      UserStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
