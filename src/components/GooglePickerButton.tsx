/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FolderOpen, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { openGooglePicker, PickedFile } from '@/services/googlePicker';
import { getAccessToken } from '@/services/googleAuth';

interface GooglePickerButtonProps {
  onPicked: (file: PickedFile) => void;
  onError?: (msg: string) => void;
  className?: string;
  label?: string;
  viewId?: string;
  mimeType?: string;
}

export const GooglePickerButton: React.FC<GooglePickerButtonProps> = ({
  onPicked,
  onError,
  className,
  label = "Google Picker",
  viewId = "DOCS",
  mimeType
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = async () => {
    const token = await getAccessToken();
    if (!token) {
      if (onError) {
        onError("Please sign in with Google first to browse your Google Drive files.");
      } else {
        console.warn("Please sign in with Google first to browse your Google Drive files.");
      }
      return;
    }
    setIsOpen(true);
    try {
      await openGooglePicker({
        viewId,
        mimeType,
        onPicked: (file) => {
          setIsOpen(false);
          onPicked(file);
        },
        onCancel: () => {
          setIsOpen(false);
        }
      });
    } catch (err: any) {
      console.error("Picker error:", err);
      if (onError) {
        onError(err?.message || "Failed to launch Google Picker");
      }
      setIsOpen(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isOpen}
      type="button"
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer",
        "bg-[var(--ui-surface)] hover:bg-[var(--ui-bg)] text-[var(--ui-text)] border border-[var(--ui-border)] shadow-xs disabled:opacity-60",
        className
      )}
    >
      {isOpen ? (
        <Loader2 size={13} className="animate-spin text-[var(--ui-accent-text)]" />
      ) : (
        <FolderOpen size={13} className="text-[var(--ui-accent-text)]" />
      )}
      <span>{label}</span>
    </button>
  );
};
