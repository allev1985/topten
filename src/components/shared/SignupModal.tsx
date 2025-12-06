"use client";

import { useState } from "react";
import { SignupForm } from "@/components/auth/signup-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import type { SignupModalProps } from "@/types/components";

/**
 * SignupModal component
 * Modal wrapper for signup form with success message handling
 */
export default function SignupModal({ isOpen, onClose }: SignupModalProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSuccess = () => {
    setShowSuccess(true);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset success state when modal closes
      setShowSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create your account</DialogTitle>
          <DialogDescription>
            Start curating your favorite places
          </DialogDescription>
        </DialogHeader>

        {showSuccess ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong className="mb-1 block font-semibold">
                Check your email!
              </strong>
              We&apos;ve sent you a confirmation link. Click it to verify your
              account and get started.
            </AlertDescription>
          </Alert>
        ) : (
          <SignupForm onSuccess={handleSuccess} />
        )}
      </DialogContent>
    </Dialog>
  );
}
