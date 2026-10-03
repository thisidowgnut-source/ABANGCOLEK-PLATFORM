/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAccessToken } from './googleAuth';

export interface FormItemQuestion {
  questionId?: string;
  required?: boolean;
  choiceQuestion?: {
    type: 'RADIO' | 'CHECKBOX' | 'DROP_DOWN';
    options: Array<{ value: string; isOther?: boolean }>;
    shuffle?: boolean;
  };
  textQuestion?: {
    paragraph?: boolean;
  };
  scaleQuestion?: {
    low: number;
    high: number;
    lowLabel?: string;
    highLabel?: string;
  };
}

export interface GoogleFormItem {
  itemId?: string;
  title: string;
  description?: string;
  questionItem?: {
    question: FormItemQuestion;
  };
}

export interface GoogleFormInfo {
  title: string;
  documentTitle?: string;
  description?: string;
}

export interface GoogleForm {
  formId: string;
  info: GoogleFormInfo;
  settings?: any;
  items?: GoogleFormItem[];
  revisionId?: string;
  responderUri?: string;
  linkedSheetId?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface FormResponseAnswer {
  questionId: string;
  textAnswers?: {
    answers: Array<{ value: string }>;
  };
}

export interface FormSubmissionResponse {
  responseId: string;
  createTime: string;
  lastSubmittedTime: string;
  respondentEmail?: string;
  answers?: Record<string, FormResponseAnswer>;
}

export interface DriveFormFile {
  id: string;
  name: string;
  description?: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
  iconLink?: string;
}

// Default retail form templates to jumpstart users
export const RETAIL_FORM_TEMPLATES = [
  {
    id: 'csat_order',
    name: 'Order Satisfaction & Delivery (CSAT)',
    description: 'Post-purchase customer survey evaluating delivery speed, product condition, and overall satisfaction.',
    questions: [
      {
        title: 'How satisfied were you with the delivery speed?',
        type: 'choice',
        choiceType: 'RADIO' as const,
        options: ['1 - Very Slow', '2 - Slow', '3 - Acceptable', '4 - Fast', '5 - Extremely Fast'],
        required: true,
      },
      {
        title: 'Did the package arrive in good condition?',
        type: 'choice',
        choiceType: 'RADIO' as const,
        options: ['Yes, perfect condition', 'Slight packaging damage but product intact', 'Product was damaged'],
        required: true,
      },
      {
        title: 'How likely are you to recommend us to a colleague or friend? (NPS)',
        type: 'choice',
        choiceType: 'RADIO' as const,
        options: ['10 - Extremely Likely', '9', '8', '7', '6', '5 - Neutral', '4', '3', '2', '1 - Not at all'],
        required: true,
      },
      {
        title: 'What could we improve for your next order?',
        type: 'text',
        required: false,
      }
    ]
  },
  {
    id: 'return_refund',
    name: 'Product Return & Refund Request',
    description: 'Formal intake form for customers requesting order returns, exchanges, or refunds.',
    questions: [
      {
        title: 'Order ID (found in confirmation email)',
        type: 'text',
        required: true,
      },
      {
        title: 'Reason for return or refund request',
        type: 'choice',
        choiceType: 'RADIO' as const,
        options: [
          'Defective or damaged item',
          'Item does not match description',
          'Arrived later than expected',
          'Changed mind / no longer needed',
          'Wrong item sent'
        ],
        required: true,
      },
      {
        title: 'Preferred resolution',
        type: 'choice',
        choiceType: 'RADIO' as const,
        options: ['Full Refund to original payment', 'Store Credit with 10% bonus', 'Replacement item sent'],
        required: true,
      },
      {
        title: 'Detailed explanation of the problem',
        type: 'text',
        required: true,
      }
    ]
  },
  {
    id: 'product_review_survey',
    name: 'Product Quality & Usage Review',
    description: 'Collect detailed feedback regarding product durability, ease of use, and value for money.',
    questions: [
      {
        title: 'Product category purchased',
        type: 'choice',
        choiceType: 'RADIO' as const,
        options: ['Electronics & Gadgets', 'Home & Furniture', 'Fashion & Apparel', 'Health & Beauty', 'Sports & Outdoors'],
        required: true,
      },
      {
        title: 'Overall product quality rating',
        type: 'choice',
        choiceType: 'RADIO' as const,
        options: ['⭐⭐⭐⭐⭐ Excellent', '⭐⭐⭐⭐ Good', '⭐⭐⭐ Average', '⭐⭐ Below Average', '⭐ Poor'],
        required: true,
      },
      {
        title: 'Does the product meet your daily expectations?',
        type: 'choice',
        choiceType: 'RADIO' as const,
        options: ['Exceeds expectations', 'Meets expectations', 'Falls short of expectations'],
        required: true,
      },
      {
        title: 'Share your public review or testimonial',
        type: 'text',
        required: false,
      }
    ]
  },
  {
    id: 'support_agent_evaluation',
    name: 'Customer Service Experience Rating',
    description: 'Evaluate customer service interactions, response resolution time, and agent helpfulness.',
    questions: [
      {
        title: 'Did the customer service team resolve your question?',
        type: 'choice',
        choiceType: 'RADIO' as const,
        options: ['Yes, fully resolved on first contact', 'Yes, resolved after multiple interactions', 'Partially resolved', 'No, unresolved'],
        required: true,
      },
      {
        title: 'Agent professionalism and helpfulness',
        type: 'choice',
        choiceType: 'RADIO' as const,
        options: ['5 - Outstanding', '4 - Helpful', '3 - Standard', '2 - Inattentive', '1 - Unhelpful'],
        required: true,
      },
      {
        title: 'Any additional feedback for our support operations team?',
        type: 'text',
        required: false,
      }
    ]
  }
];

/**
 * List Google Forms files belonging to or accessible by the user via Google Drive API
 */
export async function listGoogleForms(): Promise<DriveFormFile[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google to view and manage your Google Forms.');
  }

  const query = encodeURIComponent("mimeType='application/vnd.google-apps.form' and trashed=false");
  const fields = encodeURIComponent('files(id,name,description,createdTime,modifiedTime,webViewLink,iconLink)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=modifiedTime%20desc&pageSize=50`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch Google Forms (${response.status})`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Fetch a specific Google Form's details & questions schema
 */
export async function getGoogleForm(formId: string): Promise<GoogleForm> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google to access this form.');
  }

  const url = `https://forms.googleapis.com/v1/forms/${formId}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to retrieve form details (${response.status})`);
  }

  return response.json();
}

/**
 * Fetch responses submitted to a Google Form
 */
export async function getGoogleFormResponses(formId: string): Promise<FormSubmissionResponse[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google to read form responses.');
  }

  const url = `https://forms.googleapis.com/v1/forms/${formId}/responses`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    // Note: If no responses have been submitted yet, it might return empty or 200 with {}
    if (response.status === 404) {
      return [];
    }
    throw new Error(errorData.error?.message || `Failed to retrieve responses (${response.status})`);
  }

  const data = await response.json();
  return data.responses || [];
}

export interface QuestionDraft {
  title: string;
  type: 'choice' | 'text' | 'scale';
  choiceType?: 'RADIO' | 'CHECKBOX' | 'DROP_DOWN';
  options?: string[];
  required?: boolean;
}

/**
 * Create a new Google Form and populate it with questions
 */
export async function createGoogleFormWithQuestions(
  title: string,
  description?: string,
  questions: QuestionDraft[] = []
): Promise<GoogleForm> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google to create forms.');
  }

  // 1. Initial creation
  const createUrl = 'https://forms.googleapis.com/v1/forms';
  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      info: {
        title: title || 'Untitled Form',
        documentTitle: title || 'Untitled Form',
      },
    }),
  });

  if (!createRes.ok) {
    const errorData = await createRes.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to create form (${createRes.status})`);
  }

  const initialForm: GoogleForm = await createRes.json();
  const formId = initialForm.formId;

  // 2. Prepare batch update requests
  const requests: any[] = [];

  if (description) {
    requests.push({
      updateFormInfo: {
        info: {
          description: description,
        },
        updateMask: 'description',
      },
    });
  }

  questions.forEach((q, index) => {
    let questionItem: any = {
      question: {
        required: q.required ?? true,
      },
    };

    if (q.type === 'text') {
      questionItem.question.textQuestion = {
        paragraph: true,
      };
    } else if (q.type === 'choice') {
      const opts = (q.options && q.options.length > 0)
        ? q.options
        : ['Option 1', 'Option 2', 'Option 3'];
      questionItem.question.choiceQuestion = {
        type: q.choiceType || 'RADIO',
        options: opts.map(val => ({ value: val })),
      };
    } else if (q.type === 'scale') {
      questionItem.question.scaleQuestion = {
        low: 1,
        high: 5,
        lowLabel: 'Poor / Low',
        highLabel: 'Excellent / High',
      };
    }

    requests.push({
      createItem: {
        item: {
          title: q.title,
          questionItem,
        },
        location: {
          index: index,
        },
      },
    });
  });

  if (requests.length > 0) {
    const updateUrl = `https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`;
    const updateRes = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    if (!updateRes.ok) {
      const errorData = await updateRes.json().catch(() => ({}));
      console.warn('Batch update notice:', errorData);
    }
  }

  // Retrieve complete form with all updated items and responderUri
  return getGoogleForm(formId);
}

/**
 * Add a new question to an existing Google Form
 */
export async function addQuestionToForm(
  formId: string,
  question: QuestionDraft,
  index: number = 0
): Promise<any> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google to update forms.');
  }

  let questionItem: any = {
    question: {
      required: question.required ?? true,
    },
  };

  if (question.type === 'text') {
    questionItem.question.textQuestion = {
      paragraph: true,
    };
  } else {
    const opts = (question.options && question.options.length > 0)
      ? question.options
      : ['Option 1', 'Option 2'];
    questionItem.question.choiceQuestion = {
      type: question.choiceType || 'RADIO',
      options: opts.map(val => ({ value: val })),
    };
  }

  const updateUrl = `https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`;
  const res = await fetch(updateUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          createItem: {
            item: {
              title: question.title,
              questionItem,
            },
            location: {
              index,
            },
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to add question (${res.status})`);
  }

  return res.json();
}

/**
 * Delete a Google Form file from Drive.
 * MUST only be invoked after explicit user confirmation in UI.
 */
export async function deleteGoogleForm(formId: string): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google.');
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${formId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok && res.status !== 204 && res.status !== 200) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to delete form (${res.status})`);
  }

  return true;
}
