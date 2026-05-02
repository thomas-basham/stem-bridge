import { useState, type FormEvent } from 'react';
import { Button, Input, Modal } from '@/components/ui';

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
      await onInvite(email.trim());
      resetForm();
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to send invite.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Invite Collaborator"
      description="Send a project invite to a collaborator by email."
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="invite-collaborator-form" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Invite'}
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
