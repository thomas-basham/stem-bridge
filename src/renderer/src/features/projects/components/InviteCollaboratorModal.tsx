import { useState, type FormEvent } from 'react';
import { Button, Input, Modal, useToast } from '@/components/ui';

interface InviteCollaboratorModalProps {
  open: boolean;
  onClose: () => void;
  onInvite: (email: string) => Promise<void>;
}

export function InviteCollaboratorModal({
  open,
  onClose,
  onInvite,
}: InviteCollaboratorModalProps) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = (): void => {
    setEmail('');
    setErrorMessage(null);
  };

  const handleClose = (): void => {
    if (isSubmitting) {
      return;
    }

    resetForm();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!email.trim()) {
      setErrorMessage('Enter an email address before sending an invite.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const invitedEmail = email.trim();
      await onInvite(invitedEmail);
      toast.success('Invite sent', `${invitedEmail} can now accept project access.`);
      resetForm();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send invite.';
      setErrorMessage(message);
      toast.error('Invite failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Invite Collaborator"
      description="Send a project invite to a collaborator by email."
      closeDisabled={isSubmitting}
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="invite-collaborator-form"
            isLoading={isSubmitting}
            loadingLabel="Sending..."
          >
            Send Invite
          </Button>
        </>
      }
    >
      <form id="invite-collaborator-form" className="modal-form" onSubmit={handleSubmit}>
        <Input
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="collaborator@example.com"
          disabled={isSubmitting}
          required
        />

        {errorMessage ? (
          <p className="auth-form__error" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
