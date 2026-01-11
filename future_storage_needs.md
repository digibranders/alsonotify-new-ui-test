# Future Storage Requirements Analysis

**Date:** 2026-01-11
**Objective:** Map application features to future S3 storage needs.

## Executive Summary

The application requires S3 storage for three primary categories: **User Identity Assets**, **Business Documents**, and **Collaboration Attachments**.

## Detailed Storage Mapping

| Feature Area         | Asset Type         | File Formats         | Est. Size / File | Future S3 Path Structure (Proposal)                         |
| :------------------- | :----------------- | :------------------- | :--------------- | :---------------------------------------------------------- |
| **User Profile**     | Profile Pictures   | JPG, PNG, WEBP       | < 2MB            | `s3://bucket/users/{userId}/avatar/`                        |
| **Employees**        | ID Proofs          | PDF, JPG             | < 5MB            | `s3://bucket/employees/{empId}/documents/id-proof/`         |
| **Employees**        | Resumes / CVs      | PDF, DOCX            | < 5MB            | `s3://bucket/employees/{empId}/documents/resume/`           |
| **Employees**        | Contracts          | PDF                  | < 10MB           | `s3://bucket/employees/{empId}/documents/contract/`         |
| **Company Settings** | Company Logo \*    | JPG, PNG, SVG        | < 2MB            | `s3://bucket/companies/{companyId}/branding/logo/`          |
| **Tasks**            | Attachments (Chat) | Images, PDFs, Zips   | < 50MB           | `s3://bucket/workspaces/{wsId}/tasks/{taskId}/attachments/` |
| **Requirements**     | Spec Documents     | PDF, DOCX, XLSX, ZIP | < 20MB           | `s3://bucket/workspaces/{wsId}/requirements/{reqId}/docs/`  |
| **Invoices**         | Generated Invoices | PDF                  | < 1MB            | `s3://bucket/companies/{companyId}/finance/invoices/`       |

_\* Note: Company Logo upload is currently not implemented in the UI but is a standard requirement for white-labeling._

## Technical Requirements for Uploads

1.  **Presigned URLs**: Backend should generate short-lived S3 presigned URLs for secure uploads directly from the frontend.
2.  **File Type Validation**:
    -   **Images**: `image/jpeg`, `image/png`, `image/webp`
    -   **Docs**: `application/pdf`, `docx`, `xlsx`, `text/csv`, `application/zip`
3.  **Size Limits**:
    -   **Avatars/Logos**: Max 5MB (Strict resize recommended)
    -   **Documents**: Max 20MB
    -   **Attachments**: Max 100MB

## Integration Points (Codebase)

-   **`ProfilePage.tsx`**: Replace current `Image` component and mock `handleDocumentUpload` with real S3 upload logic.
-   **`SettingsPage.tsx`**: Add "Company Logo" upload section (currently missing).
-   **`TaskDetailsPage.tsx`**: Wire up the `attachments` state in chat to S3 upload.
-   **`RequirementDetailsPage.tsx`**: Wire up Activity/Chat attachments.
-   **`RequirementsForm.tsx`**: activate the "Upload Documents" dropzone.
-   **`DocumentCard.tsx`**: Ensure the "Preview" and "Download" buttons work with private S3 URLs (may need signed GET URLs).
