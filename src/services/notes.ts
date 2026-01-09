
import axiosApi from "../config/axios";
import { ApiResponse } from "../types/api";
import { NoteDto, ChecklistItemDto, CreateNoteDto, UpdateNoteDto, NoteTypeDto } from "../types/dto/note.dto";
import { ApiError, NetworkError, getErrorMessage, isAxiosError } from "../types/errors";

// Re-export types for backward compatibility (mapped to DTOs)
export type { NoteDto as Note, CreateNoteDto as NoteCreate, UpdateNoteDto as NoteUpdate, NoteTypeDto as NoteType, ChecklistItemDto as ChecklistItem };

/**
 * Default pagination limits
 */
const DEFAULT_SKIP = 0;
const DEFAULT_LIMIT = 100;

/**
 * Validate note ID
 */
function validateNoteId(id: number): void {
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(`Invalid note ID: ${id}`, 400);
  }
}

/**
 * Validate pagination parameters
 */
function validatePagination(skip: number, limit: number): void {
  if (!Number.isInteger(skip) || skip < 0) {
    throw new ApiError(`Invalid skip parameter: ${skip}`, 400);
  }
  if (!Number.isInteger(limit) || limit <= 0 || limit > 1000) {
    throw new ApiError(`Invalid limit parameter: ${limit}. Must be between 1 and 1000`, 400);
  }
}

/**
 * Get notes with pagination and archive filter
 */
export const getNotes = async (
  skip: number = DEFAULT_SKIP,
  limit: number = DEFAULT_LIMIT,
  archived: boolean = false
): Promise<ApiResponse<NoteDto[]>> => {
  try {
    validatePagination(skip, limit);
    
    const { data } = await axiosApi.get<ApiResponse<NoteDto[]>>(
      `/notes/?skip=${skip}&limit=${limit}&archived=${archived}`
    );
    
    if (!data || typeof data !== 'object') {
      throw new ApiError('Invalid response format from server', 500);
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const message = getErrorMessage(error);
      throw new ApiError(message, statusCode, error.response?.data);
    }
    
    throw new NetworkError(getErrorMessage(error));
  }
};

/**
 * Create a new note
 */
export const createNote = async (params: CreateNoteDto): Promise<ApiResponse<NoteDto>> => {
  try {
    if (!params.title || params.title.trim().length === 0) {
      throw new ApiError('Note title is required', 400);
    }
    
    if (!params.type || (params.type !== 'TEXT_NOTE' && params.type !== 'CHECKLIST_NOTE')) {
      throw new ApiError('Invalid note type', 400);
    }
    
    const { data } = await axiosApi.post<ApiResponse<NoteDto>>('/notes/', params);
    
    if (!data || typeof data !== 'object') {
      throw new ApiError('Invalid response format from server', 500);
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const message = getErrorMessage(error);
      throw new ApiError(message, statusCode, error.response?.data);
    }
    
    throw new NetworkError(getErrorMessage(error));
  }
};

/**
 * Update an existing note
 */
export const updateNote = async (id: number, params: UpdateNoteDto): Promise<ApiResponse<NoteDto>> => {
  try {
    validateNoteId(id);
    
    const { data } = await axiosApi.put<ApiResponse<NoteDto>>(`/notes/${id}`, params);
    
    if (!data || typeof data !== 'object') {
      throw new ApiError('Invalid response format from server', 500);
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const message = getErrorMessage(error);
      throw new ApiError(message, statusCode, error.response?.data);
    }
    
    throw new NetworkError(getErrorMessage(error));
  }
};

/**
 * Delete a note permanently
 */
export const deleteNote = async (id: number): Promise<ApiResponse<NoteDto>> => {
  try {
    validateNoteId(id);
    
    const { data } = await axiosApi.delete<ApiResponse<NoteDto>>(`/notes/${id}`);
    
    if (!data || typeof data !== 'object') {
      throw new ApiError('Invalid response format from server', 500);
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const message = getErrorMessage(error);
      throw new ApiError(message, statusCode, error.response?.data);
    }
    
    throw new NetworkError(getErrorMessage(error));
  }
};

/**
 * Archive a note
 */
export const archiveNote = async (id: number): Promise<ApiResponse<NoteDto>> => {
  try {
    validateNoteId(id);
    
    const { data } = await axiosApi.put<ApiResponse<NoteDto>>(`/notes/${id}`, { is_archived: true });
    
    if (!data || typeof data !== 'object') {
      throw new ApiError('Invalid response format from server', 500);
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const message = getErrorMessage(error);
      throw new ApiError(message, statusCode, error.response?.data);
    }
    
    throw new NetworkError(getErrorMessage(error));
  }
};

/**
 * Unarchive a note
 */
export const unarchiveNote = async (id: number): Promise<ApiResponse<NoteDto>> => {
  try {
    validateNoteId(id);
    
    const { data } = await axiosApi.put<ApiResponse<NoteDto>>(`/notes/${id}`, { is_archived: false });
    
    if (!data || typeof data !== 'object') {
      throw new ApiError('Invalid response format from server', 500);
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const message = getErrorMessage(error);
      throw new ApiError(message, statusCode, error.response?.data);
    }
    
    throw new NetworkError(getErrorMessage(error));
  }
};
