"use client";

import { useRouter } from "next/navigation";
import { LoginForm } from "@/app/(auth)/login/login-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LoginModalProps } from "@/types/components";

export default function LoginModal({
  isOpen,
  onClose,
  redirectTo,
}: LoginModalProps) {
  const router = useRouter();

  const handleSuccess = (data: { redirectTo: string }) => {
    onClose(); // Close modal first
    router.push(data.redirectTo); // Then navigate
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
          <DialogDescription>
            Enter your credentials to access your account
          </DialogDescription>
        </DialogHeader>
        <LoginForm redirectTo={redirectTo} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
