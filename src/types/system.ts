// System types based on the Systems API Guide

export interface ResponsiblePerson {
  name?: string;
  email?: string;
  role?: string;
  department?: string;
  phone?: string;
}

export type SystemStatus = 'active' | 'inactive';

export interface System {
  id: number;
  system_name: string;
  system_description?: string;
  status?: SystemStatus;
  responsible_person?: Record<string, boolean>; // Changed from responsible_person_ids array to object
  customers?: Record<string, boolean>; // Added customers field
  system_documentation?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSystemRequest {
  system_name: string;
  system_description?: string;
  status?: SystemStatus;
  responsible_person?: Record<string, boolean>; // Changed from responsible_person_ids array to object
  customers?: Record<string, boolean>; // Added customers field
  system_documentation?: string;
}

export interface UpdateSystemRequest {
  system_name?: string;
  system_description?: string;
  status?: SystemStatus;
  responsible_person?: Record<string, boolean>; // Changed from responsible_person_ids array to object
  customers?: Record<string, boolean>; // Added customers field
  system_documentation?: string;
}

export interface GetSystemsResponse {
  success: boolean;
  data: System[];
}

export interface GetSystemResponse {
  success: boolean;
  data: System;
}

export interface CreateSystemResponse {
  success: boolean;
  data: System;
}

export interface UpdateSystemResponse {
  success: boolean;
  data: System;
}

export interface DeleteSystemResponse {
  success: boolean;
  message: string;
}