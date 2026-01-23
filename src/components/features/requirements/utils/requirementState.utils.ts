import { Requirement } from "@/types/domain";

export interface RequirementActionState {
  isPending: boolean;
  displayStatus: string;
  actionButton?: 'Approve' | 'Reject' | 'Revise' | 'Edit' | 'Map' | 'Submit';
  actionButtonLabel?: string;
  isSender: boolean;
  isReceiver: boolean;
}

export type RequirementTab = 'draft' | 'pending' | 'active' | 'completed' | 'delayed' | 'archived';

/**
 * STRICT Logic for determining which tab a requirement belongs to.
 * This ensures consistency between the RequirementsPage filters and the individual card logic.
 */
export const getRequirementTab = (req: Requirement): RequirementTab => {
  // 1. Archived
  if (req.rawStatus === 'Archived' || req.rawStatus === 'archived') {
    return 'archived';
  }

  // 2. Delayed
  if (req.status === 'delayed' || req.rawStatus === 'Delayed' || req.rawStatus === 'On_Hold') {
    return 'delayed';
  }

  // 3. Draft
  if (req.rawStatus === 'draft') {
    return 'draft';
  }

  // 4. Completed (Strict)
  if (req.rawStatus === 'Completed') {
    return 'completed';
  }

  // 5. Pending vs Active
  // This is the core logic change requested.
  // Pending = Waiting for Action (Quote, Review, or Mapping)
  // Active = Work in Progress (Assigned + Mapped, or In_Progress)

  if (req.type === 'outsourced') {
    // For outsourced requirements, explicit state checks
    const { isSender, isReceiver } = req;

    // WAITING FOR QUOTE (Waiting) or QUOTE SUBMITTED (Submitted) or WORK REVIEW (Review)
    // If waiting for quote or review, it is Pending for both (Sender waiting, Receiver needs to act, or vice versa)
    if (req.rawStatus === 'Waiting' || req.rawStatus === 'Submitted' || req.rawStatus === 'Review') {
      return 'pending';
    }

    // WAITING FOR MAPPING (ASSIGNED but not Mapped)
    if (req.rawStatus === 'Assigned' && !req.receiver_workspace_id) {
       return 'pending';
    }

    // REJECTED (Needs Edit/Resend or Revise)
    if (req.rawStatus === 'Rejected') {
      return 'pending';
    }

    // If we passed all above, it's likely Active (Assigned + Mapped, or In_Progress)
    if (req.rawStatus === 'Assigned' || req.rawStatus === 'In_Progress' || req.rawStatus === 'Impediment' || req.rawStatus === 'Stuck' || req.rawStatus === 'Revision') {
       return 'active';
    }
  } else {
    // In-house / Client Logic
    if (req.approvalStatus === 'pending') {
      return 'pending';
    }
    if (req.rawStatus === 'Assigned' || req.rawStatus === 'In_Progress' || req.rawStatus === 'Submitted' || req.rawStatus === 'Revision' || req.rawStatus === 'Impediment' || req.rawStatus === 'Stuck') {
      return 'active';
    }
  }

  // Fallback
  return 'active';
};


/**
 * Logic to determine the display state and available actions for a Requirement Card.
 * Decouples complex business logic from the UI component.
 */
export const getRequirementActionState = (req: Requirement, currentUserId?: number): RequirementActionState => {
  const isSender = !!req.isSender;
  const isReceiver = !!req.isReceiver;
  const rawStatus = req.rawStatus;

  let isPending = false;
  let displayStatus: string = req.status || ''; // Default fallback, explicitly typed as string
  let actionButton: RequirementActionState['actionButton'] = undefined;
  let actionButtonLabel: string | undefined = undefined;

  // Outsourced Logic
  if (req.type === 'outsourced') {
    
    // --- RECEIVER (Partner) View ---
    if (isReceiver) {
      if (rawStatus === 'Waiting') {
        isPending = true;
        displayStatus = 'Action Needed: Submit Quote';
        actionButton = 'Submit';
        actionButtonLabel = 'Submit Quote';
      }
      else if (rawStatus === 'Submitted') {
         isPending = true; // Passive wait
         displayStatus = 'Quote Submitted. Pending Acceptance...';
         // Can retract? allowed: [Submitted]: [Waiting]
         // actionButton = 'Retract'; // Optional feature
      }
      else if (rawStatus === 'Assigned') {
         if (!req.receiver_workspace_id) {
            isPending = true;
            displayStatus = 'Action Needed: Map Workspace';
            actionButton = 'Map';
            actionButtonLabel = 'Map Workspace';
         } else {
            // Active
            isPending = false;
            displayStatus = 'Assigned';
         }
      }
      else if (rawStatus === 'Review') {
         isPending = true;
         displayStatus = 'Work Submitted. Pending Review...';
      }
      else if (rawStatus === 'Rejected') {
        const isReceiverRejection = Number(req.updated_user) === Number(currentUserId);

        if (isReceiverRejection) {
          // I rejected the requirement
          isPending = true;
          displayStatus = 'Requirement Rejected. Awaiting Revision...';
          // No action button for rejector
        } else {
          // Sender rejected my quote
          isPending = true;
          displayStatus = 'Quote Rejected';
          actionButton = 'Revise';
          actionButtonLabel = 'Revise Quote';
        }
      }
      else if (rawStatus === 'Revision') {
         // Work Rejected
         isPending = true; // Or active? Usually active work. But pending correction.
         // Let's call it active in tab logic? 
         // Active tab logic includes Revision. So here isPending false?
         // Using isPending=false allows Progress bar.
         isPending = false; 
         displayStatus = 'Revision Requested';
      }
    } 
    
    // --- SENDER (Creator) View ---
    else if (isSender) {
       if (rawStatus === 'Waiting') {
         isPending = true; // Passive wait
         displayStatus = 'Awaiting Quote...';
       }
       else if (rawStatus === 'Submitted') {
         isPending = true;
         displayStatus = 'Quote Received.';
         actionButton = 'Approve'; // or Reject
         actionButtonLabel = 'Accept Quote';
       }
       else if (rawStatus === 'Rejected') {
         // Determine rejection source
         const isSenderRejection = Number(req.updated_user) === Number(currentUserId);

         if (isSenderRejection) {
            // I rejected the quote
            isPending = true;
            displayStatus = 'Quote Rejected. Awaiting Revision...';
            // No action button for rejector
         } else {
            // Receiver rejected my requirement
            isPending = true;
            displayStatus = 'Requirement Rejected';
            actionButton = 'Edit';
            actionButtonLabel = 'Edit & Resend';
         }
       }
       else if (rawStatus === 'Assigned' && !req.receiver_workspace_id) {
          isPending = true;
          displayStatus = 'Waiting for Partner to Map Workspace...';
       }
       else if (rawStatus === 'Review') {
          // Work Review
          isPending = true;
          displayStatus = 'Work Completed. Review Needed.';
          actionButton = 'Approve'; 
          actionButtonLabel = 'Approve Work';
       }
    }

  } else {
    // In-house / Client Logic
    if (req.approvalStatus === 'pending') {
      isPending = true;
      displayStatus = 'Waiting for Approval';
    }
  }

  return {
    isPending,
    displayStatus,
    actionButton,
    actionButtonLabel,
    isSender,
    isReceiver
  };
};
